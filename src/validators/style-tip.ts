import z from "zod/v4";

export const STYLE_TIP_CATEGORIES = [
  "fit",
  "color",
  "style",
  "occasion",
  "accessories",
  "fabric-care",
] as const;

export const apiStyleTipId = z.object({
  id: z.cuid(),
});

export const apiStyleTipByTryOnId = z.object({
  tryOnId: z.cuid(),
});

export const apiStyleTipCreate = z.object({
  tryOnId: z.cuid(),
  category: z.enum(STYLE_TIP_CATEGORIES),
  content: z.string().min(1, "Content is required").max(1000),
});

export const apiStyleTipUpdate = z.object({
  id: z.cuid(),
  category: z.enum(STYLE_TIP_CATEGORIES).optional(),
  content: z.string().min(1).max(1000).optional(),
});

export const apiStyleTipForm = z.object({
  id: z.cuid().optional(),
  tryOnId: z.cuid(),
  category: z.enum(STYLE_TIP_CATEGORIES),
  content: z.string().min(1, "Content is required").max(1000),
});

export type StyleTipCategory = (typeof STYLE_TIP_CATEGORIES)[number];
export type StyleTipId = z.infer<typeof apiStyleTipId>;
export type StyleTipByTryOnId = z.infer<typeof apiStyleTipByTryOnId>;
export type StyleTipCreate = z.infer<typeof apiStyleTipCreate>;
export type StyleTipUpdate = z.infer<typeof apiStyleTipUpdate>;
export type StyleTipForm = z.infer<typeof apiStyleTipForm>;
