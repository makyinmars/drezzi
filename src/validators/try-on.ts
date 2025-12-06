import z from "zod/v4";

export const TRYON_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export const apiTryOnId = z.object({
  id: z.string(),
});

export const apiTryOnCreate = z.object({
  bodyProfileId: z.string(),
  garmentId: z.string(),
});

export const apiTryOnFilters = z.object({
  status: z.enum(TRYON_STATUSES).optional(),
  isFavorite: z.boolean().optional(),
  garmentCategory: z.string().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
});

export const apiTryOnStatusUpdate = z.object({
  id: z.string(),
  status: z.enum(TRYON_STATUSES),
  resultUrl: z.url().optional(),
  resultKey: z.string().optional(),
  processingMs: z.number().int().nonnegative().optional(),
  confidenceScore: z.number().min(0).max(1).optional(),
  errorMessage: z.string().optional(),
  completedAt: z.date().optional(),
});

export type TryOnId = z.infer<typeof apiTryOnId>;
export type TryOnCreate = z.infer<typeof apiTryOnCreate>;
export type TryOnFilters = z.infer<typeof apiTryOnFilters>;
export type TryOnStatusUpdate = z.infer<typeof apiTryOnStatusUpdate>;
export type TryOnStatus = (typeof TRYON_STATUSES)[number];
