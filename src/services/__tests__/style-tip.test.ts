// @ts-nocheck
import { beforeEach, describe, expect, mock, test } from "bun:test";

import {
  createAllStyleTipsFixture,
  createTryOnFixture,
} from "@/__tests__/fixtures";
import { createMockPrisma } from "@/__tests__/mocks/prisma";

// Create mock prisma
const mockPrisma = createMockPrisma();

// Create AI mock
const mockGenerateObject = mock(() =>
  Promise.resolve({
    object: {
      tips: [
        { category: "fit", content: "Test fit tip" },
        { category: "color", content: "Test color tip" },
        { category: "style", content: "Test style tip" },
        { category: "occasion", content: "Test occasion tip" },
        { category: "accessories", content: "Test accessories tip" },
        { category: "fabric-care", content: "Test fabric care tip" },
      ],
    },
  })
);

// Mock modules BEFORE import
mock.module("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

mock.module("ai", () => ({
  generateObject: mockGenerateObject,
}));

mock.module("@ai-sdk/google", () => ({
  google: () => ({ model: "gemini-2.5-flash-preview-05-20" }),
}));

// Import after mocks
const {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  generateStyleTips,
  getTryOnForTipGeneration,
  regenerateStyleTips,
} = await import("../style-tip");

describe("style-tip service", () => {
  beforeEach(() => {
    mockGenerateObject.mockClear();
    mockPrisma.styleTip.createMany.mockClear();
    mockPrisma.styleTip.deleteMany.mockClear();
    mockPrisma.tryOn.findUnique.mockClear();
  });

  describe("generateStyleTips", () => {
    const validInput = {
      tryOnId: "tryon-123",
      garmentName: "Blue Oxford Shirt",
      garmentCategory: "tops",
      garmentDescription: "Classic cotton oxford button-down",
      garmentColors: ["navy", "blue"],
      bodyProfileFitPreference: "regular",
    };

    test("calls AI SDK with structured prompt", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          tips: createAllStyleTipsFixture().map((t) => ({
            category: t.category,
            content: t.content,
          })),
        },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 6 });

      await generateStyleTips(validInput);

      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockGenerateObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("Blue Oxford Shirt"),
        })
      );
    });

    test("includes garment name in prompt", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 0 });

      await generateStyleTips(validInput);

      const call = mockGenerateObject.mock.calls.at(0)?.at(0) as {
        prompt: string;
      };
      expect(call.prompt).toContain("Blue Oxford Shirt");
    });

    test("includes garment category in prompt", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 0 });

      await generateStyleTips(validInput);

      const call = mockGenerateObject.mock.calls.at(0)?.at(0) as {
        prompt: string;
      };
      expect(call.prompt).toContain("tops");
    });

    test("formats colors when provided", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 0 });

      await generateStyleTips(validInput);

      const call = mockGenerateObject.mock.calls.at(0)?.at(0) as {
        prompt: string;
      };
      expect(call.prompt).toContain("navy, blue");
    });

    test("handles empty colors array", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 0 });

      await generateStyleTips({
        ...validInput,
        garmentColors: [],
      });

      const call = mockGenerateObject.mock.calls.at(0)?.at(0) as {
        prompt: string;
      };
      expect(call.prompt).toContain("Colors: Not specified");
    });

    test("includes description when provided", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 0 });

      await generateStyleTips(validInput);

      const call = mockGenerateObject.mock.calls.at(0)?.at(0) as {
        prompt: string;
      };
      expect(call.prompt).toContain("Classic cotton oxford button-down");
    });

    test("handles null description", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 0 });

      await generateStyleTips({
        ...validInput,
        garmentDescription: null,
      });

      const call = mockGenerateObject.mock.calls.at(0)?.at(0) as {
        prompt: string;
      };
      expect(call.prompt).not.toContain("Description:");
    });

    test("includes user fit preference in prompt", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 0 });

      await generateStyleTips({
        ...validInput,
        bodyProfileFitPreference: "slim",
      });

      const call = mockGenerateObject.mock.calls.at(0)?.at(0) as {
        prompt: string;
      };
      expect(call.prompt).toContain("slim");
    });

    test("creates style tips in database", async () => {
      const tips = createAllStyleTipsFixture("tryon-123");
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          tips: tips.map((t) => ({ category: t.category, content: t.content })),
        },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 6 });

      await generateStyleTips(validInput);

      expect(mockPrisma.styleTip.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.styleTip.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              tryOnId: "tryon-123",
              category: expect.any(String),
              content: expect.any(String),
            }),
          ]),
        })
      );
    });

    test("associates tips with correct tryOnId", async () => {
      mockGenerateObject.mockResolvedValueOnce({
        object: {
          tips: [{ category: "fit", content: "Test" }],
        },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 1 });

      await generateStyleTips({
        ...validInput,
        tryOnId: "specific-tryon-id",
      });

      const createCall = mockPrisma.styleTip.createMany.mock.calls
        .at(0)
        ?.at(0) as {
        data: Array<{ tryOnId: string }>;
      };
      expect(
        createCall.data.every((tip) => tip.tryOnId === "specific-tryon-id")
      ).toBe(true);
    });
  });

  describe("regenerateStyleTips", () => {
    const validInput = {
      tryOnId: "tryon-123",
      garmentName: "Test Shirt",
      garmentCategory: "tops",
      garmentDescription: null,
      garmentColors: [],
      bodyProfileFitPreference: "regular",
    };

    test("deletes existing tips before regenerating", async () => {
      mockPrisma.styleTip.deleteMany.mockResolvedValueOnce({ count: 6 });
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 6 });

      await regenerateStyleTips(validInput);

      expect(mockPrisma.styleTip.deleteMany).toHaveBeenCalledWith({
        where: { tryOnId: "tryon-123" },
      });
    });

    test("calls generateStyleTips after deletion", async () => {
      mockPrisma.styleTip.deleteMany.mockResolvedValueOnce({ count: 6 });
      mockGenerateObject.mockResolvedValueOnce({
        object: { tips: [] },
      });
      mockPrisma.styleTip.createMany.mockResolvedValueOnce({ count: 6 });

      await regenerateStyleTips(validInput);

      expect(mockGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockPrisma.styleTip.createMany).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTryOnForTipGeneration", () => {
    test("returns try-on with garment and body profile data", async () => {
      const tryOnWithRelations = {
        ...createTryOnFixture(),
        garment: {
          name: "Test Shirt",
          category: "tops",
          description: "A test shirt",
          colors: ["blue"],
        },
        bodyProfile: {
          fitPreference: "regular",
        },
      };

      mockPrisma.tryOn.findUnique.mockResolvedValueOnce(tryOnWithRelations);

      const result = await getTryOnForTipGeneration("tryon-123");

      expect(result).toEqual(tryOnWithRelations);
      expect(mockPrisma.tryOn.findUnique).toHaveBeenCalledWith({
        where: { id: "tryon-123" },
        include: {
          garment: {
            select: {
              name: true,
              category: true,
              description: true,
              colors: true,
            },
          },
          bodyProfile: {
            select: {
              fitPreference: true,
            },
          },
        },
      });
    });

    test("returns null when try-on not found", async () => {
      mockPrisma.tryOn.findUnique.mockResolvedValueOnce(null);

      const result = await getTryOnForTipGeneration("nonexistent-id");

      expect(result).toBeNull();
    });
  });

  describe("CATEGORY_LABELS constant", () => {
    test("has labels for all 6 categories", () => {
      expect(Object.keys(CATEGORY_LABELS)).toHaveLength(6);
    });

    test("includes human-readable labels", () => {
      expect(CATEGORY_LABELS.fit).toBe("Fit");
      expect(CATEGORY_LABELS.color).toBe("Color");
      expect(CATEGORY_LABELS.style).toBe("Style");
      expect(CATEGORY_LABELS.occasion).toBe("Occasion");
      expect(CATEGORY_LABELS.accessories).toBe("Accessories");
      expect(CATEGORY_LABELS["fabric-care"]).toBe("Fabric Care");
    });
  });

  describe("CATEGORY_ICONS constant", () => {
    test("has icons for all 6 categories", () => {
      expect(Object.keys(CATEGORY_ICONS)).toHaveLength(6);
    });

    test("includes icon names", () => {
      expect(CATEGORY_ICONS.fit).toBe("Ruler");
      expect(CATEGORY_ICONS.color).toBe("Palette");
      expect(CATEGORY_ICONS.style).toBe("Sparkles");
      expect(CATEGORY_ICONS.occasion).toBe("Calendar");
      expect(CATEGORY_ICONS.accessories).toBe("Watch");
      expect(CATEGORY_ICONS["fabric-care"]).toBe("Shirt");
    });
  });
});
