import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import z from "zod/v4";

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
      include: { photo: true },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      profiles.map(async (p) => ({
        ...p,
        photoUrl: await getProfilePhotoUrl(p.photo.key),
      }))
    );
  }),

  byId: protectedProcedure
    .input(apiBodyProfileId)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);

      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
        include: { photo: true },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      return {
        ...profile,
        photoUrl: await getProfilePhotoUrl(profile.photo.key),
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

      const uploaded = await uploadFileToS3({
        file,
        userId,
        prisma: ctx.prisma,
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
        await ctx.prisma.bodyProfile.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const profile = await ctx.prisma.bodyProfile.create({
        data: {
          ...parsed,
          userId,
        },
      });

      if (!profile) {
        throw errors.profileCreateFailed();
      }

      return profile;
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

      const existing = await ctx.prisma.bodyProfile.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw errors.profileNotFound();
      }

      const file = input.get("file");
      let photoId = existing.photoId;

      if (file instanceof File) {
        const uploaded = await uploadFileToS3({
          file,
          userId,
          prisma: ctx.prisma,
          prefix: "profiles",
          allowedMimeTypes: IMAGE_TYPE_REGEX,
        });
        photoId = uploaded.id;
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

      if (parsed.isDefault) {
        await ctx.prisma.bodyProfile.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await ctx.prisma.bodyProfile.update({
        where: { id },
        data: updateData,
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(apiBodyProfileId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.id, userId },
        include: { photo: true },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      await deleteProfileAssets(profile.photo.key);

      const deleted = await ctx.prisma.bodyProfile.delete({
        where: { id: input.id },
      });

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
