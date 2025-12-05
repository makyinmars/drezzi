import type { TRPCRouterRecord } from "@trpc/server";

import {
  deleteGarmentAssets,
  getGarmentImageUrl,
  getGarmentUploadUrl,
} from "@/services/garment";
import {
  apiGarmentCreate,
  apiGarmentId,
  apiGarmentListFilters,
  apiGarmentUpdate,
  apiGarmentUploadRequest,
} from "@/validators/garment";

import { createErrors } from "../errors";
import { protectedProcedure, publicProcedure } from "../init";
import type { RouterOutput } from "../utils";

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

export type GarmentListProcedure = RouterOutput["garment"]["list"];

export const garmentRouter = {
  list: protectedProcedure
    .input(apiGarmentListFilters)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const garments = await ctx.prisma.garment.findMany({
        where: {
          ...(input.includePublic
            ? { OR: [{ userId }, { isPublic: true }] }
            : { userId }),
          isActive: true,
          ...(input.category && { category: input.category }),
          ...(input.brand && { brand: input.brand }),
          ...(input.tags?.length && { tags: { hasSome: input.tags } }),
          ...(input.colors?.length && { colors: { hasSome: input.colors } }),
          ...(input.minPrice !== undefined && {
            price: { gte: input.minPrice },
          }),
          ...(input.maxPrice !== undefined && {
            price: { lte: input.maxPrice },
          }),
        },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        garments.map(async (g) => ({
          ...g,
          imageUrl: await getGarmentImageUrl(g.imageKey),
          isOwner: g.userId === userId,
        }))
      );
    }),

  publicList: publicProcedure
    .input(apiGarmentListFilters.omit({ includePublic: true }))
    .query(async ({ input, ctx }) => {
      const garments = await ctx.prisma.garment.findMany({
        where: {
          isPublic: true,
          isActive: true,
          ...(input.category && { category: input.category }),
          ...(input.brand && { brand: input.brand }),
          ...(input.tags?.length && { tags: { hasSome: input.tags } }),
          ...(input.colors?.length && { colors: { hasSome: input.colors } }),
        },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        garments.map(async (g) => ({
          ...g,
          imageUrl: await getGarmentImageUrl(g.imageKey),
        }))
      );
    }),

  byId: protectedProcedure.input(apiGarmentId).query(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);
    const userId = ctx.session.user.id;

    const garment = await ctx.prisma.garment.findFirst({
      where: {
        id: input.id,
        OR: [{ userId }, { isPublic: true }],
      },
    });

    if (!garment) {
      throw errors.garmentNotFound();
    }

    return {
      ...garment,
      imageUrl: await getGarmentImageUrl(garment.imageKey),
      isOwner: garment.userId === userId,
    };
  }),

  create: protectedProcedure
    .input(apiGarmentCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const garment = await ctx.prisma.garment.create({
        data: {
          ...input,
          userId,
        },
      });

      if (!garment) {
        throw errors.garmentCreateFailed();
      }

      return garment;
    }),

  update: protectedProcedure
    .input(apiGarmentUpdate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      const existing = await ctx.prisma.garment.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw errors.garmentNotFound();
      }

      const updated = await ctx.prisma.garment.update({
        where: { id },
        data,
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(apiGarmentId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const garment = await ctx.prisma.garment.findFirst({
        where: { id: input.id, userId },
      });

      if (!garment) {
        throw errors.garmentNotFound();
      }

      await deleteGarmentAssets(garment.imageKey);

      const deleted = await ctx.prisma.garment.delete({
        where: { id: input.id },
      });

      return deleted;
    }),

  togglePublic: protectedProcedure
    .input(apiGarmentId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const garment = await ctx.prisma.garment.findFirst({
        where: { id: input.id, userId },
      });

      if (!garment) {
        throw errors.garmentNotFound();
      }

      const updated = await ctx.prisma.garment.update({
        where: { id: input.id },
        data: { isPublic: !garment.isPublic },
      });

      return { success: true, isPublic: updated.isPublic };
    }),

  getUploadUrl: protectedProcedure
    .input(apiGarmentUploadRequest)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      if (!input.contentType.match(IMAGE_TYPE_REGEX)) {
        throw errors.invalidGarmentImage();
      }

      const result = await getGarmentUploadUrl(userId, input.contentType);
      return result;
    }),

  categories: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const counts = await ctx.prisma.garment.groupBy({
      by: ["category"],
      where: {
        OR: [{ userId }, { isPublic: true }],
        isActive: true,
      },
      _count: { category: true },
    });

    return counts.map((c) => ({
      category: c.category,
      count: c._count.category,
    }));
  }),
} satisfies TRPCRouterRecord;
