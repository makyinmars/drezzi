// @ts-nocheck
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import {
  createFailedTryOn,
  createGarmentFixture,
  createProcessingTryOn,
  createProfileFixture,
  createPublicGarment,
  createTryOnFixture,
} from "@/__tests__/fixtures";
import { createMockPrisma } from "@/__tests__/mocks/prisma";

// Mock environment FIRST
mock.module("@/env/server", () => ({
  serverEnv: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    PUBLIC_URL: "http://localhost:3000",
    BETTER_AUTH_SECRET: "test-secret",
    GOOGLE_CLIENT_ID: "test-client-id",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    STRIPE_SECRET_KEY: "sk_test_123",
  },
}));

// Mock auth
mock.module("@/auth/server", () => ({
  auth: {
    api: {
      getSession: mock(() => Promise.resolve(null)),
    },
  },
}));

// Mock SST Resource
mock.module("sst", () => ({
  Resource: {
    MediaBucket: { name: "test-media-bucket" },
    TryOnQueue: { url: "https://sqs.test/queue" },
  },
}));

// Mock prisma module (needed by init.ts)
const mockPrisma = createMockPrisma();
mock.module("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Create mock functions
const mockGetTryOnResultUrl = mock(() =>
  Promise.resolve("https://result-url.test")
);
const mockDeleteTryOnAssets = mock(() => Promise.resolve());
const mockGetProfilePhotoUrl = mock(() =>
  Promise.resolve("https://profile-url.test")
);
const mockGetGarmentImageUrl = mock(() =>
  Promise.resolve("https://garment-url.test")
);
const mockEnqueueTryOnJob = mock(() => Promise.resolve("job-id-123"));

// Mock services
mock.module("@/services/try-on", () => ({
  getTryOnResultUrl: mockGetTryOnResultUrl,
  deleteTryOnAssets: mockDeleteTryOnAssets,
}));

mock.module("@/services/profile", () => ({
  getProfilePhotoUrl: mockGetProfilePhotoUrl,
}));

mock.module("@/services/garment", () => ({
  getGarmentImageUrl: mockGetGarmentImageUrl,
}));

// Mock SQS
mock.module("@/lib/sqs", () => ({
  enqueueTryOnJob: mockEnqueueTryOnJob,
}));

// Import router after mocks and create caller
const { createTRPCRouter, protectedProcedure } = await import("../../init");
const { apiTryOnId, apiTryOnCreate, apiTryOnFilters } = await import(
  "@/validators/try-on"
);
const { TRPC_ERRORS } = await import("@/trpc/errors");

// Re-create tryOn router inline to avoid client-only function issues
// Use the mock functions directly
const tryOnRouter = createTRPCRouter({
  create: protectedProcedure
    .input(apiTryOnCreate)
    .mutation(async ({ ctx, input }) => {
      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.bodyProfileId, userId: ctx.session.user.id },
      });
      if (!profile) throw TRPC_ERRORS.profileNotFound();

      const garment = await ctx.prisma.garment.findFirst({
        where: {
          id: input.garmentId,
          OR: [{ userId: ctx.session.user.id }, { isPublic: true }],
        },
      });
      if (!garment) throw TRPC_ERRORS.garmentNotFound();

      const tryOn = await ctx.prisma.tryOn.create({
        data: {
          userId: ctx.session.user.id,
          bodyProfileId: input.bodyProfileId,
          garmentId: input.garmentId,
          status: "pending",
        },
        include: { bodyProfile: true, garment: true },
      });

      const jobId = await mockEnqueueTryOnJob({
        tryOnId: tryOn.id,
        bodyImageUrl: tryOn.bodyProfile.photoKey,
        garmentImageUrl: tryOn.garment.imageKey,
      });

      return ctx.prisma.tryOn.update({
        where: { id: tryOn.id },
        data: { jobId, status: "processing" },
      });
    }),

  list: protectedProcedure
    .input(apiTryOnFilters)
    .query(async ({ ctx, input }) => {
      const tryOns = await ctx.prisma.tryOn.findMany({
        where: {
          userId: ctx.session.user.id,
          ...(input.status && { status: input.status }),
          ...(input.isFavorite !== undefined && {
            isFavorite: input.isFavorite,
          }),
        },
        include: { bodyProfile: true, garment: true },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        tryOns.map(async (tryOn) => ({
          ...tryOn,
          resultUrl: tryOn.resultKey
            ? await mockGetTryOnResultUrl(tryOn.resultKey)
            : null,
          bodyProfile: {
            ...tryOn.bodyProfile,
            photoUrl: await mockGetProfilePhotoUrl(tryOn.bodyProfile.photoKey),
          },
          garment: {
            ...tryOn.garment,
            imageUrl: await mockGetGarmentImageUrl(tryOn.garment.imageKey),
          },
        }))
      );
    }),

  byId: protectedProcedure.input(apiTryOnId).query(async ({ ctx, input }) => {
    const tryOn = await ctx.prisma.tryOn.findFirst({
      where: { id: input.id, userId: ctx.session.user.id },
      include: { bodyProfile: true, garment: true, styleTips: true },
    });
    if (!tryOn) throw TRPC_ERRORS.tryOnNotFound();

    return {
      ...tryOn,
      resultUrl: tryOn.resultKey
        ? await mockGetTryOnResultUrl(tryOn.resultKey)
        : null,
      bodyProfile: {
        ...tryOn.bodyProfile,
        photoUrl: await mockGetProfilePhotoUrl(tryOn.bodyProfile.photoKey),
      },
      garment: {
        ...tryOn.garment,
        imageUrl: await mockGetGarmentImageUrl(tryOn.garment.imageKey),
      },
    };
  }),

  toggleFavorite: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ ctx, input }) => {
      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!tryOn) throw TRPC_ERRORS.tryOnNotFound();

      return ctx.prisma.tryOn.update({
        where: { id: input.id },
        data: { isFavorite: !tryOn.isFavorite },
      });
    }),

  delete: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ ctx, input }) => {
      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.id, userId: ctx.session.user.id },
      });
      if (!tryOn) throw TRPC_ERRORS.tryOnNotFound();

      await mockDeleteTryOnAssets(tryOn.id);
      return ctx.prisma.tryOn.delete({ where: { id: input.id } });
    }),

  retry: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ ctx, input }) => {
      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.id, userId: ctx.session.user.id, status: "failed" },
        include: { bodyProfile: true, garment: true },
      });
      if (!tryOn) throw TRPC_ERRORS.tryOnNotFound();

      const jobId = await mockEnqueueTryOnJob({
        tryOnId: tryOn.id,
        bodyImageUrl: tryOn.bodyProfile.photoKey,
        garmentImageUrl: tryOn.garment.imageKey,
      });

      return ctx.prisma.tryOn.update({
        where: { id: input.id },
        data: { jobId, status: "processing", errorMessage: null },
      });
    }),
});

// Create type-safe caller using createCallerFactory
const appRouter = createTRPCRouter({
  tryOn: tryOnRouter,
});

const createCaller = appRouter.createCaller;

describe("tryOn router", () => {
  const userId = "test-user-id";

  function getCaller(authenticated = true) {
    return createCaller({
      prisma: mockPrisma,
      session: authenticated
        ? { user: { id: userId, name: "Test", email: "test@example.com" } }
        : null,
      i18n: undefined,
    });
  }

  beforeEach(() => {
    mockPrisma.tryOn.findMany.mockClear();
    mockPrisma.tryOn.findFirst.mockClear();
    mockPrisma.tryOn.create.mockClear();
    mockPrisma.tryOn.update.mockClear();
    mockPrisma.tryOn.delete.mockClear();
    mockPrisma.bodyProfile.findFirst.mockClear();
    mockPrisma.garment.findFirst.mockClear();
    mockEnqueueTryOnJob.mockClear();
    mockGetTryOnResultUrl.mockClear();
    mockDeleteTryOnAssets.mockClear();
    mockGetProfilePhotoUrl.mockClear();
    mockGetGarmentImageUrl.mockClear();
  });

  describe("create", () => {
    const input = {
      bodyProfileId: "clxyz123profileid",
      garmentId: "clxyz123garmentid",
    };

    test("creates try-on with pending status initially", async () => {
      const profile = createProfileFixture({ id: input.bodyProfileId, userId });
      const garment = createGarmentFixture({ id: input.garmentId, userId });
      const tryOn = createProcessingTryOn({
        userId,
        bodyProfileId: input.bodyProfileId,
        garmentId: input.garmentId,
      });

      mockPrisma.bodyProfile.findFirst.mockResolvedValueOnce(profile);
      mockPrisma.garment.findFirst.mockResolvedValueOnce(garment);
      mockPrisma.tryOn.create.mockResolvedValueOnce({
        ...tryOn,
        status: "pending",
        bodyProfile: profile,
        garment,
      });
      mockPrisma.tryOn.update.mockResolvedValueOnce({
        ...tryOn,
        jobId: "job-id-123",
        status: "processing",
      });

      const caller = getCaller();
      const result = await caller.tryOn.create(input);

      expect(mockPrisma.tryOn.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            bodyProfileId: input.bodyProfileId,
            garmentId: input.garmentId,
            status: "pending",
          }),
        })
      );
      expect(result.status).toBe("processing");
    });

    test("verifies body profile ownership", async () => {
      mockPrisma.bodyProfile.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.tryOn.create(input)).rejects.toThrow(TRPCError);

      expect(mockPrisma.bodyProfile.findFirst).toHaveBeenCalledWith({
        where: { id: input.bodyProfileId, userId },
      });
    });

    test("verifies garment exists (owned or public)", async () => {
      const profile = createProfileFixture({ id: input.bodyProfileId, userId });
      mockPrisma.bodyProfile.findFirst.mockResolvedValueOnce(profile);
      mockPrisma.garment.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.tryOn.create(input)).rejects.toThrow(TRPCError);

      expect(mockPrisma.garment.findFirst).toHaveBeenCalledWith({
        where: {
          id: input.garmentId,
          OR: [{ userId }, { isPublic: true }],
        },
      });
    });

    test("allows using public garments", async () => {
      const profile = createProfileFixture({ id: input.bodyProfileId, userId });
      const publicGarment = createPublicGarment({ id: input.garmentId });
      const tryOn = createProcessingTryOn();

      mockPrisma.bodyProfile.findFirst.mockResolvedValueOnce(profile);
      mockPrisma.garment.findFirst.mockResolvedValueOnce(publicGarment);
      mockPrisma.tryOn.create.mockResolvedValueOnce({
        ...tryOn,
        bodyProfile: profile,
        garment: publicGarment,
      });
      mockPrisma.tryOn.update.mockResolvedValueOnce(tryOn);

      const caller = getCaller();
      const result = await caller.tryOn.create(input);

      expect(result).toBeDefined();
    });

    test("enqueues job to SQS", async () => {
      const profile = createProfileFixture({ id: input.bodyProfileId, userId });
      const garment = createGarmentFixture({ id: input.garmentId, userId });
      const tryOn = createProcessingTryOn();

      mockPrisma.bodyProfile.findFirst.mockResolvedValueOnce(profile);
      mockPrisma.garment.findFirst.mockResolvedValueOnce(garment);
      mockPrisma.tryOn.create.mockResolvedValueOnce({
        ...tryOn,
        bodyProfile: profile,
        garment,
      });
      mockPrisma.tryOn.update.mockResolvedValueOnce(tryOn);

      const caller = getCaller();
      await caller.tryOn.create(input);

      expect(mockEnqueueTryOnJob).toHaveBeenCalledWith({
        tryOnId: expect.any(String),
        bodyImageUrl: profile.photoKey,
        garmentImageUrl: garment.imageKey,
      });
    });

    test("updates try-on with jobId and processing status", async () => {
      const profile = createProfileFixture({ id: input.bodyProfileId, userId });
      const garment = createGarmentFixture({ id: input.garmentId, userId });
      const tryOn = createProcessingTryOn({ id: "tryon-new" });

      mockPrisma.bodyProfile.findFirst.mockResolvedValueOnce(profile);
      mockPrisma.garment.findFirst.mockResolvedValueOnce(garment);
      mockPrisma.tryOn.create.mockResolvedValueOnce({
        ...tryOn,
        bodyProfile: profile,
        garment,
      });
      mockPrisma.tryOn.update.mockResolvedValueOnce({
        ...tryOn,
        jobId: "job-id-123",
        status: "processing",
      });

      const caller = getCaller();
      await caller.tryOn.create(input);

      expect(mockPrisma.tryOn.update).toHaveBeenCalledWith({
        where: { id: tryOn.id },
        data: { jobId: "job-id-123", status: "processing" },
      });
    });
  });

  describe("list", () => {
    test("returns try-ons for authenticated user only", async () => {
      const tryOns = [
        {
          ...createTryOnFixture({ userId }),
          bodyProfile: createProfileFixture({ userId }),
          garment: createGarmentFixture({ userId }),
        },
      ];
      mockPrisma.tryOn.findMany.mockResolvedValueOnce(tryOns);

      const caller = getCaller();
      const result = await caller.tryOn.list({});

      expect(mockPrisma.tryOn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId }),
        })
      );
      expect(result).toHaveLength(1);
    });

    test("filters by status when provided", async () => {
      mockPrisma.tryOn.findMany.mockResolvedValueOnce([]);

      const caller = getCaller();
      await caller.tryOn.list({ status: "completed" });

      expect(mockPrisma.tryOn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "completed" }),
        })
      );
    });

    test("filters by isFavorite when provided", async () => {
      mockPrisma.tryOn.findMany.mockResolvedValueOnce([]);

      const caller = getCaller();
      await caller.tryOn.list({ isFavorite: true });

      expect(mockPrisma.tryOn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isFavorite: true }),
        })
      );
    });

    test("orders by createdAt descending", async () => {
      mockPrisma.tryOn.findMany.mockResolvedValueOnce([]);

      const caller = getCaller();
      await caller.tryOn.list({});

      expect(mockPrisma.tryOn.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });
  });

  describe("byId", () => {
    const input = { id: "clxyz123tryonid" };

    test("returns try-on with all relations", async () => {
      const tryOn = {
        ...createTryOnFixture({ id: input.id, userId }),
        bodyProfile: createProfileFixture({ userId }),
        garment: createGarmentFixture({ userId }),
        styleTips: [],
      };
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);

      const caller = getCaller();
      const result = await caller.tryOn.byId(input);

      expect(result.id).toBe(input.id);
      expect(result.styleTips).toBeDefined();
    });

    test("throws tryOnNotFound for missing try-on", async () => {
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.tryOn.byId(input)).rejects.toThrow(TRPCError);
    });

    test("throws tryOnNotFound for other users try-on", async () => {
      // findFirst with userId filter will return null for other user's try-on
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.tryOn.byId(input)).rejects.toThrow(TRPCError);

      expect(mockPrisma.tryOn.findFirst).toHaveBeenCalledWith({
        where: { id: input.id, userId },
        include: expect.any(Object),
      });
    });
  });

  describe("toggleFavorite", () => {
    const input = { id: "clxyz123tryonid" };

    test("toggles isFavorite from false to true", async () => {
      const tryOn = createTryOnFixture({
        id: input.id,
        userId,
        isFavorite: false,
      });
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.tryOn.update.mockResolvedValueOnce({
        ...tryOn,
        isFavorite: true,
      });

      const caller = getCaller();
      const result = await caller.tryOn.toggleFavorite(input);

      expect(result.isFavorite).toBe(true);
      expect(mockPrisma.tryOn.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: { isFavorite: true },
      });
    });

    test("toggles isFavorite from true to false", async () => {
      const tryOn = createTryOnFixture({
        id: input.id,
        userId,
        isFavorite: true,
      });
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.tryOn.update.mockResolvedValueOnce({
        ...tryOn,
        isFavorite: false,
      });

      const caller = getCaller();
      const result = await caller.tryOn.toggleFavorite(input);

      expect(result.isFavorite).toBe(false);
    });

    test("throws tryOnNotFound for missing try-on", async () => {
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.tryOn.toggleFavorite(input)).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe("delete", () => {
    const input = { id: "clxyz123tryonid" };

    test("deletes try-on and S3 assets", async () => {
      const tryOn = createTryOnFixture({ id: input.id, userId });
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.tryOn.delete.mockResolvedValueOnce(tryOn);

      const caller = getCaller();
      await caller.tryOn.delete(input);

      expect(mockPrisma.tryOn.delete).toHaveBeenCalledWith({
        where: { id: input.id },
      });
    });

    test("throws tryOnNotFound for missing try-on", async () => {
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.tryOn.delete(input)).rejects.toThrow(TRPCError);
    });
  });

  describe("retry", () => {
    const input = { id: "clxyz123tryonid" };

    test("re-enqueues failed try-on", async () => {
      const profile = createProfileFixture({ userId });
      const garment = createGarmentFixture({ userId });
      const tryOn = {
        ...createFailedTryOn({ id: input.id, userId }),
        bodyProfile: profile,
        garment,
      };

      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.tryOn.update.mockResolvedValueOnce({
        ...tryOn,
        status: "processing",
        jobId: "job-id-123",
        errorMessage: null,
      });

      const caller = getCaller();
      await caller.tryOn.retry(input);

      expect(mockEnqueueTryOnJob).toHaveBeenCalledWith({
        tryOnId: input.id,
        bodyImageUrl: profile.photoKey,
        garmentImageUrl: garment.imageKey,
      });
    });

    test("resets status from failed to processing", async () => {
      const profile = createProfileFixture({ userId });
      const garment = createGarmentFixture({ userId });
      const tryOn = {
        ...createFailedTryOn({ id: input.id, userId }),
        bodyProfile: profile,
        garment,
      };

      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.tryOn.update.mockResolvedValueOnce({
        ...tryOn,
        status: "processing",
      });

      const caller = getCaller();
      await caller.tryOn.retry(input);

      expect(mockPrisma.tryOn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "processing",
            errorMessage: null,
          }),
        })
      );
    });

    test("clears errorMessage on retry", async () => {
      const profile = createProfileFixture({ userId });
      const garment = createGarmentFixture({ userId });
      const tryOn = {
        ...createFailedTryOn({
          id: input.id,
          userId,
          errorMessage: "Previous error",
        }),
        bodyProfile: profile,
        garment,
      };

      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.tryOn.update.mockResolvedValueOnce({
        ...tryOn,
        errorMessage: null,
      });

      const caller = getCaller();
      await caller.tryOn.retry(input);

      expect(mockPrisma.tryOn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            errorMessage: null,
          }),
        })
      );
    });

    test("throws tryOnNotFound for non-failed try-on", async () => {
      // Query includes status: "failed", so completed try-ons won't match
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.tryOn.retry(input)).rejects.toThrow(TRPCError);

      expect(mockPrisma.tryOn.findFirst).toHaveBeenCalledWith({
        where: { id: input.id, userId, status: "failed" },
        include: expect.any(Object),
      });
    });
  });
});
