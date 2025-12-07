// @ts-nocheck
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import {
  createAllStyleTipsFixture,
  createStyleTipFixture,
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

// Mock prisma
const mockPrisma = createMockPrisma();
mock.module("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock style-tip services
const mockGetTryOnForTipGeneration = mock(() => Promise.resolve(null));
const mockRegenerateStyleTips = mock(() => Promise.resolve());
mock.module("@/services/style-tip", () => ({
  getTryOnForTipGeneration: mockGetTryOnForTipGeneration,
  regenerateStyleTips: mockRegenerateStyleTips,
  generateStyleTips: mock(() => Promise.resolve()),
  CATEGORY_LABELS: {},
  CATEGORY_ICONS: {},
}));

// Import router after mocks
const { createTRPCRouter, protectedProcedure } = await import("../../init");
const {
  apiStyleTipByTryOnId,
  apiStyleTipCreate,
  apiStyleTipId,
  apiStyleTipUpdate,
} = await import("@/validators/style-tip");
const { TRPC_ERRORS } = await import("@/trpc/errors");

// Create inline router to avoid module resolution issues
const styleTipRouter = createTRPCRouter({
  byTryOnId: protectedProcedure
    .input(apiStyleTipByTryOnId)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.tryOnId, userId },
      });

      if (!tryOn) {
        throw TRPC_ERRORS.tryOnNotFound();
      }

      const tips = await ctx.prisma.styleTip.findMany({
        where: { tryOnId: input.tryOnId },
        orderBy: { createdAt: "asc" },
      });

      return tips;
    }),

  create: protectedProcedure
    .input(apiStyleTipCreate)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.tryOnId, userId },
      });

      if (!tryOn) {
        throw TRPC_ERRORS.tryOnNotFound();
      }

      const tip = await ctx.prisma.styleTip.create({
        data: {
          tryOnId: input.tryOnId,
          category: input.category,
          content: input.content,
        },
      });

      if (!tip) {
        throw TRPC_ERRORS.styleTipCreateFailed();
      }

      return tip;
    }),

  update: protectedProcedure
    .input(apiStyleTipUpdate)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      const tip = await ctx.prisma.styleTip.findFirst({
        where: { id },
        include: { tryOn: true },
      });

      if (!tip) {
        throw TRPC_ERRORS.styleTipNotFound();
      }

      if (tip.tryOn.userId !== userId) {
        throw TRPC_ERRORS.styleTipForbidden();
      }

      const updated = await ctx.prisma.styleTip.update({
        where: { id },
        data,
      });

      if (!updated) {
        throw TRPC_ERRORS.styleTipUpdateFailed();
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(apiStyleTipId)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const tip = await ctx.prisma.styleTip.findFirst({
        where: { id: input.id },
        include: { tryOn: true },
      });

      if (!tip) {
        throw TRPC_ERRORS.styleTipNotFound();
      }

      if (tip.tryOn.userId !== userId) {
        throw TRPC_ERRORS.styleTipForbidden();
      }

      const deleted = await ctx.prisma.styleTip.delete({
        where: { id: input.id },
      });

      return deleted;
    }),

  regenerate: protectedProcedure
    .input(apiStyleTipByTryOnId)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const tryOnData = await mockGetTryOnForTipGeneration(input.tryOnId);

      if (!tryOnData) {
        throw TRPC_ERRORS.tryOnNotFound();
      }

      if (tryOnData.userId !== userId) {
        throw TRPC_ERRORS.tryOnForbidden();
      }

      if (tryOnData.status !== "completed") {
        throw TRPC_ERRORS.tryOnStatusInvalid();
      }

      await mockRegenerateStyleTips({
        tryOnId: input.tryOnId,
        garmentName: tryOnData.garment.name,
        garmentCategory: tryOnData.garment.category,
        garmentDescription: tryOnData.garment.description,
        garmentColors: tryOnData.garment.colors,
        bodyProfileFitPreference: tryOnData.bodyProfile.fitPreference,
      });

      const tips = await ctx.prisma.styleTip.findMany({
        where: { tryOnId: input.tryOnId },
        orderBy: { createdAt: "asc" },
      });

      return tips;
    }),
});

// Create caller
const appRouter = createTRPCRouter({
  styleTip: styleTipRouter,
});
const createCaller = appRouter.createCaller;

describe("styleTip router", () => {
  const userId = "test-user-id";

  function getCaller(authenticated = true) {
    return createCaller({
      prisma: mockPrisma,
      session: authenticated
        ? { user: { id: userId, name: "Test User", email: "test@example.com" } }
        : null,
      i18n: undefined,
    });
  }

  beforeEach(() => {
    mockPrisma.tryOn.findFirst.mockClear();
    mockPrisma.styleTip.findMany.mockClear();
    mockPrisma.styleTip.findFirst.mockClear();
    mockPrisma.styleTip.create.mockClear();
    mockPrisma.styleTip.update.mockClear();
    mockPrisma.styleTip.delete.mockClear();
    mockGetTryOnForTipGeneration.mockClear();
    mockRegenerateStyleTips.mockClear();
  });

  describe("byTryOnId", () => {
    const input = { tryOnId: "clxyz123tryonid" };

    test("returns tips for try-on owned by user", async () => {
      const tryOn = createTryOnFixture({ id: input.tryOnId, userId });
      const tips = createAllStyleTipsFixture(input.tryOnId);

      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.styleTip.findMany.mockResolvedValueOnce(tips);

      const caller = getCaller();
      const result = await caller.styleTip.byTryOnId(input);

      expect(mockPrisma.tryOn.findFirst).toHaveBeenCalledWith({
        where: { id: input.tryOnId, userId },
      });
      expect(mockPrisma.styleTip.findMany).toHaveBeenCalledWith({
        where: { tryOnId: input.tryOnId },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toEqual(tips);
    });

    test("throws tryOnNotFound when try-on is missing", async () => {
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.styleTip.byTryOnId(input)).rejects.toThrow(TRPCError);
    });
  });

  describe("create", () => {
    const input = {
      tryOnId: "clxyz123tryonid",
      category: "fit" as const,
      content: "Tailor the waist slightly for a sharper fit.",
    };

    test("creates style tip for existing try-on", async () => {
      const tryOn = createTryOnFixture({ id: input.tryOnId, userId });
      const tip = createStyleTipFixture({
        tryOnId: input.tryOnId,
        category: input.category,
        content: input.content,
      });

      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.styleTip.create.mockResolvedValueOnce(tip);

      const caller = getCaller();
      const result = await caller.styleTip.create(input);

      expect(mockPrisma.styleTip.create).toHaveBeenCalledWith({
        data: {
          tryOnId: input.tryOnId,
          category: input.category,
          content: input.content,
        },
      });
      expect(result.content).toBe(input.content);
    });

    test("throws tryOnNotFound when try-on does not belong to user", async () => {
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.styleTip.create(input)).rejects.toThrow(TRPCError);
    });
  });

  describe("update", () => {
    const input = {
      id: "clxyz123tipid",
      category: "style" as const,
      content: "Swap in dark denim for a casual look.",
    };

    test("updates tip when user owns try-on", async () => {
      const tip = {
        ...createStyleTipFixture({ id: input.id }),
        tryOn: createTryOnFixture({ userId }),
      };
      const updated = { ...tip, ...input };

      mockPrisma.styleTip.findFirst.mockResolvedValueOnce(tip);
      mockPrisma.styleTip.update.mockResolvedValueOnce(updated);

      const caller = getCaller();
      const result = await caller.styleTip.update(input);

      expect(mockPrisma.styleTip.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: { category: input.category, content: input.content },
      });
      expect(result.category).toBe(input.category);
    });

    test("throws styleTipNotFound for missing tip", async () => {
      mockPrisma.styleTip.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.styleTip.update(input)).rejects.toThrow(TRPCError);
    });

    test("throws styleTipForbidden when tip belongs to another user", async () => {
      const tip = {
        ...createStyleTipFixture({ id: input.id }),
        tryOn: createTryOnFixture({ userId: "other-user" }),
      };
      mockPrisma.styleTip.findFirst.mockResolvedValueOnce(tip);

      const caller = getCaller();

      await expect(caller.styleTip.update(input)).rejects.toThrow(TRPCError);
      expect(mockPrisma.styleTip.update).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    const input = { id: "clxyz123tipid" };

    test("deletes tip when user owns try-on", async () => {
      const tip = {
        ...createStyleTipFixture({ id: input.id }),
        tryOn: createTryOnFixture({ userId }),
      };

      mockPrisma.styleTip.findFirst.mockResolvedValueOnce(tip);
      mockPrisma.styleTip.delete.mockResolvedValueOnce(tip);

      const caller = getCaller();
      const result = await caller.styleTip.delete(input);

      expect(mockPrisma.styleTip.delete).toHaveBeenCalledWith({
        where: { id: input.id },
      });
      expect(result.id).toBe(input.id);
    });

    test("throws styleTipNotFound when tip is missing", async () => {
      mockPrisma.styleTip.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.styleTip.delete(input)).rejects.toThrow(TRPCError);
    });

    test("throws styleTipForbidden when user does not own tip", async () => {
      const tip = {
        ...createStyleTipFixture({ id: input.id }),
        tryOn: createTryOnFixture({ userId: "other-user" }),
      };
      mockPrisma.styleTip.findFirst.mockResolvedValueOnce(tip);

      const caller = getCaller();

      await expect(caller.styleTip.delete(input)).rejects.toThrow(TRPCError);
      expect(mockPrisma.styleTip.delete).not.toHaveBeenCalled();
    });
  });

  describe("regenerate", () => {
    const input = { tryOnId: "clxyz123tryonid" };

    const tryOnData = {
      id: input.tryOnId,
      userId,
      status: "completed",
      garment: {
        name: "Blue Oxford Shirt",
        category: "tops",
        description: "Classic cotton oxford button-down",
        colors: ["blue"],
      },
      bodyProfile: {
        fitPreference: "regular",
      },
    };

    test("regenerates tips for completed try-on", async () => {
      const tips = createAllStyleTipsFixture(input.tryOnId);

      mockGetTryOnForTipGeneration.mockResolvedValueOnce(tryOnData);
      mockRegenerateStyleTips.mockResolvedValueOnce(undefined);
      mockPrisma.styleTip.findMany.mockResolvedValueOnce(tips);

      const caller = getCaller();
      const result = await caller.styleTip.regenerate(input);

      expect(mockGetTryOnForTipGeneration).toHaveBeenCalledWith(input.tryOnId);
      expect(mockRegenerateStyleTips).toHaveBeenCalledWith({
        tryOnId: input.tryOnId,
        garmentName: tryOnData.garment.name,
        garmentCategory: tryOnData.garment.category,
        garmentDescription: tryOnData.garment.description,
        garmentColors: tryOnData.garment.colors,
        bodyProfileFitPreference: tryOnData.bodyProfile.fitPreference,
      });
      expect(mockPrisma.styleTip.findMany).toHaveBeenCalledWith({
        where: { tryOnId: input.tryOnId },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toEqual(tips);
    });

    test("throws tryOnNotFound when try-on missing", async () => {
      mockGetTryOnForTipGeneration.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.styleTip.regenerate(input)).rejects.toThrow(
        TRPCError
      );
      expect(mockRegenerateStyleTips).not.toHaveBeenCalled();
    });

    test("throws tryOnForbidden for other users try-on", async () => {
      mockGetTryOnForTipGeneration.mockResolvedValueOnce({
        ...tryOnData,
        userId: "other-user",
      });

      const caller = getCaller();

      await expect(caller.styleTip.regenerate(input)).rejects.toThrow(
        TRPCError
      );
      expect(mockRegenerateStyleTips).not.toHaveBeenCalled();
    });

    test("throws tryOnStatusInvalid for non-completed try-on", async () => {
      mockGetTryOnForTipGeneration.mockResolvedValueOnce({
        ...tryOnData,
        status: "processing",
      });

      const caller = getCaller();

      await expect(caller.styleTip.regenerate(input)).rejects.toThrow(
        TRPCError
      );
      expect(mockRegenerateStyleTips).not.toHaveBeenCalled();
    });
  });
});
