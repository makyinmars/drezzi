import { describe, expect, test } from "bun:test";

import {
  apiTryOnCreate,
  apiTryOnFilters,
  apiTryOnId,
  apiTryOnStatusUpdate,
  TRYON_STATUSES,
} from "../try-on";

describe("try-on validators", () => {
  describe("apiTryOnId", () => {
    test("accepts valid CUID", () => {
      const result = apiTryOnId.safeParse({ id: "clxyz123tryonid456" });
      expect(result.success).toBe(true);
    });

    test("rejects invalid CUID format", () => {
      const result = apiTryOnId.safeParse({ id: "not-a-valid-cuid" });
      expect(result.success).toBe(false);
    });

    test("rejects missing id", () => {
      const result = apiTryOnId.safeParse({});
      expect(result.success).toBe(false);
    });

    test("rejects empty string", () => {
      const result = apiTryOnId.safeParse({ id: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("apiTryOnCreate", () => {
    test("accepts valid body profile and garment IDs", () => {
      const result = apiTryOnCreate.safeParse({
        bodyProfileId: "clxyz123profile456",
        garmentId: "clxyz123garment789",
      });
      expect(result.success).toBe(true);
    });

    test("rejects invalid CUID format for bodyProfileId", () => {
      const result = apiTryOnCreate.safeParse({
        bodyProfileId: "invalid-id",
        garmentId: "clxyz123garment789",
      });
      expect(result.success).toBe(false);
    });

    test("rejects invalid CUID format for garmentId", () => {
      const result = apiTryOnCreate.safeParse({
        bodyProfileId: "clxyz123profile456",
        garmentId: "invalid-id",
      });
      expect(result.success).toBe(false);
    });

    test("rejects missing bodyProfileId", () => {
      const result = apiTryOnCreate.safeParse({
        garmentId: "clxyz123garment789",
      });
      expect(result.success).toBe(false);
    });

    test("rejects missing garmentId", () => {
      const result = apiTryOnCreate.safeParse({
        bodyProfileId: "clxyz123profile456",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("apiTryOnFilters", () => {
    test("accepts valid status filter", () => {
      const result = apiTryOnFilters.safeParse({ status: "completed" });
      expect(result.success).toBe(true);
    });

    test("accepts all defined TRYON_STATUSES", () => {
      for (const status of TRYON_STATUSES) {
        const result = apiTryOnFilters.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    test("rejects invalid status value", () => {
      const result = apiTryOnFilters.safeParse({ status: "invalid-status" });
      expect(result.success).toBe(false);
    });

    test("accepts isFavorite boolean filter", () => {
      const resultTrue = apiTryOnFilters.safeParse({ isFavorite: true });
      const resultFalse = apiTryOnFilters.safeParse({ isFavorite: false });
      expect(resultTrue.success).toBe(true);
      expect(resultFalse.success).toBe(true);
    });

    test("accepts garmentCategory string filter", () => {
      const result = apiTryOnFilters.safeParse({ garmentCategory: "tops" });
      expect(result.success).toBe(true);
    });

    test("accepts date range filters", () => {
      const result = apiTryOnFilters.safeParse({
        dateFrom: new Date("2024-01-01"),
        dateTo: new Date("2024-12-31"),
      });
      expect(result.success).toBe(true);
    });

    test("accepts empty filter object", () => {
      const result = apiTryOnFilters.safeParse({});
      expect(result.success).toBe(true);
    });

    test("accepts combined filters", () => {
      const result = apiTryOnFilters.safeParse({
        status: "completed",
        isFavorite: true,
        garmentCategory: "tops",
        dateFrom: new Date("2024-01-01"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("apiTryOnStatusUpdate", () => {
    test("accepts valid status update with all fields", () => {
      const result = apiTryOnStatusUpdate.safeParse({
        id: "clxyz123tryonid456",
        status: "completed",
        resultUrl: "https://example.com/result.png",
        resultKey: "try-ons/123/result.png",
        processingMs: 5000,
        confidenceScore: 0.95,
      });
      expect(result.success).toBe(true);
    });

    test("accepts status update with only required fields", () => {
      const result = apiTryOnStatusUpdate.safeParse({
        id: "clxyz123tryonid456",
        status: "processing",
      });
      expect(result.success).toBe(true);
    });

    test("accepts failed status with error message", () => {
      const result = apiTryOnStatusUpdate.safeParse({
        id: "clxyz123tryonid456",
        status: "failed",
        errorMessage: "AI generation failed",
      });
      expect(result.success).toBe(true);
    });

    test("rejects invalid confidenceScore (> 1)", () => {
      const result = apiTryOnStatusUpdate.safeParse({
        id: "clxyz123tryonid456",
        status: "completed",
        confidenceScore: 1.5,
      });
      expect(result.success).toBe(false);
    });

    test("rejects invalid confidenceScore (< 0)", () => {
      const result = apiTryOnStatusUpdate.safeParse({
        id: "clxyz123tryonid456",
        status: "completed",
        confidenceScore: -0.1,
      });
      expect(result.success).toBe(false);
    });

    test("rejects negative processingMs", () => {
      const result = apiTryOnStatusUpdate.safeParse({
        id: "clxyz123tryonid456",
        status: "completed",
        processingMs: -100,
      });
      expect(result.success).toBe(false);
    });
  });
});
