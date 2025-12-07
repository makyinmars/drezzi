import z from "zod/v4";

export const GARMENT_CATEGORIES = [
  "tops",
  "bottoms",
  "dresses",
  "outerwear",
  "shoes",
  "accessories",
] as const;

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export const apiGarmentId = z.object({
  id: z.cuid(),
});

export const apiGarmentCreate = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(GARMENT_CATEGORIES),
  subcategory: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.enum(CURRENCIES).default("USD"),
  imageId: z.cuid(),
  maskId: z.cuid().optional(),
  retailUrl: z.url().optional(),
  colors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
});

export const apiGarmentUpdate = z.object({
  id: z.cuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.enum(GARMENT_CATEGORIES).optional(),
  subcategory: z.string().max(100).nullable().optional(),
  brand: z.string().max(100).nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  currency: z.enum(CURRENCIES).optional(),
  imageId: z.cuid().optional(),
  maskId: z.cuid().nullable().optional(),
  retailUrl: z.url().nullable().optional(),
  colors: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export const apiGarmentCreateAndUpdate = z.object({
  id: z.cuid().optional(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).nullable(),
  category: z.enum(GARMENT_CATEGORIES),
  subcategory: z.string().max(100).nullable(),
  brand: z.string().max(100).nullable(),
  price: z.number().nonnegative().nullable(),
  currency: z.enum(CURRENCIES),
  imageId: z.cuid().optional(),
  maskId: z.cuid().nullable(),
  retailUrl: z.url().nullable(),
  colors: z.array(z.string()),
  sizes: z.array(z.string()),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const apiGarmentUploadRequest = z.object({
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  contentLength: z.number().max(10 * 1024 * 1024),
});

export const apiGarmentImportUrl = z.object({
  url: z.url(),
});

export const apiGarmentListFilters = z.object({
  category: z.enum(GARMENT_CATEGORIES).optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  includePublic: z.boolean().default(false),
});

export type GarmentId = z.infer<typeof apiGarmentId>;
export type GarmentCreate = z.infer<typeof apiGarmentCreate>;
export type GarmentUpdate = z.infer<typeof apiGarmentUpdate>;
export type GarmentCreateAndUpdate = z.infer<typeof apiGarmentCreateAndUpdate>;
export type GarmentUploadRequest = z.infer<typeof apiGarmentUploadRequest>;
export type GarmentImportUrl = z.infer<typeof apiGarmentImportUrl>;
export type GarmentListFilters = z.infer<typeof apiGarmentListFilters>;
export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];
