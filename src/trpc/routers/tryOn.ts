import type { TRPCRouterRecord } from "@trpc/server";
import z from "zod/v4";

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
          result: true,
          bodyProfile: { include: { photo: true } },
          garment: { include: { image: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        tryOns.map(async (t) => ({
          ...t,
          resultUrl: t.result ? await getTryOnResultUrl(t.result.key) : null,
          bodyProfile: {
            ...t.bodyProfile,
            photoUrl: await getProfilePhotoUrl(t.bodyProfile.photo.key),
          },
          garment: {
            ...t.garment,
            imageUrl: await getGarmentImageUrl(t.garment.image.key),
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
        result: true,
        bodyProfile: { include: { photo: true } },
        garment: { include: { image: true } },
        styleTips: true,
      },
    });

    if (!tryOn) {
      throw errors.tryOnNotFound();
    }

    return {
      ...tryOn,
      resultUrl: tryOn.result
        ? await getTryOnResultUrl(tryOn.result.key)
        : null,
      bodyProfile: {
        ...tryOn.bodyProfile,
        photoUrl: await getProfilePhotoUrl(tryOn.bodyProfile.photo.key),
      },
      garment: {
        ...tryOn.garment,
        imageUrl: await getGarmentImageUrl(tryOn.garment.image.key),
      },
    };
  }),

  create: protectedProcedure
    .input(z.union([apiTryOnCreate, z.instanceof(FormData)]))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const parsed =
        input instanceof FormData
          ? apiTryOnCreate.parse({
              bodyProfileId: input.get("bodyProfileId")?.toString() ?? "",
              garmentId: input.get("garmentId")?.toString() ?? "",
            })
          : input;

      const bodyProfile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: parsed.bodyProfileId, userId },
        include: { photo: true },
      });

      if (!bodyProfile) {
        throw errors.profileNotFound();
      }

      const garment = await ctx.prisma.garment.findFirst({
        where: {
          id: parsed.garmentId,
          OR: [{ userId }, { isPublic: true }],
        },
        include: { image: true },
      });

      if (!garment) {
        throw errors.garmentNotFound();
      }

      const tryOn = await ctx.prisma.tryOn.create({
        data: {
          userId,
          bodyProfileId: parsed.bodyProfileId,
          garmentId: parsed.garmentId,
          status: "pending",
        },
        include: {
          bodyProfile: { include: { photo: true } },
          garment: { include: { image: true } },
        },
      });

      if (!tryOn) {
        throw errors.tryOnCreateFailed();
      }

      const jobId = await enqueueTryOnJob({
        tryOnId: tryOn.id,
        bodyImageUrl: bodyProfile.photo.key,
        garmentImageUrl: garment.image.key,
      });

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
          photoUrl: await getProfilePhotoUrl(tryOn.bodyProfile.photo.key),
        },
        garment: {
          ...tryOn.garment,
          imageUrl: await getGarmentImageUrl(tryOn.garment.image.key),
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
        include: { result: true },
      });

      if (!tryOn) {
        throw errors.tryOnNotFound();
      }

      await deleteTryOnAssets(tryOn.result?.key ?? null);

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
          bodyProfile: { include: { photo: true } },
          garment: { include: { image: true } },
        },
      });

      if (!tryOn) {
        throw errors.tryOnNotFound();
      }

      const jobId = await enqueueTryOnJob({
        tryOnId: tryOn.id,
        bodyImageUrl: tryOn.bodyProfile.photo.key,
        garmentImageUrl: tryOn.garment.image.key,
      });

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
        result: true,
        bodyProfile: { include: { photo: true } },
        garment: { include: { image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Promise.all(
      tryOns.map(async (t) => ({
        ...t,
        resultUrl: t.result ? await getTryOnResultUrl(t.result.key) : null,
        bodyProfile: {
          ...t.bodyProfile,
          photoUrl: await getProfilePhotoUrl(t.bodyProfile.photo.key),
        },
        garment: {
          ...t.garment,
          imageUrl: await getGarmentImageUrl(t.garment.image.key),
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
        result: true,
        bodyProfile: { include: { photo: true } },
        garment: { include: { image: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    });

    return Promise.all(
      tryOns.map(async (t) => ({
        ...t,
        resultUrl: t.result ? await getTryOnResultUrl(t.result.key) : null,
        bodyProfile: {
          ...t.bodyProfile,
          photoUrl: await getProfilePhotoUrl(t.bodyProfile.photo.key),
        },
        garment: {
          ...t.garment,
          imageUrl: await getGarmentImageUrl(t.garment.image.key),
        },
      }))
    );
  }),
} satisfies TRPCRouterRecord;
