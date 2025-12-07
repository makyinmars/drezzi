import z from "zod/v4";

import { CREDIT_PACKAGES, type PackageId } from "@/services/credits/constants";

const packageIds = Object.keys(CREDIT_PACKAGES) as [PackageId, ...PackageId[]];

export const apiPackageId = z.object({
  packageId: z.enum(packageIds),
});

export const apiSessionId = z.object({
  sessionId: z.string(),
});

export const apiHistoryFilters = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type PackageIdInput = z.infer<typeof apiPackageId>;
export type SessionIdInput = z.infer<typeof apiSessionId>;
export type HistoryFilters = z.infer<typeof apiHistoryFilters>;
