// @ts-nocheck
import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { SQSEvent, SQSRecord } from "aws-lambda";

import {
  createGarmentFixture,
  createProfileFixture,
  createTryOnFixture,
} from "@/__tests__/fixtures";

// Mock SST Resource
mock.module("sst", () => ({
  Resource: {
    MediaBucket: { name: "test-media-bucket" },
  },
}));

// Mock S3 client
const mockS3Send = mock(() =>
  Promise.resolve({
    Body: {
      transformToByteArray: () =>
        Promise.resolve(new Uint8Array([137, 80, 78, 71])),
    },
  })
);

mock.module("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockS3Send;
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

// Mock AI SDK
const mockGenerateImage = mock(() =>
  Promise.resolve({
    image: {
      base64:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
    },
  })
);

mock.module("ai", () => ({
  experimental_generateImage: mockGenerateImage,
}));

mock.module("@ai-sdk/google", () => ({
  google: {
    image: () => ({ model: "gemini-3-pro-image-preview" }),
  },
}));

// Mock services
const mockUpdateTryOnResult = mock(() => Promise.resolve(createTryOnFixture()));
const mockGetTryOnForTipGeneration = mock(() =>
  Promise.resolve({
    ...createTryOnFixture(),
    garment: createGarmentFixture(),
    bodyProfile: createProfileFixture(),
  })
);
const mockGenerateStyleTips = mock(() => Promise.resolve({ count: 6 }));

mock.module("@/services/try-on", () => ({
  updateTryOnResult: mockUpdateTryOnResult,
}));

mock.module("@/services/style-tip", () => ({
  getTryOnForTipGeneration: mockGetTryOnForTipGeneration,
  generateStyleTips: mockGenerateStyleTips,
}));

// Import after mocks
const { handler } = await import("../try-on");

// Helper to create SQS event
function createSqsEvent(
  payloads: Array<{
    tryOnId: string;
    bodyImageUrl: string;
    garmentImageUrl: string;
  }>
): SQSEvent {
  return {
    Records: payloads.map(
      (payload, index) =>
        ({
          messageId: `msg-${index}`,
          receiptHandle: `receipt-${index}`,
          body: JSON.stringify(payload),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "sender-id",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
          },
          messageAttributes: {},
          md5OfBody: "d41d8cd98f00b204e9800998ecf8427e",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-2:123456789:test-queue",
          awsRegion: "us-east-2",
        }) as SQSRecord
    ),
  };
}

describe("try-on worker", () => {
  beforeEach(() => {
    mockS3Send.mockClear();
    mockGenerateImage.mockClear();
    mockUpdateTryOnResult.mockClear();
    mockGetTryOnForTipGeneration.mockClear();
    mockGenerateStyleTips.mockClear();
  });

  describe("handler", () => {
    test("processes all records in SQS event", async () => {
      const event = createSqsEvent([
        {
          tryOnId: "tryon-1",
          bodyImageUrl: "profiles/user/photo.jpg",
          garmentImageUrl: "garments/user/item.jpg",
        },
        {
          tryOnId: "tryon-2",
          bodyImageUrl: "profiles/user/photo2.jpg",
          garmentImageUrl: "garments/user/item2.jpg",
        },
      ]);

      await handler(event);

      // Each record should trigger image generation and update
      expect(mockGenerateImage).toHaveBeenCalledTimes(2);
      expect(mockUpdateTryOnResult).toHaveBeenCalledTimes(2);
    });

    test("handles empty event gracefully", async () => {
      const event: SQSEvent = { Records: [] };

      await handler(event);

      expect(mockGenerateImage).not.toHaveBeenCalled();
      expect(mockUpdateTryOnResult).not.toHaveBeenCalled();
    });
  });

  describe("processRecord (via handler)", () => {
    const payload = {
      tryOnId: "tryon-test-123",
      bodyImageUrl: "profiles/user/body.jpg",
      garmentImageUrl: "garments/user/garment.jpg",
    };

    test("parses SQS message payload correctly", async () => {
      const event = createSqsEvent([payload]);

      await handler(event);

      // Verify updateTryOnResult was called with the correct tryOnId
      expect(mockUpdateTryOnResult).toHaveBeenCalledWith(
        payload.tryOnId,
        expect.any(Object)
      );
    });

    test("fetches body and garment images from S3", async () => {
      const event = createSqsEvent([payload]);

      await handler(event);

      // S3 should be called twice for images (body + garment)
      // Then once more to upload result = 3 calls
      expect(mockS3Send).toHaveBeenCalledTimes(3);

      // First two calls should be GetObjectCommand for images
      const firstCall = mockS3Send.mock.calls.at(0)?.at(0) as {
        input: { Bucket: string; Key: string };
      };
      expect(firstCall.input.Bucket).toBe("test-media-bucket");
    });

    test("calls Gemini 3 Pro with virtual try-on prompt", async () => {
      const event = createSqsEvent([payload]);

      await handler(event);

      expect(mockGenerateImage).toHaveBeenCalledTimes(1);
      expect(mockGenerateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining("Virtual try-on"),
          providerOptions: expect.objectContaining({
            google: expect.objectContaining({
              responseModalities: ["IMAGE"],
              inlineData: expect.arrayContaining([
                expect.objectContaining({ mimeType: "image/jpeg" }),
                expect.objectContaining({ mimeType: "image/jpeg" }),
              ]),
            }),
          }),
        })
      );
    });

    test("uploads result to S3 with correct key", async () => {
      const event = createSqsEvent([payload]);

      await handler(event);

      // Third S3 call should be PutObjectCommand for result
      const uploadCall = mockS3Send.mock.calls.at(2)?.at(0) as {
        input: { Bucket: string; Key: string; ContentType: string };
      };
      expect(uploadCall.input.Bucket).toBe("test-media-bucket");
      expect(uploadCall.input.Key).toBe(
        `try-ons/${payload.tryOnId}/result.png`
      );
      expect(uploadCall.input.ContentType).toBe("image/png");
    });

    test("updates try-on to completed with processingMs", async () => {
      const event = createSqsEvent([payload]);

      await handler(event);

      expect(mockUpdateTryOnResult).toHaveBeenCalledWith(
        payload.tryOnId,
        expect.objectContaining({
          status: "completed",
          resultKey: `try-ons/${payload.tryOnId}/result.png`,
          processingMs: expect.any(Number),
        })
      );
    });

    test("generates style tips after completion", async () => {
      const event = createSqsEvent([payload]);

      await handler(event);

      expect(mockGetTryOnForTipGeneration).toHaveBeenCalledWith(
        payload.tryOnId
      );
      expect(mockGenerateStyleTips).toHaveBeenCalledWith(
        expect.objectContaining({
          tryOnId: payload.tryOnId,
        })
      );
    });

    test("continues if style tip generation fails", async () => {
      mockGenerateStyleTips.mockRejectedValueOnce(new Error("AI rate limit"));

      const event = createSqsEvent([payload]);

      // Should not throw - style tip errors are caught and logged
      await expect(handler(event)).resolves.toBeUndefined();

      // Main processing should still complete
      expect(mockUpdateTryOnResult).toHaveBeenCalledWith(
        payload.tryOnId,
        expect.objectContaining({ status: "completed" })
      );
    });
  });

  describe("fetchImageAsBase64 (via processRecord)", () => {
    test("fetches from S3 for profile keys", async () => {
      const event = createSqsEvent([
        {
          tryOnId: "tryon-1",
          bodyImageUrl: "profiles/user123/photo.jpg",
          garmentImageUrl: "garments/user123/item.jpg",
        },
      ]);

      await handler(event);

      // First call should be for profiles/ path
      const firstCall = mockS3Send.mock.calls.at(0)?.at(0) as {
        input: { Key: string };
      };
      expect(firstCall.input.Key).toBe("profiles/user123/photo.jpg");
    });

    test("fetches from S3 for garment keys", async () => {
      const event = createSqsEvent([
        {
          tryOnId: "tryon-1",
          bodyImageUrl: "profiles/user123/photo.jpg",
          garmentImageUrl: "garments/user123/item.jpg",
        },
      ]);

      await handler(event);

      // Second call should be for garments/ path
      const secondCall = mockS3Send.mock.calls.at(1)?.at(0) as {
        input: { Key: string };
      };
      expect(secondCall.input.Key).toBe("garments/user123/item.jpg");
    });
  });
});
