import { eq } from "drizzle-orm";
import type { EnhancementStatus } from "@/db/enums";
import { bodyProfile, file } from "@/db/schema";
import { db } from "@/lib/db";
import { createId } from "@/lib/id";
import { getCachedPresignedUrl } from "@/lib/s3";

type UpdateProfileEnhancementParams = {
  status: EnhancementStatus;
  enhancedKey?: string;
  error?: string;
};

export async function updateProfileEnhancement(
  profileId: string,
  params: UpdateProfileEnhancementParams
) {
  let enhancedPhotoId: string | undefined;

  if (params.enhancedKey) {
    const [created] = await db
      .insert(file)
      .values({
        id: createId(),
        key: params.enhancedKey,
        bucket: "media",
        mimeType: "image/png",
      })
      .returning();
    enhancedPhotoId = created.id;
  }

  const updateData: Partial<typeof bodyProfile.$inferInsert> = {
    enhancementStatus: params.status,
    enhancementError: params.error ?? null,
    updatedAt: new Date(),
  };

  if (enhancedPhotoId) {
    updateData.enhancedPhotoId = enhancedPhotoId;
  }

  const [updated] = await db
    .update(bodyProfile)
    .set(updateData)
    .where(eq(bodyProfile.id, profileId))
    .returning();

  return updated;
}

export async function getEnhancedPhotoUrl(key: string) {
  return await getCachedPresignedUrl(key);
}
