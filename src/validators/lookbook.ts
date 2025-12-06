import z from "zod/v4";

// ID validators
export const apiLookbookId = z.object({
  id: z.cuid(),
});

export const apiLookbookSlug = z.object({
  slug: z.string().min(1).max(200),
});

export const apiLookbookItemId = z.object({
  id: z.cuid(),
});

// Create lookbook
export const apiLookbookCreate = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional(),
  coverId: z.cuid().optional(),
  isPublic: z.boolean().default(false),
});

// Update lookbook
export const apiLookbookUpdate = z.object({
  id: z.cuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  coverId: z.cuid().nullable().optional(),
  isPublic: z.boolean().optional(),
});

// RHF form schema
export const apiLookbookCreateAndUpdate = z.object({
  id: z.cuid().optional(),
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).nullable(),
  coverId: z.cuid().optional(),
  isPublic: z.boolean(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Add item to lookbook
export const apiLookbookAddItem = z.object({
  lookbookId: z.cuid(),
  tryOnId: z.cuid(),
  note: z.string().max(500).optional(),
  order: z.number().int().nonnegative().optional(),
});

// Remove item from lookbook
export const apiLookbookRemoveItem = z.object({
  id: z.cuid(),
});

// Update item note
export const apiLookbookUpdateItemNote = z.object({
  id: z.cuid(),
  note: z.string().max(500).nullable(),
});

// Reorder items
export const apiLookbookReorderItems = z.object({
  lookbookId: z.cuid(),
  items: z.array(
    z.object({
      id: z.cuid(),
      order: z.number().int().nonnegative(),
    })
  ),
});

// Cover upload request
export const apiLookbookCoverUpload = z.object({
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  contentLength: z.number().max(5 * 1024 * 1024),
});

// Type exports
export type LookbookId = z.infer<typeof apiLookbookId>;
export type LookbookSlug = z.infer<typeof apiLookbookSlug>;
export type LookbookItemId = z.infer<typeof apiLookbookItemId>;
export type LookbookCreate = z.infer<typeof apiLookbookCreate>;
export type LookbookUpdate = z.infer<typeof apiLookbookUpdate>;
export type LookbookCreateAndUpdate = z.infer<
  typeof apiLookbookCreateAndUpdate
>;
export type LookbookAddItem = z.infer<typeof apiLookbookAddItem>;
export type LookbookRemoveItem = z.infer<typeof apiLookbookRemoveItem>;
export type LookbookUpdateItemNote = z.infer<typeof apiLookbookUpdateItemNote>;
export type LookbookReorderItems = z.infer<typeof apiLookbookReorderItems>;
export type LookbookCoverUpload = z.infer<typeof apiLookbookCoverUpload>;
