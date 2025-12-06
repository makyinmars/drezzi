import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";

import { prisma } from "@/lib/prisma";
import { getCachedPresignedUrl, s3 } from "@/lib/s3";

import type { TryOnStatus } from "@/validators/try-on";

type UpdateTryOnResultParams = {
  status: TryOnStatus;
  resultKey?: string;
  processingMs?: number;
  confidenceScore?: number;
  errorMessage?: string;
};

export async function updateTryOnResult(
  tryOnId: string,
  params: UpdateTryOnResultParams
) {
  let resultId: string | undefined;

  if (params.resultKey) {
    const file = await prisma.file.create({
      data: {
        key: params.resultKey,
        bucket: "media",
        mimeType: "image/png",
      },
    });
    resultId = file.id;
  }

  return await prisma.tryOn.update({
    where: { id: tryOnId },
    data: {
      status: params.status,
      resultId,
      processingMs: params.processingMs,
      confidenceScore: params.confidenceScore,
      errorMessage: params.errorMessage,
      completedAt: params.status === "completed" ? new Date() : undefined,
    },
  });
}

export async function getTryOnResultUrl(resultKey: string) {
  return await getCachedPresignedUrl(resultKey);
}

export async function deleteTryOnAssets(resultKey: string | null) {
  if (!resultKey) return;

  const command = new DeleteObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: resultKey,
  });

  await s3.send(command);
}
