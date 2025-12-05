import type { TRPCRouterRecord } from "@trpc/server";

import { enqueueTryOnJob } from "@/lib/sqs";
import { getGarmentImageUrl } from "@/services/garment";
import { getProfilePhotoUrl } from "@/services/profile";
import { deleteTryOnAssets, getTryOnResultUrl } from "@/services/try-on";
import {
  apiTryOnCreate,
  apiTryOnFilters,
  apiTryOnId,
} from "@/validators/try-on";

import { createErrors } from "../errors";
import { protectedProcedure } from "../init";
import type { RouterOutput } from "../utils";

export type TryOnListProcedure = RouterOutput["tryOn"]["list"];

export const tryOnRouter = {
  list: protectedProcedure
    .input(apiTryOnFilters)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const tryOns = await ctx.prisma.tryOn.findMany({
        where: {
          userId,
          ...(input.status && { status: input.status }),
          ...(input.isFavorite !== undefined && {
            isFavorite: input.isFavorite,
          }),
          ...(input.garmentCategory && {
            garment: { category: input.garmentCategory },
          }),
          ...(input.dateFrom && { createdAt: { gte: input.dateFrom } }),
          ...(input.dateTo && { createdAt: { lte: input.dateTo } }),
        },
        include: {
          bodyProfile: true,
          garment: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        tryOns.map(async (t) => ({
          ...t,
          resultUrl: t.resultKey ? await getTryOnResultUrl(t.resultKey) : null,
          bodyProfile: {
            ...t.bodyProfile,
            photoUrl: await getProfilePhotoUrl(t.bodyProfile.photoKey),
          },
          garment: {
            ...t.garment,
            imageUrl: await getGarmentImageUrl(t.garment.imageKey),
          },
        }))
      );
    }),

  byId: protectedProcedure.input(apiTryOnId).query(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);
    const userId = ctx.session.user.id;

    const tryOn = await ctx.prisma.tryOn.findFirst({
      where: { id: input.id, userId },
      include: {
        bodyProfile: true,
        garment: true,
        styleTips: true,
      },
    });

    if (!tryOn) {
      throw errors.tryOnNotFound();
    }

    return {
      ...tryOn,
      resultUrl: tryOn.resultKey
        ? await getTryOnResultUrl(tryOn.resultKey)
        : null,
      bodyProfile: {
        ...tryOn.bodyProfile,
        photoUrl: await getProfilePhotoUrl(tryOn.bodyProfile.photoKey),
      },
      garment: {
        ...tryOn.garment,
        imageUrl: await getGarmentImageUrl(tryOn.garment.imageKey),
      },
    };
  }),

  create: protectedProcedure
    .input(apiTryOnCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      // Verify body profile ownership
      const bodyProfile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.bodyProfileId, userId },
      });

      if (!bodyProfile) {
        throw errors.profileNotFound();
      }

      // Verify garment exists (owned by user or public)
      const garment = await ctx.prisma.garment.findFirst({
        where: {
          id: input.garmentId,
          OR: [{ userId }, { isPublic: true }],
        },
      });

      if (!garment) {
        throw errors.garmentNotFound();
      }

      // Create try-on record
      const tryOn = await ctx.prisma.tryOn.create({
        data: {
          userId,
          bodyProfileId: input.bodyProfileId,
          garmentId: input.garmentId,
          status: "pending",
        },
        include: {
          bodyProfile: true,
          garment: true,
        },
      });

      if (!tryOn) {
        throw errors.tryOnCreateFailed();
      }

      // Enqueue the job
      const jobId = await enqueueTryOnJob({
        tryOnId: tryOn.id,
        bodyImageUrl: bodyProfile.photoKey,
        garmentImageUrl: garment.imageKey,
      });

      // Update with job ID
      await ctx.prisma.tryOn.update({
        where: { id: tryOn.id },
        data: { jobId, status: "processing" },
      });

      return {
        ...tryOn,
        jobId,
        status: "processing" as const,
        resultUrl: null,
        bodyProfile: {
          ...tryOn.bodyProfile,
          photoUrl: await getProfilePhotoUrl(tryOn.bodyProfile.photoKey),
        },
        garment: {
          ...tryOn.garment,
          imageUrl: await getGarmentImageUrl(tryOn.garment.imageKey),
        },
      };
    }),

  toggleFavorite: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.id, userId },
      });

      if (!tryOn) {
        throw errors.tryOnNotFound();
      }

      const updated = await ctx.prisma.tryOn.update({
        where: { id: input.id },
        data: { isFavorite: !tryOn.isFavorite },
      });

      return { success: true, isFavorite: updated.isFavorite };
    }),

  delete: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.id, userId },
      });

      if (!tryOn) {
        throw errors.tryOnNotFound();
      }

      // Clean up S3 assets
      await deleteTryOnAssets(tryOn.resultKey);

      const deleted = await ctx.prisma.tryOn.delete({
        where: { id: input.id },
      });

      return deleted;
    }),

  retry: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.id, userId, status: "failed" },
        include: {
          bodyProfile: true,
          garment: true,
        },
      });

      if (!tryOn) {
        throw errors.tryOnNotFound();
      }

      // Re-enqueue the job
      const jobId = await enqueueTryOnJob({
        tryOnId: tryOn.id,
        bodyImageUrl: tryOn.bodyProfile.photoKey,
        garmentImageUrl: tryOn.garment.imageKey,
      });

      // Reset status
      const updated = await ctx.prisma.tryOn.update({
        where: { id: tryOn.id },
        data: {
          jobId,
          status: "processing",
          errorMessage: null,
        },
      });

      return updated;
    }),

  favorites: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const tryOns = await ctx.prisma.tryOn.findMany({
      where: {
        userId,
        isFavorite: true,
        status: "completed",
      },
      include: {
        bodyProfile: true,
        garment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      tryOns.map(async (t) => ({
        ...t,
        resultUrl: t.resultKey ? await getTryOnResultUrl(t.resultKey) : null,
        bodyProfile: {
          ...t.bodyProfile,
          photoUrl: await getProfilePhotoUrl(t.bodyProfile.photoKey),
        },
        garment: {
          ...t.garment,
          imageUrl: await getGarmentImageUrl(t.garment.imageKey),
        },
      }))
    );
  }),

  recent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const tryOns = await ctx.prisma.tryOn.findMany({
      where: {
        userId,
        status: "completed",
      },
      include: {
        bodyProfile: true,
        garment: true,
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    });

    return Promise.all(
      tryOns.map(async (t) => ({
        ...t,
        resultUrl: t.resultKey ? await getTryOnResultUrl(t.resultKey) : null,
        bodyProfile: {
          ...t.bodyProfile,
          photoUrl: await getProfilePhotoUrl(t.bodyProfile.photoKey),
        },
        garment: {
          ...t.garment,
          imageUrl: await getGarmentImageUrl(t.garment.imageKey),
        },
      }))
    );
  }),
} satisfies TRPCRouterRecord;
