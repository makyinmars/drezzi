import type { TRPCRouterRecord } from "@trpc/server";

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

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

export type ProfileListProcedure = RouterOutput["profile"]["list"];

export const profileRouter = {
  list: protectedProcedure.query(async ({ ctx }) => {
    const profiles = await ctx.prisma.bodyProfile.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      profiles.map(async (p) => ({
        ...p,
        photoUrl: await getProfilePhotoUrl(p.photoKey),
      }))
    );
  }),

  byId: protectedProcedure
    .input(apiBodyProfileId)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);

      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      return {
        ...profile,
        photoUrl: await getProfilePhotoUrl(profile.photoKey),
      };
    }),

  create: protectedProcedure
    .input(apiBodyProfileCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      if (input.isDefault) {
        await ctx.prisma.bodyProfile.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const profile = await ctx.prisma.bodyProfile.create({
        data: {
          ...input,
          userId,
        },
      });

      if (!profile) {
        throw errors.profileCreateFailed();
      }

      return profile;
    }),

  update: protectedProcedure
    .input(apiBodyProfileUpdate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      const existing = await ctx.prisma.bodyProfile.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw errors.profileNotFound();
      }

      if (data.isDefault) {
        await ctx.prisma.bodyProfile.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const updated = await ctx.prisma.bodyProfile.update({
        where: { id },
        data,
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
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      await deleteProfileAssets(profile.photoKey);

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
} satisfies TRPCRouterRecord;
