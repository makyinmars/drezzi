import { describe, expect, test } from "bun:test";

import {
  apiStyleTipByTryOnId,
  apiStyleTipCreate,
  apiStyleTipId,
  apiStyleTipUpdate,
  STYLE_TIP_CATEGORIES,
} from "../style-tip";

describe("style-tip validators", () => {
  describe("apiStyleTipId", () => {
    test("accepts valid CUID", () => {
      const result = apiStyleTipId.safeParse({ id: "clxyz123tipid456" });
      expect(result.success).toBe(true);
    });

    test("rejects invalid CUID", () => {
      const result = apiStyleTipId.safeParse({ id: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("apiStyleTipByTryOnId", () => {
    test("accepts valid try-on CUID", () => {
      const result = apiStyleTipByTryOnId.safeParse({
        tryOnId: "clxyz123tryon",
      });
      expect(result.success).toBe(true);
    });

    test("rejects invalid try-on CUID", () => {
      const result = apiStyleTipByTryOnId.safeParse({ tryOnId: "invalid" });
      expect(result.success).toBe(false);
    });
  });

  describe("apiStyleTipCreate", () => {
    test("accepts all valid STYLE_TIP_CATEGORIES", () => {
      for (const category of STYLE_TIP_CATEGORIES) {
        const result = apiStyleTipCreate.safeParse({
          tryOnId: "clxyz123tryon",
          category,
          content: "Valid style tip content",
        });
        expect(result.success).toBe(true);
      }
    });

    test("rejects invalid category", () => {
      const result = apiStyleTipCreate.safeParse({
        tryOnId: "clxyz123tryon",
        category: "invalid-category",
        content: "Valid content",
      });
      expect(result.success).toBe(false);
    });

    test("rejects empty content", () => {
      const result = apiStyleTipCreate.safeParse({
        tryOnId: "clxyz123tryon",
        category: "fit",
        content: "",
      });
      expect(result.success).toBe(false);
    });

    test("rejects content exceeding 1000 characters", () => {
      const result = apiStyleTipCreate.safeParse({
        tryOnId: "clxyz123tryon",
        category: "fit",
        content: "x".repeat(1001),
      });
      expect(result.success).toBe(false);
    });

    test("accepts content at max length (1000 chars)", () => {
      const result = apiStyleTipCreate.safeParse({
        tryOnId: "clxyz123tryon",
        category: "fit",
        content: "x".repeat(1000),
      });
      expect(result.success).toBe(true);
    });

    test("accepts valid fit tip", () => {
      const result = apiStyleTipCreate.safeParse({
        tryOnId: "clxyz123tryon",
        category: "fit",
        content: "This garment fits well with your regular fit preference.",
      });
      expect(result.success).toBe(true);
    });

    test("accepts valid fabric-care tip", () => {
      const result = apiStyleTipCreate.safeParse({
        tryOnId: "clxyz123tryon",
        category: "fabric-care",
        content: "Machine wash cold, tumble dry low.",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("apiStyleTipUpdate", () => {
    test("accepts partial update with only category", () => {
      const result = apiStyleTipUpdate.safeParse({
        id: "clxyz123tipid",
        category: "color",
      });
      expect(result.success).toBe(true);
    });

    test("accepts partial update with only content", () => {
      const result = apiStyleTipUpdate.safeParse({
        id: "clxyz123tipid",
        content: "Updated content",
      });
      expect(result.success).toBe(true);
    });

    test("accepts full update", () => {
      const result = apiStyleTipUpdate.safeParse({
        id: "clxyz123tipid",
        category: "style",
        content: "Updated style tip content",
      });
      expect(result.success).toBe(true);
    });

    test("rejects update with empty content", () => {
      const result = apiStyleTipUpdate.safeParse({
        id: "clxyz123tipid",
        content: "",
      });
      expect(result.success).toBe(false);
    });

    test("rejects update with invalid category", () => {
      const result = apiStyleTipUpdate.safeParse({
        id: "clxyz123tipid",
        category: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("STYLE_TIP_CATEGORIES constant", () => {
    test("contains exactly 6 categories", () => {
      expect(STYLE_TIP_CATEGORIES.length).toBe(6);
    });

    test("includes all expected categories", () => {
      expect(STYLE_TIP_CATEGORIES).toContain("fit");
      expect(STYLE_TIP_CATEGORIES).toContain("color");
      expect(STYLE_TIP_CATEGORIES).toContain("style");
      expect(STYLE_TIP_CATEGORIES).toContain("occasion");
      expect(STYLE_TIP_CATEGORIES).toContain("accessories");
      expect(STYLE_TIP_CATEGORIES).toContain("fabric-care");
    });
  });
});
