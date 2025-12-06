import z from "zod/v4";

const FIT_PREFERENCES = ["slim", "regular", "relaxed", "loose"] as const;

export const apiBodyProfileId = z.object({
  id: z.cuid(),
});

export const apiBodyProfileCreate = z.object({
  name: z.string().min(1).max(100).default("Default"),
  photoId: z.cuid(),
  height: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  hip: z.number().positive().optional(),
  inseam: z.number().positive().optional(),
  chest: z.number().positive().optional(),
  fitPreference: z.enum(FIT_PREFERENCES).default("regular"),
  isDefault: z.boolean().default(false),
});

export const apiBodyProfileUpdate = z.object({
  id: z.cuid(),
  name: z.string().min(1).max(100).optional(),
  photoId: z.cuid().optional(),
  height: z.number().positive().nullable().optional(),
  waist: z.number().positive().nullable().optional(),
  hip: z.number().positive().nullable().optional(),
  inseam: z.number().positive().nullable().optional(),
  chest: z.number().positive().nullable().optional(),
  fitPreference: z.enum(FIT_PREFERENCES).optional(),
  isDefault: z.boolean().optional(),
});

export const apiBodyProfileCreateAndUpdate = z.object({
  id: z.cuid().optional(),
  name: z.string().min(1, "Name is required").max(100),
  photoId: z.cuid().optional(),
  height: z.number().positive().nullable(),
  waist: z.number().positive().nullable(),
  hip: z.number().positive().nullable(),
  inseam: z.number().positive().nullable(),
  chest: z.number().positive().nullable(),
  fitPreference: z.enum(FIT_PREFERENCES),
  isDefault: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const apiProfileUploadRequest = z.object({
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  contentLength: z.number().max(10 * 1024 * 1024),
});

export type BodyProfileId = z.infer<typeof apiBodyProfileId>;
export type BodyProfileCreate = z.infer<typeof apiBodyProfileCreate>;
export type BodyProfileUpdate = z.infer<typeof apiBodyProfileUpdate>;
export type BodyProfileCreateAndUpdate = z.infer<
  typeof apiBodyProfileCreateAndUpdate
>;
export type ProfileUploadRequest = z.infer<typeof apiProfileUploadRequest>;
