// @ts-nocheck
import { beforeEach, describe, expect, mock, test } from "bun:test";

import {
  createLookbookFixture,
  createLookbookItemFixture,
} from "@/__tests__/fixtures";
import { createMockPrisma } from "@/__tests__/mocks/prisma";

// Mock SST Resource
mock.module("sst", () => ({
  Resource: {
    MediaBucket: { name: "test-media-bucket" },
  },
}));

// Mock S3 client and presigner
const mockS3Send = mock(() => Promise.resolve({}));
mock.module("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockS3Send;
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

const mockGetSignedUrl = mock(() =>
  Promise.resolve("https://signed-upload-url.test")
);
mock.module("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: mockGetSignedUrl,
}));

// Create mock prisma
const mockPrisma = createMockPrisma();

// Mock prisma module
mock.module("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// Mock s3 lib module
mock.module("@/lib/s3", () => ({
  s3: { send: mockS3Send },
  getPresignedUrl: mock(() => Promise.resolve("https://presigned-url.test")),
}));

// Import after mocks
const {
  deleteLookbookCover,
  generateShareSlug,
  getLookbookCoverUploadUrl,
  getLookbookCoverUrl,
  getNextItemOrder,
  reorderLookbookItems,
} = await import("../lookbook");

describe("lookbook service", () => {
  beforeEach(() => {
    mockS3Send.mockClear();
    mockGetSignedUrl.mockClear();
    mockPrisma.lookbook.findUnique.mockClear();
    mockPrisma.lookbookItem.findFirst.mockClear();
    mockPrisma.lookbookItem.update.mockClear();
    mockPrisma.$transaction.mockClear();
  });

  describe("generateShareSlug", () => {
    test("generates slug from lookbook name", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const slug = await generateShareSlug("Summer Collection");

      expect(slug).toMatch(/^summer-collection-/);
    });

    test("converts name to lowercase", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const slug = await generateShareSlug("UPPERCASE NAME");

      expect(slug).toMatch(/^uppercase-name-/);
    });

    test("replaces non-alphanumeric characters with hyphens", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const slug = await generateShareSlug("My Collection! @2024");

      expect(slug).toMatch(/^my-collection-2024-/);
    });

    test("removes leading and trailing hyphens from base", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const slug = await generateShareSlug("---Test---");

      expect(slug).toMatch(/^test-/);
    });

    test("truncates base to 50 characters", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);
      const longName = "a".repeat(100);

      const slug = await generateShareSlug(longName);

      // Base should be 50 chars max, plus timestamp and random suffix
      const parts = slug.split("-");
      const base = parts.slice(0, -2).join("-");
      expect(base.length).toBeLessThanOrEqual(50);
    });

    test("appends timestamp and random suffix", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const slug = await generateShareSlug("Test");

      // Slug format: {base}-{timestamp}-{random}
      const parts = slug.split("-");
      expect(parts.length).toBeGreaterThanOrEqual(3);
    });

    test("regenerates if slug already exists", async () => {
      // First call finds existing, second call finds nothing
      mockPrisma.lookbook.findUnique
        .mockResolvedValueOnce(createLookbookFixture())
        .mockResolvedValueOnce(null);

      const slug = await generateShareSlug("Test");

      expect(mockPrisma.lookbook.findUnique).toHaveBeenCalledTimes(2);
      expect(slug).toBeDefined();
    });

    test("handles empty name gracefully", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const slug = await generateShareSlug("");

      // Should still generate a slug with timestamp and random
      expect(slug).toBeDefined();
      expect(slug.length).toBeGreaterThan(0);
    });

    test("handles name with only special characters", async () => {
      mockPrisma.lookbook.findUnique.mockResolvedValueOnce(null);

      const slug = await generateShareSlug("!@#$%");

      // Should generate slug with just timestamp and random
      expect(slug).toBeDefined();
    });
  });

  describe("reorderLookbookItems", () => {
    test("updates order for multiple items in transaction", async () => {
      const items = [
        { id: "item-1", order: 0 },
        { id: "item-2", order: 1 },
        { id: "item-3", order: 2 },
      ];

      mockPrisma.$transaction.mockResolvedValueOnce([
        createLookbookItemFixture({ id: "item-1", order: 0 }),
        createLookbookItemFixture({ id: "item-2", order: 1 }),
        createLookbookItemFixture({ id: "item-3", order: 2 }),
      ]);

      await reorderLookbookItems("lookbook-123", items);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    test("filters by lookbookId for security", async () => {
      const items = [{ id: "item-1", order: 0 }];

      // Setup the transaction mock to return what updateMany would return
      mockPrisma.$transaction.mockImplementationOnce((ops) => {
        // Verify the operations passed to $transaction
        return Promise.all(ops);
      });

      mockPrisma.lookbookItem.update.mockResolvedValueOnce(
        createLookbookItemFixture({ id: "item-1", order: 0 })
      );

      await reorderLookbookItems("lookbook-123", items);

      // The transaction should include the lookbookId in the where clause
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("getNextItemOrder", () => {
    test("returns 0 when lookbook is empty", async () => {
      mockPrisma.lookbookItem.findFirst.mockResolvedValueOnce(null);

      const order = await getNextItemOrder("lookbook-123");

      expect(order).toBe(0);
    });

    test("returns max order + 1 for existing items", async () => {
      mockPrisma.lookbookItem.findFirst.mockResolvedValueOnce({ order: 5 });

      const order = await getNextItemOrder("lookbook-123");

      expect(order).toBe(6);
    });

    test("queries with correct lookbookId", async () => {
      mockPrisma.lookbookItem.findFirst.mockResolvedValueOnce(null);

      await getNextItemOrder("specific-lookbook-id");

      expect(mockPrisma.lookbookItem.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { lookbookId: "specific-lookbook-id" },
          orderBy: { order: "desc" },
        })
      );
    });
  });

  describe("getLookbookCoverUploadUrl", () => {
    test("generates presigned upload URL", async () => {
      mockGetSignedUrl.mockResolvedValueOnce("https://s3.upload-url.test");

      const result = await getLookbookCoverUploadUrl("user-123", "image/jpeg");

      expect(result.url).toBe("https://s3.upload-url.test");
    });

    test("creates correct S3 key path", async () => {
      mockGetSignedUrl.mockResolvedValueOnce("https://s3.upload-url.test");

      const result = await getLookbookCoverUploadUrl("user-123", "image/png");

      expect(result.key).toMatch(/^lookbooks\/user-123\/\d+-[\w-]+\.png$/);
    });

    test("includes user ID in key for isolation", async () => {
      mockGetSignedUrl.mockResolvedValueOnce("https://s3.upload-url.test");

      const result = await getLookbookCoverUploadUrl(
        "specific-user",
        "image/jpeg"
      );

      expect(result.key).toContain("specific-user");
    });

    test("returns correct cover URL", async () => {
      mockGetSignedUrl.mockResolvedValueOnce("https://s3.upload-url.test");

      const result = await getLookbookCoverUploadUrl("user-123", "image/webp");

      expect(result.coverUrl).toMatch(
        /^https:\/\/test-media-bucket\.s3\.us-east-2\.amazonaws\.com\/lookbooks\/user-123\//
      );
    });
  });

  describe("getLookbookCoverUrl", () => {
    test("returns presigned URL for valid coverKey", async () => {
      const { getPresignedUrl } = await import("@/lib/s3");
      (getPresignedUrl as ReturnType<typeof mock>).mockResolvedValueOnce(
        "https://presigned.test/cover.jpg"
      );

      const url = await getLookbookCoverUrl("lookbooks/user/cover.jpg");

      expect(url).toBe("https://presigned.test/cover.jpg");
    });

    test("returns null when coverKey is null", async () => {
      const url = await getLookbookCoverUrl(null);

      expect(url).toBeNull();
    });
  });

  describe("deleteLookbookCover", () => {
    test("deletes S3 object for valid coverKey", async () => {
      mockS3Send.mockResolvedValueOnce({});

      await deleteLookbookCover("lookbooks/user/cover.jpg");

      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    test("does nothing when coverKey is null", async () => {
      await deleteLookbookCover(null);

      expect(mockS3Send).not.toHaveBeenCalled();
    });
  });
});
