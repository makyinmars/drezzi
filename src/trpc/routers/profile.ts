import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

import { enqueueUpscaleJob } from "@/lib/upscale-sqs";
import {
  deleteProfileAssets,
  getProfilePhotoUrl,
  getProfileUploadUrl,
  setDefaultProfile,
} from "@/services/profile";
import {
  apiBodyProfileCreate,
  apiBodyProfileId,
  apiBodyProfileUpdate,
  apiProfileUploadRequest,
} from "@/validators/profile";

import { createErrors } from "../errors";
import { protectedProcedure } from "../init";
import type { RouterOutput } from "../utils";
import { uploadFileToS3 } from "../utils/file-upload";

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

export type ProfileListProcedure = RouterOutput["profile"]["list"];

const toOptionalNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string" || value.trim() === "") return;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toNullableNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return;
  if (value.trim() === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toBoolean = (value: FormDataEntryValue | null, fallback = false) => {
  if (typeof value !== "string") return fallback;
  return value === "true";
};

export const profileRouter = {
  list: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await ctx.prisma.bodyProfile.findMany({
      where: { userId: ctx.session.user.id },
      include: { photo: true, enhancedPhoto: true },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      profiles.map(async (p) => ({
        ...p,
        photoUrl: await getProfilePhotoUrl(p.photo.key),
        enhancedPhotoUrl: p.enhancedPhoto
          ? await getProfilePhotoUrl(p.enhancedPhoto.key)
          : null,
      }))
    );
  }),

  byId: protectedProcedure
    .input(apiBodyProfileId)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);

      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { photo: true, enhancedPhoto: true },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      return {
        ...profile,
        photoUrl: await getProfilePhotoUrl(profile.photo.key),
        enhancedPhotoUrl: profile.enhancedPhoto
          ? await getProfilePhotoUrl(profile.enhancedPhoto.key)
          : null,
      };
    }),

  create: protectedProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const file = input.get("file");
      if (!(file instanceof File)) {
        throw errors.invalidProfileImage();
      }

      return await ctx.prisma.$transaction(async (tx) => {
        const uploaded = await uploadFileToS3({
          file,
          userId,
          prisma: tx,
          prefix: "profiles",
          allowedMimeTypes: IMAGE_TYPE_REGEX,
        });

        const parsed = apiBodyProfileCreate.parse({
          name: input.get("name")?.toString(),
          photoId: uploaded.id,
          height: toOptionalNumber(input.get("height")),
          waist: toOptionalNumber(input.get("waist")),
          hip: toOptionalNumber(input.get("hip")),
          inseam: toOptionalNumber(input.get("inseam")),
          chest: toOptionalNumber(input.get("chest")),
          fitPreference: input.get("fitPreference")?.toString(),
          isDefault: toBoolean(input.get("isDefault"), false),
        });

        if (parsed.isDefault) {
          await tx.bodyProfile.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
          });
        }

        const profile = await tx.bodyProfile.create({
          data: {
            ...parsed,
            userId,
            enhancementStatus: "PENDING",
          },
        });

        // Auto-trigger upscale (fire-and-forget, outside transaction)
        enqueueUpscaleJob({
          type: "profile",
          entityId: profile.id,
          userId,
          sourceImageKey: uploaded.key,
        }).catch((err) => {
          console.error(
            `Failed to enqueue upscale for profile ${profile.id}:`,
            err
          );
        });

        return profile;
      });
    }),

  update: protectedProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const id = input.get("id")?.toString();
      if (!id) {
        throw errors.invalidInput();
      }

      const file = input.get("file");

      return await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.bodyProfile.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          throw errors.profileNotFound();
        }

        let photoId = existing.photoId;
        let newPhotoKey: string | null = null;

        if (file instanceof File) {
          const uploaded = await uploadFileToS3({
            file,
            userId,
            prisma: tx,
            prefix: "profiles",
            allowedMimeTypes: IMAGE_TYPE_REGEX,
          });
          photoId = uploaded.id;
          newPhotoKey = uploaded.key;
        }

        const parsed = apiBodyProfileUpdate.parse({
          id,
          name: input.get("name")?.toString(),
          photoId,
          height: toNullableNumber(input.get("height")),
          waist: toNullableNumber(input.get("waist")),
          hip: toNullableNumber(input.get("hip")),
          inseam: toNullableNumber(input.get("inseam")),
          chest: toNullableNumber(input.get("chest")),
          fitPreference: input.get("fitPreference")?.toString(),
          isDefault: toBoolean(input.get("isDefault"), existing.isDefault),
        });

        const updateData: Record<string, unknown> = {};
        if (parsed.name !== undefined) updateData.name = parsed.name;
        if (parsed.photoId !== undefined) updateData.photoId = parsed.photoId;
        if (parsed.height !== undefined) updateData.height = parsed.height;
        if (parsed.waist !== undefined) updateData.waist = parsed.waist;
        if (parsed.hip !== undefined) updateData.hip = parsed.hip;
        if (parsed.inseam !== undefined) updateData.inseam = parsed.inseam;
        if (parsed.chest !== undefined) updateData.chest = parsed.chest;
        if (parsed.fitPreference !== undefined)
          updateData.fitPreference = parsed.fitPreference;
        if (parsed.isDefault !== undefined)
          updateData.isDefault = parsed.isDefault;

        // Update other profiles BEFORE updating the target profile
        if (parsed.isDefault) {
          await tx.bodyProfile.updateMany({
            where: { userId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }

        // If new photo uploaded, reset enhancement and trigger upscale
        if (newPhotoKey) {
          updateData.enhancementStatus = "PENDING";
          updateData.enhancedPhotoId = null;
          updateData.enhancementError = null;
        }

        const updated = await tx.bodyProfile.update({
          where: { id },
          data: updateData,
        });

        // Auto-trigger upscale for new photo (fire-and-forget)
        if (newPhotoKey) {
          enqueueUpscaleJob({
            type: "profile",
            entityId: id,
            userId,
            sourceImageKey: newPhotoKey,
          }).catch((err) => {
            console.error(`Failed to enqueue upscale for profile ${id}:`, err);
          });
        }

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(apiBodyProfileId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      // Store key for S3 cleanup after transaction
      let photoKey: string | null = null;

      const deleted = await ctx.prisma.$transaction(async (tx) => {
        const profile = await tx.bodyProfile.findFirst({
          where: { id: input.id, userId },
          include: { photo: true },
        });

        if (!profile) {
          throw errors.profileNotFound();
        }

        photoKey = profile.photo.key;

        return await tx.bodyProfile.delete({
          where: { id: input.id },
        });
      });

      // S3 cleanup after transaction commits (fire-and-forget)
      if (photoKey) {
        deleteProfileAssets(photoKey).catch(() => {});
      }

      return deleted;
    }),

  setDefault: protectedProcedure
    .input(apiBodyProfileId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.id, userId },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      await setDefaultProfile(userId, input.id);

      return { success: true };
    }),

  getUploadUrl: protectedProcedure
    .input(apiProfileUploadRequest)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      if (!input.contentType.match(IMAGE_TYPE_REGEX)) {
        throw errors.invalidProfileImage();
      }

      const result = await getProfileUploadUrl(userId, input.contentType);
      return result;
    }),

  uploadPhoto: protectedProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const file = input.get("file");

      if (!(file instanceof File)) {
        throw errors.invalidProfileImage();
      }

      try {
        const uploaded = await uploadFileToS3({
          file,
          userId,
          prisma: ctx.prisma,
          prefix: "profiles",
          allowedMimeTypes: IMAGE_TYPE_REGEX,
        });

        return { fileId: uploaded.id, key: uploaded.key };
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        throw errors.profileUploadFailed();
      }
    }),
} satisfies TRPCRouterRecord;
