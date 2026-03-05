import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { Resource } from "sst";
import { file, tryOn } from "@/db/schema";
import { db } from "@/lib/db";
import { createId } from "@/lib/id";
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
    const [created] = await db
      .insert(file)
      .values({
        id: createId(),
        key: params.resultKey,
        bucket: "media",
        mimeType: "image/png",
      })
      .returning();
    resultId = created.id;
  }

  const updateData: Partial<typeof tryOn.$inferInsert> = {
    status: params.status,
    processingMs: params.processingMs,
    confidenceScore: params.confidenceScore,
    errorMessage: params.errorMessage,
    updatedAt: new Date(),
  };

  if (resultId) {
    updateData.resultId = resultId;
  }

  if (params.status === "completed") {
    updateData.completedAt = new Date();
  }

  const [updated] = await db
    .update(tryOn)
    .set(updateData)
    .where(eq(tryOn.id, tryOnId))
    .returning();

  return updated;
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
