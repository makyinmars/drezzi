import type { TRPCRouterRecord } from "@trpc/server";
import z from "zod/v4";

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
import { uploadFileToS3 } from "../utils/file-upload";

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

export type GarmentListProcedure = RouterOutput["garment"]["list"];

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

const toNullableString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return;
  return value.trim() === "" ? null : value;
};

const toOptionalString = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return;
  return value.trim() === "" ? undefined : value;
};

const toBoolean = (value: FormDataEntryValue | null, fallback = false) => {
  if (typeof value !== "string") return fallback;
  return value === "true";
};

const toStringArray = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return;
  if (!value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
};

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
        include: { image: true },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        garments.map(async (g) => ({
          ...g,
          imageUrl: await getGarmentImageUrl(g.image.key),
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
        include: { image: true },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        garments.map(async (g) => ({
          ...g,
          imageUrl: await getGarmentImageUrl(g.image.key),
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
      include: { image: true, mask: true },
    });

    if (!garment) {
      throw errors.garmentNotFound();
    }

    return {
      ...garment,
      imageUrl: await getGarmentImageUrl(garment.image.key),
      isOwner: garment.userId === userId,
    };
  }),

  create: protectedProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const file = input.get("file");
      if (!(file instanceof File)) {
        throw errors.invalidGarmentImage();
      }

      return await ctx.prisma.$transaction(async (tx) => {
        const uploaded = await uploadFileToS3({
          file,
          userId,
          prisma: tx,
          prefix: "garments",
          allowedMimeTypes: IMAGE_TYPE_REGEX,
        });

        const parsed = apiGarmentCreate.parse({
          name: input.get("name")?.toString(),
          description: toOptionalString(input.get("description")),
          category: input.get("category")?.toString(),
          subcategory: toOptionalString(input.get("subcategory")),
          brand: toOptionalString(input.get("brand")),
          price: toOptionalNumber(input.get("price")),
          currency: input.get("currency")?.toString() ?? "USD",
          imageId: uploaded.id,
          maskId: undefined,
          retailUrl: toOptionalString(input.get("retailUrl")),
          colors: toStringArray(input.get("colors")) ?? [],
          sizes: toStringArray(input.get("sizes")) ?? [],
          tags: toStringArray(input.get("tags")) ?? [],
          isActive: toBoolean(input.get("isActive"), true),
          isPublic: toBoolean(input.get("isPublic"), false),
        });

        const garment = await tx.garment.create({
          data: {
            ...parsed,
            userId,
          },
        });

        return garment;
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
        const existing = await tx.garment.findFirst({
          where: { id, userId },
        });

        if (!existing) {
          throw errors.garmentNotFound();
        }

        let imageId = existing.imageId;

        if (file instanceof File) {
          const uploaded = await uploadFileToS3({
            file,
            userId,
            prisma: tx,
            prefix: "garments",
            allowedMimeTypes: IMAGE_TYPE_REGEX,
          });
          imageId = uploaded.id;
        }

        const parsed = apiGarmentUpdate.parse({
          id,
          name: input.get("name")?.toString(),
          description: toNullableString(input.get("description")),
          category: input.get("category")?.toString(),
          subcategory: toNullableString(input.get("subcategory")),
          brand: toNullableString(input.get("brand")),
          price: toNullableNumber(input.get("price")),
          currency: input.get("currency")?.toString(),
          imageId,
          maskId: toNullableString(input.get("maskId")),
          retailUrl: toNullableString(input.get("retailUrl")),
          colors: toStringArray(input.get("colors")),
          sizes: toStringArray(input.get("sizes")),
          tags: toStringArray(input.get("tags")),
          isActive: toBoolean(input.get("isActive"), existing.isActive),
          isPublic: toBoolean(input.get("isPublic"), existing.isPublic),
        });

        const updateData: Record<string, unknown> = {};
        if (parsed.name !== undefined) updateData.name = parsed.name;
        if (parsed.description !== undefined)
          updateData.description = parsed.description;
        if (parsed.category !== undefined)
          updateData.category = parsed.category;
        if (parsed.subcategory !== undefined)
          updateData.subcategory = parsed.subcategory;
        if (parsed.brand !== undefined) updateData.brand = parsed.brand;
        if (parsed.price !== undefined) updateData.price = parsed.price;
        if (parsed.currency !== undefined)
          updateData.currency = parsed.currency;
        if (parsed.imageId !== undefined) updateData.imageId = parsed.imageId;
        if (parsed.maskId !== undefined) updateData.maskId = parsed.maskId;
        if (parsed.retailUrl !== undefined)
          updateData.retailUrl = parsed.retailUrl;
        if (parsed.colors !== undefined) updateData.colors = parsed.colors;
        if (parsed.sizes !== undefined) updateData.sizes = parsed.sizes;
        if (parsed.tags !== undefined) updateData.tags = parsed.tags;
        if (parsed.isActive !== undefined)
          updateData.isActive = parsed.isActive;
        if (parsed.isPublic !== undefined)
          updateData.isPublic = parsed.isPublic;

        const updated = await tx.garment.update({
          where: { id },
          data: updateData,
        });

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(apiGarmentId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      // Store key for S3 cleanup after transaction
      let imageKey: string | null = null;

      const deleted = await ctx.prisma.$transaction(async (tx) => {
        const garment = await tx.garment.findFirst({
          where: { id: input.id, userId },
          include: { image: true },
        });

        if (!garment) {
          throw errors.garmentNotFound();
        }

        imageKey = garment.image.key;

        return await tx.garment.delete({
          where: { id: input.id },
        });
      });

      // S3 cleanup after transaction commits (fire-and-forget)
      if (imageKey) {
        deleteGarmentAssets(imageKey).catch(() => {});
      }

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
