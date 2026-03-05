import type { TRPCRouterRecord } from "@trpc/server";
import { and, eq, gte, lte, or, type SQL, sql } from "drizzle-orm";
import z from "zod/v4";
import { garment } from "@/db/schema";
import { createId } from "@/lib/id";
import {
  deleteGarmentAssets,
  getGarmentImageUrl,
  getGarmentUploadUrl,
} from "@/services/garment";
import { downloadImage, importGarmentFromUrl } from "@/services/garment-import";
import {
  apiGarmentCreate,
  apiGarmentId,
  apiGarmentImportUrl,
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

      const conditions: SQL[] = [eq(garment.isActive, true)];

      if (input.includePublic) {
        const visibility = or(
          eq(garment.userId, userId),
          eq(garment.isPublic, true)
        );
        if (visibility) {
          conditions.push(visibility);
        }
      } else {
        conditions.push(eq(garment.userId, userId));
      }

      if (input.category) {
        conditions.push(eq(garment.category, input.category));
      }
      if (input.brand) {
        conditions.push(eq(garment.brand, input.brand));
      }
      if (input.tags?.length) {
        conditions.push(sql`${garment.tags} && ${input.tags}`);
      }
      if (input.colors?.length) {
        conditions.push(sql`${garment.colors} && ${input.colors}`);
      }
      if (input.minPrice !== undefined) {
        conditions.push(gte(garment.price, input.minPrice));
      }
      if (input.maxPrice !== undefined) {
        conditions.push(lte(garment.price, input.maxPrice));
      }

      const whereClause = and(...conditions);
      if (!whereClause) {
        return [];
      }

      const garments = await ctx.db.query.garment.findMany({
        where: whereClause,
        with: { image: true },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });

      return await Promise.all(
        garments.map(async (g) => ({
          ...g,
          colors: g.colors ?? [],
          sizes: g.sizes ?? [],
          tags: g.tags ?? [],
          metadata: g.metadata ?? {},
          imageUrl: await getGarmentImageUrl(g.image.key),
          isOwner: g.userId === userId,
        }))
      );
    }),

  publicList: publicProcedure
    .input(apiGarmentListFilters.omit({ includePublic: true }))
    .query(async ({ input, ctx }) => {
      const conditions: SQL[] = [
        eq(garment.isPublic, true),
        eq(garment.isActive, true),
      ];

      if (input.category) {
        conditions.push(eq(garment.category, input.category));
      }
      if (input.brand) {
        conditions.push(eq(garment.brand, input.brand));
      }
      if (input.tags?.length) {
        conditions.push(sql`${garment.tags} && ${input.tags}`);
      }
      if (input.colors?.length) {
        conditions.push(sql`${garment.colors} && ${input.colors}`);
      }

      const whereClause = and(...conditions);
      if (!whereClause) {
        return [];
      }

      const garments = await ctx.db.query.garment.findMany({
        where: whereClause,
        with: { image: true },
        orderBy: (t, { desc }) => [desc(t.createdAt)],
      });

      return await Promise.all(
        garments.map(async (g) => ({
          ...g,
          colors: g.colors ?? [],
          sizes: g.sizes ?? [],
          tags: g.tags ?? [],
          metadata: g.metadata ?? {},
          imageUrl: await getGarmentImageUrl(g.image.key),
        }))
      );
    }),

  byId: protectedProcedure.input(apiGarmentId).query(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);
    const userId = ctx.session.user.id;

    const garmentData = await ctx.db.query.garment.findFirst({
      where: (t, { and: andOp, eq: eqOp, or: orOp }) =>
        andOp(
          eqOp(t.id, input.id),
          orOp(eqOp(t.userId, userId), eqOp(t.isPublic, true))
        ),
      with: { image: true, mask: true },
    });

    if (!garmentData) {
      throw errors.garmentNotFound();
    }

    return {
      ...garmentData,
      colors: garmentData.colors ?? [],
      sizes: garmentData.sizes ?? [],
      tags: garmentData.tags ?? [],
      metadata: garmentData.metadata ?? {},
      imageUrl: await getGarmentImageUrl(garmentData.image.key),
      isOwner: garmentData.userId === userId,
    };
  }),

  create: protectedProcedure
    .input(z.instanceof(FormData))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const uploadedFile = input.get("file");
      const preUploadedImageId = toOptionalString(input.get("imageId"));

      if (!(preUploadedImageId || uploadedFile instanceof File)) {
        throw errors.invalidGarmentImage();
      }

      return await ctx.db.transaction(async (tx) => {
        let imageId = preUploadedImageId;

        if (!imageId && uploadedFile instanceof File) {
          const uploaded = await uploadFileToS3({
            file: uploadedFile,
            userId,
            db: tx,
            prefix: "garments",
            allowedMimeTypes: IMAGE_TYPE_REGEX,
          });
          imageId = uploaded.id;
        }

        const parsed = apiGarmentCreate.parse({
          name: input.get("name")?.toString(),
          description: toOptionalString(input.get("description")),
          category: input.get("category")?.toString(),
          subcategory: toOptionalString(input.get("subcategory")),
          brand: toOptionalString(input.get("brand")),
          price: toOptionalNumber(input.get("price")),
          currency: input.get("currency")?.toString() ?? "USD",
          imageId,
          maskId: undefined,
          retailUrl: toOptionalString(input.get("retailUrl")),
          colors: toStringArray(input.get("colors")) ?? [],
          sizes: toStringArray(input.get("sizes")) ?? [],
          tags: toStringArray(input.get("tags")) ?? [],
          isActive: toBoolean(input.get("isActive"), true),
          isPublic: toBoolean(input.get("isPublic"), false),
        });

        const [garmentData] = await tx
          .insert(garment)
          .values({
            id: createId(),
            ...parsed,
            userId,
            updatedAt: new Date(),
          })
          .returning();

        return garmentData;
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
        const existing = await tx.query.garment.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, id), eqOp(t.userId, userId)),
        });

        if (!existing) {
          throw errors.garmentNotFound();
        }

        let imageId = existing.imageId;

        if (uploadedFile instanceof File) {
          const uploaded = await uploadFileToS3({
            file: uploadedFile,
            userId,
            db: tx,
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

        const updateData: Record<string, unknown> = {
          updatedAt: new Date(),
        };
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

        const [updated] = await tx
          .update(garment)
          .set(updateData)
          .where(eq(garment.id, id))
          .returning();

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(apiGarmentId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      let imageKey: string | null = null;

      const deleted = await ctx.db.transaction(async (tx) => {
        const garmentData = await tx.query.garment.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
          with: { image: true },
        });

        if (!garmentData) {
          throw errors.garmentNotFound();
        }

        imageKey = garmentData.image.key;

        const [deletedGarment] = await tx
          .delete(garment)
          .where(eq(garment.id, input.id))
          .returning();

        return deletedGarment;
      });

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

      const garmentData = await ctx.db.query.garment.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
      });

      if (!garmentData) {
        throw errors.garmentNotFound();
      }

      const [updated] = await ctx.db
        .update(garment)
        .set({
          isPublic: !garmentData.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(garment.id, input.id))
        .returning({
          isPublic: garment.isPublic,
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

  importFromUrl: protectedProcedure
    .input(apiGarmentImportUrl)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const extracted = await importGarmentFromUrl(input.url);

      let uploadedImageId: string | null = null;
      let uploadedImageUrl: string | null = null;

      if (extracted.imageUrl) {
        const blob = await downloadImage(extracted.imageUrl, input.url);
        if (blob) {
          const file = new File([blob], "imported-image.jpg", {
            type: blob.type || "image/jpeg",
          });

          const uploaded = await uploadFileToS3({
            file,
            userId,
            db: ctx.db,
            prefix: "garments",
            allowedMimeTypes: IMAGE_TYPE_REGEX,
          });

          uploadedImageId = uploaded.id;
          uploadedImageUrl = await getGarmentImageUrl(uploaded.key);
        }
      }

      return {
        ...extracted,
        retailUrl: input.url,
        uploadedImageId,
        uploadedImageUrl,
      };
    }),

  categories: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const counts = await ctx.db
      .select({
        category: garment.category,
        count: sql<number>`count(*)`,
      })
      .from(garment)
      .where(
        and(
          or(eq(garment.userId, userId), eq(garment.isPublic, true)),
          eq(garment.isActive, true)
        )
      )
      .groupBy(garment.category);

    return counts.map((c) => ({
      category: c.category,
      count: Number(c.count),
    }));
  }),
} satisfies TRPCRouterRecord;
