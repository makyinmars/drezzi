import { describe, expect, test } from "bun:test";

import {
  apiLookbookAddItem,
  apiLookbookCoverUpload,
  apiLookbookCreate,
  apiLookbookId,
  apiLookbookReorderItems,
  apiLookbookSlug,
  apiLookbookUpdate,
  apiLookbookUpdateItemNote,
} from "../lookbook";

describe("lookbook validators", () => {
  describe("apiLookbookId", () => {
    test("accepts valid CUID", () => {
      const result = apiLookbookId.safeParse({ id: "clxyz123lookbook" });
      expect(result.success).toBe(true);
    });

    test("rejects invalid CUID", () => {
      const result = apiLookbookId.safeParse({ id: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("apiLookbookSlug", () => {
    test("accepts valid slug", () => {
      const result = apiLookbookSlug.safeParse({
        slug: "summer-collection-abc123",
      });
      expect(result.success).toBe(true);
    });

    test("rejects empty slug", () => {
      const result = apiLookbookSlug.safeParse({ slug: "" });
      expect(result.success).toBe(false);
    });

    test("rejects slug exceeding 200 characters", () => {
      const result = apiLookbookSlug.safeParse({ slug: "a".repeat(201) });
      expect(result.success).toBe(false);
    });
  });

  describe("apiLookbookCreate", () => {
    test("accepts valid lookbook name", () => {
      const result = apiLookbookCreate.safeParse({ name: "Summer Collection" });
      expect(result.success).toBe(true);
    });

    test("rejects empty name", () => {
      const result = apiLookbookCreate.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    test("rejects name exceeding 200 characters", () => {
      const result = apiLookbookCreate.safeParse({ name: "x".repeat(201) });
      expect(result.success).toBe(false);
    });

    test("accepts optional description", () => {
      const result = apiLookbookCreate.safeParse({
        name: "Test",
        description: "My collection",
      });
      expect(result.success).toBe(true);
    });

    test("rejects description exceeding 1000 characters", () => {
      const result = apiLookbookCreate.safeParse({
        name: "Test",
        description: "x".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    test("defaults isPublic to false", () => {
      const result = apiLookbookCreate.safeParse({ name: "Test" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(false);
      }
    });

    test("accepts isPublic as true", () => {
      const result = apiLookbookCreate.safeParse({
        name: "Test",
        isPublic: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(true);
      }
    });

    test("accepts coverUrl and coverKey", () => {
      const result = apiLookbookCreate.safeParse({
        name: "Test",
        coverUrl: "https://example.com/cover.jpg",
        coverKey: "lookbooks/user/cover.jpg",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("apiLookbookUpdate", () => {
    test("accepts partial update with id", () => {
      const result = apiLookbookUpdate.safeParse({
        id: "clxyz123lookbook",
        name: "Updated Name",
      });
      expect(result.success).toBe(true);
    });

    test("accepts nullable description", () => {
      const result = apiLookbookUpdate.safeParse({
        id: "clxyz123lookbook",
        description: null,
      });
      expect(result.success).toBe(true);
    });

    test("accepts nullable coverUrl and coverKey", () => {
      const result = apiLookbookUpdate.safeParse({
        id: "clxyz123lookbook",
        coverUrl: null,
        coverKey: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("apiLookbookAddItem", () => {
    test("accepts valid lookbook and try-on IDs", () => {
      const result = apiLookbookAddItem.safeParse({
        lookbookId: "clxyz123lookbook",
        tryOnId: "clxyz123tryon",
      });
      expect(result.success).toBe(true);
    });

    test("accepts optional note", () => {
      const result = apiLookbookAddItem.safeParse({
        lookbookId: "clxyz123lookbook",
        tryOnId: "clxyz123tryon",
        note: "Great for summer",
      });
      expect(result.success).toBe(true);
    });

    test("rejects note exceeding 500 characters", () => {
      const result = apiLookbookAddItem.safeParse({
        lookbookId: "clxyz123lookbook",
        tryOnId: "clxyz123tryon",
        note: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    test("accepts optional order", () => {
      const result = apiLookbookAddItem.safeParse({
        lookbookId: "clxyz123lookbook",
        tryOnId: "clxyz123tryon",
        order: 5,
      });
      expect(result.success).toBe(true);
    });

    test("rejects negative order", () => {
      const result = apiLookbookAddItem.safeParse({
        lookbookId: "clxyz123lookbook",
        tryOnId: "clxyz123tryon",
        order: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("apiLookbookUpdateItemNote", () => {
    test("accepts valid note update", () => {
      const result = apiLookbookUpdateItemNote.safeParse({
        id: "clxyz123item",
        note: "Updated note",
      });
      expect(result.success).toBe(true);
    });

    test("accepts null note (clear note)", () => {
      const result = apiLookbookUpdateItemNote.safeParse({
        id: "clxyz123item",
        note: null,
      });
      expect(result.success).toBe(true);
    });

    test("rejects note exceeding 500 characters", () => {
      const result = apiLookbookUpdateItemNote.safeParse({
        id: "clxyz123item",
        note: "x".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("apiLookbookReorderItems", () => {
    test("accepts valid reorder payload", () => {
      const result = apiLookbookReorderItems.safeParse({
        lookbookId: "clxyz123lookbook",
        items: [
          { id: "clxyz123item1", order: 0 },
          { id: "clxyz123item2", order: 1 },
          { id: "clxyz123item3", order: 2 },
        ],
      });
      expect(result.success).toBe(true);
    });

    test("accepts empty items array", () => {
      const result = apiLookbookReorderItems.safeParse({
        lookbookId: "clxyz123lookbook",
        items: [],
      });
      expect(result.success).toBe(true);
    });

    test("rejects negative order values", () => {
      const result = apiLookbookReorderItems.safeParse({
        lookbookId: "clxyz123lookbook",
        items: [{ id: "clxyz123item1", order: -1 }],
      });
      expect(result.success).toBe(false);
    });

    test("rejects invalid CUID in items", () => {
      const result = apiLookbookReorderItems.safeParse({
        lookbookId: "clxyz123lookbook",
        items: [{ id: "invalid-id", order: 0 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("apiLookbookCoverUpload", () => {
    test("accepts jpeg content type", () => {
      const result = apiLookbookCoverUpload.safeParse({
        contentType: "image/jpeg",
        contentLength: 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });

    test("accepts png content type", () => {
      const result = apiLookbookCoverUpload.safeParse({
        contentType: "image/png",
        contentLength: 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });

    test("accepts webp content type", () => {
      const result = apiLookbookCoverUpload.safeParse({
        contentType: "image/webp",
        contentLength: 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });

    test("rejects gif content type", () => {
      const result = apiLookbookCoverUpload.safeParse({
        contentType: "image/gif",
        contentLength: 1024 * 1024,
      });
      expect(result.success).toBe(false);
    });

    test("rejects non-image content type", () => {
      const result = apiLookbookCoverUpload.safeParse({
        contentType: "application/pdf",
        contentLength: 1024 * 1024,
      });
      expect(result.success).toBe(false);
    });

    test("accepts files under 5MB", () => {
      const result = apiLookbookCoverUpload.safeParse({
        contentType: "image/jpeg",
        contentLength: 5 * 1024 * 1024,
      });
      expect(result.success).toBe(true);
    });

    test("rejects files exceeding 5MB", () => {
      const result = apiLookbookCoverUpload.safeParse({
        contentType: "image/jpeg",
        contentLength: 5 * 1024 * 1024 + 1,
      });
      expect(result.success).toBe(false);
    });
  });
});
