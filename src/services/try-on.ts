import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";

import { prisma } from "@/lib/prisma";
import { getPresignedUrl, s3 } from "@/lib/s3";

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
  const resultUrl = params.resultKey
    ? `https://${Resource.MediaBucket.name}.s3.us-east-2.amazonaws.com/${params.resultKey}`
    : undefined;

  return await prisma.tryOn.update({
    where: { id: tryOnId },
    data: {
      status: params.status,
      resultUrl,
      resultKey: params.resultKey,
      processingMs: params.processingMs,
      confidenceScore: params.confidenceScore,
      errorMessage: params.errorMessage,
      completedAt: params.status === "completed" ? new Date() : undefined,
    },
  });
}

export async function getTryOnResultUrl(resultKey: string) {
  return await getPresignedUrl(resultKey);
}

export async function deleteTryOnAssets(resultKey: string | null) {
  if (!resultKey) return;

  const command = new DeleteObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: resultKey,
  });

  await s3.send(command);
}
