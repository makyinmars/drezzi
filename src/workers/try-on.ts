import { google } from "@ai-sdk/google";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { experimental_generateImage as generateImage } from "ai";
import type { SQSEvent, SQSRecord } from "aws-lambda";
import { Resource } from "sst";

import {
  generateStyleTips,
  getTryOnForTipGeneration,
} from "@/services/style-tip";
import { updateTryOnResult } from "@/services/try-on";

const s3 = new S3Client({});

type TryOnJobPayload = {
  tryOnId: string;
  bodyImageUrl: string;
  garmentImageUrl: string;
};

export async function handler(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    await processRecord(record);
  }
}

async function processRecord(record: SQSRecord): Promise<void> {
  const payload = JSON.parse(record.body) as TryOnJobPayload;
  const startTime = Date.now();

  console.log("Processing try-on job:", payload.tryOnId);

  // 1. Fetch images
  const [bodyImage, garmentImage] = await Promise.all([
    fetchImageAsBase64(payload.bodyImageUrl),
    fetchImageAsBase64(payload.garmentImageUrl),
  ]);

  // 2. Call Gemini 3 Pro for virtual try-on
  const result = await generateImage({
    model: google.image("gemini-3-pro-image-preview"),
    prompt: `Virtual try-on: Place the garment from the second image onto the person in the first image.
Maintain the person's exact pose, body proportions, and facial features.
Ensure the garment fits naturally with realistic fabric draping and proper lighting.
The result should look like a professional fashion photo.`,
    providerOptions: {
      google: {
        responseModalities: ["IMAGE"],
        inlineData: [
          { mimeType: "image/jpeg", data: bodyImage },
          { mimeType: "image/jpeg", data: garmentImage },
        ],
      },
    },
  });

  // 3. Upload result to S3
  const resultKey = `try-ons/${payload.tryOnId}/result.png`;
  const imageBuffer = Buffer.from(result.image.base64, "base64");

  await s3.send(
    new PutObjectCommand({
      Bucket: Resource.MediaBucket.name,
      Key: resultKey,
      Body: imageBuffer,
      ContentType: "image/png",
    })
  );

  const processingMs = Date.now() - startTime;
  console.log(`Try-on ${payload.tryOnId} completed in ${processingMs}ms`);

  // 4. Update database with result
  await updateTryOnResult(payload.tryOnId, {
    status: "completed",
    resultKey,
    processingMs,
  });

  // 5. Generate style tips
  try {
    const tryOnData = await getTryOnForTipGeneration(payload.tryOnId);

    if (tryOnData) {
      await generateStyleTips({
        tryOnId: payload.tryOnId,
        garmentName: tryOnData.garment.name,
        garmentCategory: tryOnData.garment.category,
        garmentDescription: tryOnData.garment.description,
        garmentColors: tryOnData.garment.colors,
        bodyProfileFitPreference: tryOnData.bodyProfile.fitPreference,
      });
      console.log(`Style tips generated for try-on ${payload.tryOnId}`);
    }
  } catch (error) {
    console.error(
      `Failed to generate style tips for ${payload.tryOnId}:`,
      error
    );
  }
}

async function fetchImageAsBase64(url: string): Promise<string> {
  // If S3 key, fetch from bucket
  if (url.startsWith("profiles/") || url.startsWith("garments/")) {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: Resource.MediaBucket.name,
        Key: url,
      })
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Failed to fetch image from S3: ${url}`);
    return Buffer.from(bytes).toString("base64");
  }

  // Otherwise fetch from URL
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
