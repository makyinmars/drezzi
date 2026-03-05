import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq, ne } from "drizzle-orm";
import z from "zod/v4";
import { bodyProfile } from "@/db/schema";
import { createId } from "@/lib/id";
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
    const profiles = await ctx.db.query.bodyProfile.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, ctx.session.user.id),
      with: { photo: true, enhancedPhoto: true },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });

    return await Promise.all(
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

      const profile = await ctx.db.query.bodyProfile.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.id), eqOp(t.userId, ctx.session.user.id)),
        with: { photo: true, enhancedPhoto: true },
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

      const uploadedFile = input.get("file");
      if (!(uploadedFile instanceof File)) {
        throw errors.invalidProfileImage();
      }

      return await ctx.db.transaction(async (tx) => {
        const uploaded = await uploadFileToS3({
          file: uploadedFile,
          userId,
          db: tx,
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
          await tx
            .update(bodyProfile)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(
              and(
                eq(bodyProfile.userId, userId),
                eq(bodyProfile.isDefault, true)
              )
            );
        }

        const [profile] = await tx
          .insert(bodyProfile)
          .values({
            id: createId(),
            ...parsed,
            userId,
            enhancementStatus: "PENDING",
            updatedAt: new Date(),
          })
          .returning();

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

      const uploadedFile = input.get("file");

      return await ctx.db.transaction(async (tx) => {
        const existing = await tx.query.bodyProfile.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, id), eqOp(t.userId, userId)),
        });

        if (!existing) {
          throw errors.profileNotFound();
        }

        let photoId = existing.photoId;
        let newPhotoKey: string | null = null;

        if (uploadedFile instanceof File) {
          const uploaded = await uploadFileToS3({
            file: uploadedFile,
            userId,
            db: tx,
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

        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };
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
          await tx
            .update(bodyProfile)
            .set({
              isDefault: false,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(bodyProfile.userId, userId),
                eq(bodyProfile.isDefault, true),
                ne(bodyProfile.id, id)
              )
            );
        }

        if (newPhotoKey) {
          updateData.enhancementStatus = "PENDING";
          updateData.enhancedPhotoId = null;
          updateData.enhancementError = null;
        }

        const [updated] = await tx
          .update(bodyProfile)
          .set(updateData)
          .where(eq(bodyProfile.id, id))
          .returning();

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

      let photoKey: string | null = null;

      const deleted = await ctx.db.transaction(async (tx) => {
        const profile = await tx.query.bodyProfile.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
          with: { photo: true },
        });

        if (!profile) {
          throw errors.profileNotFound();
        }

        photoKey = profile.photo.key;

        const [deletedProfile] = await tx
          .delete(bodyProfile)
          .where(eq(bodyProfile.id, input.id))
          .returning();

        return deletedProfile;
      });

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

      const profile = await ctx.db.query.bodyProfile.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
        columns: { id: true },
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

      const uploadedFile = input.get("file");

      if (!(uploadedFile instanceof File)) {
        throw errors.invalidProfileImage();
      }

      try {
        const uploaded = await uploadFileToS3({
          file: uploadedFile,
          userId,
          db: ctx.db,
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
