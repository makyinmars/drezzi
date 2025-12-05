// @ts-nocheck
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { createTryOnFixture } from "@/__tests__/fixtures";
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
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

const mockGetSignedUrl = mock(() => Promise.resolve("https://signed-url.test"));
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
  getPresignedUrl: mockGetSignedUrl,
}));

// Import after mocks
const { deleteTryOnAssets, getTryOnResultUrl, updateTryOnResult } =
  await import("../try-on");

describe("try-on service", () => {
  beforeEach(() => {
    mockS3Send.mockClear();
    mockGetSignedUrl.mockClear();
    mockPrisma.tryOn.update.mockClear();
  });

  describe("updateTryOnResult", () => {
    test("updates try-on with completed status and result URL", async () => {
      const fixture = createTryOnFixture({ status: "completed" });
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      const _result = await updateTryOnResult("tryon-123", {
        status: "completed",
        resultKey: "try-ons/tryon-123/result.png",
        processingMs: 5000,
      });

      expect(mockPrisma.tryOn.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.tryOn.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tryon-123" },
          data: expect.objectContaining({
            status: "completed",
            resultKey: "try-ons/tryon-123/result.png",
            processingMs: 5000,
          }),
        })
      );
    });

    test("sets completedAt when status is completed", async () => {
      const fixture = createTryOnFixture({ status: "completed" });
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      await updateTryOnResult("tryon-123", {
        status: "completed",
        resultKey: "try-ons/tryon-123/result.png",
      });

      const updateCall = mockPrisma.tryOn.update.mock.calls.at(0);
      const data = (updateCall?.at(0) as { data: { completedAt?: Date } })
        ?.data;
      expect(data.completedAt).toBeInstanceOf(Date);
    });

    test("does not set completedAt for processing status", async () => {
      const fixture = createTryOnFixture({ status: "processing" });
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      await updateTryOnResult("tryon-123", {
        status: "processing",
      });

      const updateCall = mockPrisma.tryOn.update.mock.calls.at(0);
      const data = (updateCall?.at(0) as { data: { completedAt?: Date } })
        ?.data;
      expect(data.completedAt).toBeUndefined();
    });

    test("does not set completedAt for failed status", async () => {
      const fixture = createTryOnFixture({ status: "failed" });
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      await updateTryOnResult("tryon-123", {
        status: "failed",
        errorMessage: "AI generation failed",
      });

      const updateCall = mockPrisma.tryOn.update.mock.calls.at(0);
      const data = (updateCall?.at(0) as { data: { completedAt?: Date } })
        ?.data;
      expect(data.completedAt).toBeUndefined();
    });

    test("constructs correct S3 URL from resultKey", async () => {
      const fixture = createTryOnFixture();
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      await updateTryOnResult("tryon-123", {
        status: "completed",
        resultKey: "try-ons/tryon-123/result.png",
      });

      const updateCall = mockPrisma.tryOn.update.mock.calls.at(0);
      const data = (updateCall?.at(0) as { data: { resultUrl?: string } })
        ?.data;
      expect(data.resultUrl).toBe(
        "https://test-media-bucket.s3.us-east-2.amazonaws.com/try-ons/tryon-123/result.png"
      );
    });

    test("handles undefined resultKey gracefully", async () => {
      const fixture = createTryOnFixture({ status: "processing" });
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      await updateTryOnResult("tryon-123", {
        status: "processing",
      });

      const updateCall = mockPrisma.tryOn.update.mock.calls.at(0);
      const data = (updateCall?.at(0) as { data: { resultUrl?: string } })
        ?.data;
      expect(data.resultUrl).toBeUndefined();
    });

    test("stores errorMessage for failed status", async () => {
      const fixture = createTryOnFixture({
        status: "failed",
        errorMessage: "Rate limit exceeded",
      });
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      await updateTryOnResult("tryon-123", {
        status: "failed",
        errorMessage: "Rate limit exceeded",
      });

      const updateCall = mockPrisma.tryOn.update.mock.calls.at(0);
      const data = (updateCall?.at(0) as { data: { errorMessage?: string } })
        ?.data;
      expect(data.errorMessage).toBe("Rate limit exceeded");
    });

    test("includes processingMs and confidenceScore when provided", async () => {
      const fixture = createTryOnFixture();
      mockPrisma.tryOn.update.mockResolvedValueOnce(fixture);

      await updateTryOnResult("tryon-123", {
        status: "completed",
        resultKey: "try-ons/tryon-123/result.png",
        processingMs: 7500,
        confidenceScore: 0.95,
      });

      const updateCall = mockPrisma.tryOn.update.mock.calls.at(0);
      const data = (
        updateCall?.at(0) as {
          data: { processingMs?: number; confidenceScore?: number };
        }
      )?.data;
      expect(data.processingMs).toBe(7500);
      expect(data.confidenceScore).toBe(0.95);
    });
  });

  describe("getTryOnResultUrl", () => {
    test("returns presigned URL for valid key", async () => {
      mockGetSignedUrl.mockResolvedValueOnce(
        "https://presigned-url.test/result.png"
      );

      const url = await getTryOnResultUrl("try-ons/123/result.png");

      expect(url).toBe("https://presigned-url.test/result.png");
    });

    test("calls getPresignedUrl with correct key", async () => {
      mockGetSignedUrl.mockResolvedValueOnce("https://presigned.test");

      await getTryOnResultUrl("try-ons/abc/result.png");

      expect(mockGetSignedUrl).toHaveBeenCalledWith("try-ons/abc/result.png");
    });
  });

  describe("deleteTryOnAssets", () => {
    test("deletes S3 object for valid resultKey", async () => {
      mockS3Send.mockResolvedValueOnce({});

      await deleteTryOnAssets("try-ons/123/result.png");

      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    test("does nothing when resultKey is null", async () => {
      await deleteTryOnAssets(null);

      expect(mockS3Send).not.toHaveBeenCalled();
    });

    test("sends correct DeleteObjectCommand", async () => {
      mockS3Send.mockResolvedValueOnce({});

      await deleteTryOnAssets("try-ons/delete-me/result.png");

      expect(mockS3Send).toHaveBeenCalledTimes(1);
      // The command is created with the correct bucket and key
      const call = mockS3Send.mock.calls.at(0)?.at(0) as {
        input: { Bucket: string; Key: string };
      };
      expect(call.input.Bucket).toBe("test-media-bucket");
      expect(call.input.Key).toBe("try-ons/delete-me/result.png");
    });
  });
});
