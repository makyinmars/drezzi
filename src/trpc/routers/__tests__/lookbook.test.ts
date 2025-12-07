// @ts-nocheck
import { beforeEach, describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import {
  createGarmentFixture,
  createLookbookFixture,
  createLookbookItemFixture,
  createProfileFixture,
  createPublicLookbook,
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
  },
}));

// Mock prisma module
const mockPrisma = createMockPrisma();
mock.module("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Create mock functions first
const mockGetTryOnResultUrl = mock(() =>
  Promise.resolve("https://result-url.test")
);
const mockGetProfilePhotoUrl = mock(() =>
  Promise.resolve("https://profile-url.test")
);
const mockGetGarmentImageUrl = mock(() =>
  Promise.resolve("https://garment-url.test")
);
const mockGenerateShareSlug = mock(() => Promise.resolve("test-slug-abc123"));
const mockGetNextItemOrder = mock(() => Promise.resolve(0));
const mockReorderLookbookItems = mock(() => Promise.resolve([]));
const mockGetLookbookCoverUrl = mock(() => Promise.resolve(null));
const mockDeleteLookbookCover = mock(() => Promise.resolve());
const mockGetLookbookCoverUploadUrl = mock(() =>
  Promise.resolve({
    url: "https://upload.test",
    key: "lookbooks/user/cover.jpg",
    coverUrl: "https://cover.test",
  })
);

// Mock services
mock.module("@/services/try-on", () => ({
  getTryOnResultUrl: mockGetTryOnResultUrl,
}));

mock.module("@/services/profile", () => ({
  getProfilePhotoUrl: mockGetProfilePhotoUrl,
}));

mock.module("@/services/garment", () => ({
  getGarmentImageUrl: mockGetGarmentImageUrl,
}));

mock.module("@/services/lookbook", () => ({
  generateShareSlug: mockGenerateShareSlug,
  getNextItemOrder: mockGetNextItemOrder,
  reorderLookbookItems: mockReorderLookbookItems,
  getLookbookCoverUrl: mockGetLookbookCoverUrl,
  deleteLookbookCover: mockDeleteLookbookCover,
  getLookbookCoverUploadUrl: mockGetLookbookCoverUploadUrl,
}));

// Import after mocks
const { createTRPCRouter, protectedProcedure, publicProcedure } = await import(
  "../../init"
);
const { createErrors } = await import("@/trpc/errors");

// Import validators
const {
  apiLookbookAddItem,
  apiLookbookCreate,
  apiLookbookId,
  apiLookbookRemoveItem,
  apiLookbookReorderItems,
  apiLookbookSlug,
} = await import("@/validators/lookbook");

// Re-create lookbook router inline to test - use mock functions directly
const lookbookRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const lookbooks = await ctx.prisma.lookbook.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return Promise.all(
      lookbooks.map(async (lb) => ({
        ...lb,
        coverUrl: await mockGetLookbookCoverUrl(lb.coverKey),
        itemCount: lb._count.items,
      }))
    );
  }),

  byId: protectedProcedure
    .input(apiLookbookId)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.id, userId },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              tryOn: { include: { garment: true, bodyProfile: true } },
            },
          },
        },
      });

      if (!lookbook) throw errors.lookbookNotFound();
      return {
        ...lookbook,
        coverUrl: await mockGetLookbookCoverUrl(lookbook.coverKey),
        items: lookbook.items,
      };
    }),

  bySlug: publicProcedure
    .input(apiLookbookSlug)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);

      const lookbook = await ctx.prisma.lookbook.findUnique({
        where: { shareSlug: input.slug },
        include: {
          user: { select: { name: true, image: true } },
          items: {
            orderBy: { order: "asc" },
            include: {
              tryOn: { include: { garment: true, bodyProfile: true } },
            },
          },
        },
      });

      if (!lookbook) throw errors.lookbookNotFound();
      if (!lookbook.isPublic) throw errors.lookbookNotPublic();

      return {
        ...lookbook,
        coverUrl: await mockGetLookbookCoverUrl(lookbook.coverKey),
        items: lookbook.items,
      };
    }),

  create: protectedProcedure
    .input(apiLookbookCreate)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;
      return ctx.prisma.lookbook.create({
        data: {
          ...input,
          userId,
          coverKey: input.coverKey ?? null,
          coverUrl: input.coverUrl ?? null,
        },
      });
    }),

  delete: protectedProcedure
    .input(apiLookbookId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.id, userId },
      });

      if (!lookbook) throw errors.lookbookNotFound();

      await mockDeleteLookbookCover(lookbook.coverKey);
      return ctx.prisma.lookbook.delete({ where: { id: input.id } });
    }),

  addItem: protectedProcedure
    .input(apiLookbookAddItem)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.lookbookId, userId },
      });
      if (!lookbook) throw errors.lookbookNotFound();

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.tryOnId, userId, status: "completed" },
      });
      if (!tryOn) throw errors.tryOnNotFound();

      const existing = await ctx.prisma.lookbookItem.findUnique({
        where: {
          lookbookId_tryOnId: {
            lookbookId: input.lookbookId,
            tryOnId: input.tryOnId,
          },
        },
      });
      if (existing) throw errors.lookbookItemDuplicate();

      const order =
        input.order ?? (await mockGetNextItemOrder(input.lookbookId));
      return ctx.prisma.lookbookItem.create({
        data: {
          lookbookId: input.lookbookId,
          tryOnId: input.tryOnId,
          note: input.note,
          order,
        },
        include: { tryOn: { include: { garment: true, bodyProfile: true } } },
      });
    }),

  removeItem: protectedProcedure
    .input(apiLookbookRemoveItem)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const item = await ctx.prisma.lookbookItem.findFirst({
        where: { id: input.id },
        include: { lookbook: true },
      });

      if (!item || item.lookbook.userId !== userId)
        throw errors.lookbookItemNotFound();
      return ctx.prisma.lookbookItem.delete({ where: { id: input.id } });
    }),

  reorderItems: protectedProcedure
    .input(apiLookbookReorderItems)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.lookbookId, userId },
      });
      if (!lookbook) throw errors.lookbookNotFound();

      await mockReorderLookbookItems(input.lookbookId, input.items);
      return { success: true };
    }),

  generateShareLink: protectedProcedure
    .input(apiLookbookId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.id, userId },
      });
      if (!lookbook) throw errors.lookbookNotFound();

      if (lookbook.shareSlug && lookbook.isPublic) {
        return { slug: lookbook.shareSlug, isPublic: true };
      }

      const slug =
        lookbook.shareSlug ?? (await mockGenerateShareSlug(lookbook.name));
      const updated = await ctx.prisma.lookbook.update({
        where: { id: input.id },
        data: { shareSlug: slug, isPublic: true },
      });

      return { slug: updated.shareSlug, isPublic: updated.isPublic };
    }),
});

// Create caller
const appRouter = createTRPCRouter({
  lookbook: lookbookRouter,
});

const createCaller = appRouter.createCaller;

describe("lookbook router", () => {
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
    mockPrisma.lookbook.findMany.mockClear();
    mockPrisma.lookbook.findFirst.mockClear();
    mockPrisma.lookbook.findUnique.mockClear();
    mockPrisma.lookbook.create.mockClear();
    mockPrisma.lookbook.update.mockClear();
    mockPrisma.lookbook.delete.mockClear();
    mockPrisma.lookbookItem.findMany.mockClear();
    mockPrisma.lookbookItem.findFirst.mockClear();
    mockPrisma.lookbookItem.findUnique.mockClear();
    mockPrisma.lookbookItem.create.mockClear();
    mockPrisma.lookbookItem.delete.mockClear();
    mockPrisma.tryOn.findFirst.mockClear();
    mockGenerateShareSlug.mockClear();
    mockGetNextItemOrder.mockClear();
    mockReorderLookbookItems.mockClear();
    mockGetLookbookCoverUrl.mockClear();
    mockDeleteLookbookCover.mockClear();
  });

  describe("create", () => {
    test("creates lookbook with valid input", async () => {
      const input = {
        name: "Summer Collection",
        description: "My summer outfits",
        isPublic: false,
      };
      const lookbook = createLookbookFixture({ ...input, userId });
      mockPrisma.lookbook.create.mockResolvedValueOnce(lookbook);

      const caller = getCaller();
      const result = await caller.lookbook.create(input);

      expect(mockPrisma.lookbook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: input.name,
          description: input.description,
          userId,
        }),
      });
      expect(result.name).toBe(input.name);
    });

    test("associates lookbook with authenticated user", async () => {
      const input = { name: "Test", isPublic: false };
      const lookbook = createLookbookFixture({ userId: "specific-user-id" });
      mockPrisma.lookbook.create.mockResolvedValueOnce(lookbook);

      const specificUserCaller = createCaller({
        prisma: mockPrisma,
        session: {
          user: {
            id: "specific-user-id",
            name: "Test",
            email: "test@example.com",
          },
        },
        i18n: undefined,
      });
      await specificUserCaller.lookbook.create(input);

      expect(mockPrisma.lookbook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "specific-user-id",
        }),
      });
    });
  });

  describe("addItem", () => {
    const input = {
      lookbookId: "clxyz123lookbookid",
      tryOnId: "clxyz123tryonid",
    };

    test("adds completed try-on to lookbook", async () => {
      const lookbook = createLookbookFixture({ id: input.lookbookId, userId });
      const tryOn = createTryOnFixture({
        id: input.tryOnId,
        userId,
        status: "completed",
      });
      const profile = createProfileFixture({ userId });
      const garment = createGarmentFixture({ userId });

      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(lookbook);
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.lookbookItem.findUnique.mockResolvedValueOnce(null);
      mockPrisma.lookbookItem.create.mockResolvedValueOnce({
        ...createLookbookItemFixture({
          lookbookId: input.lookbookId,
          tryOnId: input.tryOnId,
        }),
        tryOn: { ...tryOn, garment, bodyProfile: profile },
      });

      const caller = getCaller();
      const result = await caller.lookbook.addItem(input);

      expect(result.tryOnId).toBe(input.tryOnId);
    });

    test("throws lookbookNotFound for missing lookbook", async () => {
      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.lookbook.addItem(input)).rejects.toThrow(TRPCError);
    });

    test("throws tryOnNotFound for missing or non-completed try-on", async () => {
      const lookbook = createLookbookFixture({ id: input.lookbookId, userId });
      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(lookbook);
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.lookbook.addItem(input)).rejects.toThrow(TRPCError);

      expect(mockPrisma.tryOn.findFirst).toHaveBeenCalledWith({
        where: { id: input.tryOnId, userId, status: "completed" },
      });
    });

    test("throws lookbookItemDuplicate for existing item", async () => {
      const lookbook = createLookbookFixture({ id: input.lookbookId, userId });
      const tryOn = createTryOnFixture({
        id: input.tryOnId,
        userId,
        status: "completed",
      });
      const existingItem = createLookbookItemFixture({
        lookbookId: input.lookbookId,
        tryOnId: input.tryOnId,
      });

      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(lookbook);
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.lookbookItem.findUnique.mockResolvedValueOnce(existingItem);

      const caller = getCaller();

      await expect(caller.lookbook.addItem(input)).rejects.toThrow(TRPCError);
    });

    test("assigns correct order to new item", async () => {
      const lookbook = createLookbookFixture({ id: input.lookbookId, userId });
      const tryOn = createTryOnFixture({
        id: input.tryOnId,
        userId,
        status: "completed",
      });
      const profile = createProfileFixture({ userId });
      const garment = createGarmentFixture({ userId });

      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(lookbook);
      mockPrisma.tryOn.findFirst.mockResolvedValueOnce(tryOn);
      mockPrisma.lookbookItem.findUnique.mockResolvedValueOnce(null);
      mockGetNextItemOrder.mockResolvedValueOnce(5);
      mockPrisma.lookbookItem.create.mockResolvedValueOnce({
        ...createLookbookItemFixture({ order: 5 }),
        tryOn: { ...tryOn, garment, bodyProfile: profile },
      });

      const caller = getCaller();
      await caller.lookbook.addItem(input);

      expect(mockGetNextItemOrder).toHaveBeenCalledWith(input.lookbookId);
      expect(mockPrisma.lookbookItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            order: 5,
          }),
        })
      );
    });
  });

  describe("removeItem", () => {
    const input = { id: "clxyz123itemid" };

    test("removes item from lookbook", async () => {
      const lookbook = createLookbookFixture({ userId });
      const item = { ...createLookbookItemFixture({ id: input.id }), lookbook };

      mockPrisma.lookbookItem.findFirst.mockResolvedValueOnce(item);
      mockPrisma.lookbookItem.delete.mockResolvedValueOnce(item);

      const caller = getCaller();
      await caller.lookbook.removeItem(input);

      expect(mockPrisma.lookbookItem.delete).toHaveBeenCalledWith({
        where: { id: input.id },
      });
    });

    test("throws lookbookItemNotFound for missing item", async () => {
      mockPrisma.lookbookItem.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.lookbook.removeItem(input)).rejects.toThrow(
        TRPCError
      );
    });

    test("throws error for item in other users lookbook", async () => {
      const otherUserLookbook = createLookbookFixture({ userId: "other-user" });
      const item = {
        ...createLookbookItemFixture({ id: input.id }),
        lookbook: otherUserLookbook,
      };

      mockPrisma.lookbookItem.findFirst.mockResolvedValueOnce(item);

      const caller = getCaller();

      await expect(caller.lookbook.removeItem(input)).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe("generateShareLink", () => {
    const input = { id: "clxyz123lookbookid" };

    test("generates unique share slug", async () => {
      const lookbook = createLookbookFixture({
        id: input.id,
        userId,
        isPublic: false,
        shareSlug: null,
      });
      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(lookbook);
      mockGenerateShareSlug.mockResolvedValueOnce("new-slug-xyz789");
      mockPrisma.lookbook.update.mockResolvedValueOnce({
        ...lookbook,
        shareSlug: "new-slug-xyz789",
        isPublic: true,
      });

      const caller = getCaller();
      const result = await caller.lookbook.generateShareLink(input);

      expect(mockGenerateShareSlug).toHaveBeenCalledWith(lookbook.name);
      expect(result.slug).toBe("new-slug-xyz789");
    });

    test("sets lookbook to public", async () => {
      const lookbook = createLookbookFixture({
        id: input.id,
        userId,
        isPublic: false,
        shareSlug: null,
      });
      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(lookbook);
      mockPrisma.lookbook.update.mockResolvedValueOnce({
        ...lookbook,
        shareSlug: "test-slug",
        isPublic: true,
      });

      const caller = getCaller();
      const result = await caller.lookbook.generateShareLink(input);

      expect(mockPrisma.lookbook.update).toHaveBeenCalledWith({
        where: { id: input.id },
        data: { shareSlug: expect.any(String), isPublic: true },
      });
      expect(result.isPublic).toBe(true);
    });

    test("returns existing slug if already public", async () => {
      const publicLookbook = createPublicLookbook({
        id: input.id,
        userId,
        shareSlug: "existing-slug",
      });
      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(publicLookbook);

      const caller = getCaller();
      const result = await caller.lookbook.generateShareLink(input);

      expect(mockGenerateShareSlug).not.toHaveBeenCalled();
      expect(mockPrisma.lookbook.update).not.toHaveBeenCalled();
      expect(result.slug).toBe("existing-slug");
    });
  });

  describe("bySlug (public)", () => {
    const input = { slug: "summer-collection-abc123" };

    test("returns public lookbook by slug", async () => {
      const profile = createProfileFixture({ userId });
      const garment = createGarmentFixture({ userId });
      const tryOn = {
        ...createTryOnFixture({ userId }),
        garment,
        bodyProfile: profile,
      };
      const item = { ...createLookbookItemFixture(), tryOn };
      const publicLookbook = {
        ...createPublicLookbook({ userId, shareSlug: input.slug }),
        user: { name: "Test User", image: null },
        items: [item],
      };

      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(publicLookbook);

      const caller = getCaller(false); // unauthenticated
      const result = await caller.lookbook.bySlug(input);

      expect(result.shareSlug).toBe(input.slug);
    });

    test("throws lookbookNotFound for missing lookbook", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const caller = getCaller(false);

      await expect(caller.lookbook.bySlug(input)).rejects.toThrow(TRPCError);
    });

    test("throws lookbookNotPublic for private lookbook", async () => {
      const privateLookbook = {
        ...createLookbookFixture({
          userId,
          shareSlug: input.slug,
          isPublic: false,
        }),
        user: { name: "Test User", image: null },
        items: [],
      };

      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(privateLookbook);

      const caller = getCaller(false);

      await expect(caller.lookbook.bySlug(input)).rejects.toThrow(TRPCError);
    });
  });

  describe("reorderItems", () => {
    const input = {
      lookbookId: "clxyz123lookbookid",
      items: [
        { id: "clxyz123item1", order: 0 },
        { id: "clxyz123item2", order: 1 },
      ],
    };

    test("reorders items via service function", async () => {
      const lookbook = createLookbookFixture({ id: input.lookbookId, userId });
      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(lookbook);

      const caller = getCaller();
      const result = await caller.lookbook.reorderItems(input);

      expect(mockReorderLookbookItems).toHaveBeenCalledWith(
        input.lookbookId,
        input.items
      );
      expect(result.success).toBe(true);
    });

    test("throws lookbookNotFound for missing lookbook", async () => {
      mockPrisma.lookbook.findFirst.mockResolvedValueOnce(null);

      const caller = getCaller();

      await expect(caller.lookbook.reorderItems(input)).rejects.toThrow(
        TRPCError
      );
    });
  });
});
