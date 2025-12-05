import type { TryOnStatus } from "@/validators/try-on";

type TryOnFixtureOverrides = {
  id?: string;
  userId?: string;
  bodyProfileId?: string;
  garmentId?: string;
  status?: TryOnStatus;
  resultUrl?: string | null;
  resultKey?: string | null;
  jobId?: string | null;
  processingMs?: number | null;
  confidenceScore?: number | null;
  errorMessage?: string | null;
  isFavorite?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date | null;
};

export function createTryOnFixture(overrides: TryOnFixtureOverrides = {}) {
  const id = overrides.id ?? "clxyz123tryonid";
  return {
    id,
    userId: overrides.userId ?? "test-user-id",
    bodyProfileId: overrides.bodyProfileId ?? "clxyz123profileid",
    garmentId: overrides.garmentId ?? "clxyz123garmentid",
    status: overrides.status ?? "completed",
    resultUrl:
      overrides.resultUrl ??
      `https://test-media-bucket.s3.us-east-2.amazonaws.com/try-ons/${id}/result.png`,
    resultKey: overrides.resultKey ?? `try-ons/${id}/result.png`,
    jobId: overrides.jobId ?? "job-abc123",
    processingMs: overrides.processingMs ?? 5000,
    confidenceScore: overrides.confidenceScore ?? null,
    errorMessage: overrides.errorMessage ?? null,
    isFavorite: overrides.isFavorite ?? false,
    createdAt: overrides.createdAt ?? new Date("2024-01-15T10:00:00Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-15T10:00:05Z"),
    completedAt: overrides.completedAt ?? new Date("2024-01-15T10:00:05Z"),
  };
}

export function createPendingTryOn(overrides: TryOnFixtureOverrides = {}) {
  return createTryOnFixture({
    ...overrides,
    status: "pending",
    resultUrl: null,
    resultKey: null,
    jobId: null,
    processingMs: null,
    completedAt: null,
  });
}

export function createProcessingTryOn(overrides: TryOnFixtureOverrides = {}) {
  return createTryOnFixture({
    ...overrides,
    status: "processing",
    resultUrl: null,
    resultKey: null,
    jobId: overrides.jobId ?? "job-processing-123",
    processingMs: null,
    completedAt: null,
  });
}

export function createFailedTryOn(overrides: TryOnFixtureOverrides = {}) {
  return createTryOnFixture({
    ...overrides,
    status: "failed",
    resultUrl: null,
    resultKey: null,
    processingMs: null,
    errorMessage:
      overrides.errorMessage ?? "AI generation failed: rate limit exceeded",
    completedAt: null,
  });
}
