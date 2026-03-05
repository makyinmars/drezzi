import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import { Resource } from "sst";
import { bodyProfile, file } from "@/db/schema";
import { db } from "@/lib/db";
import { createId } from "@/lib/id";
import { getCachedPresignedUrl, s3 } from "@/lib/s3";

export async function getProfileUploadUrl(userId: string, contentType: string) {
  const extension = contentType.split("/").at(1) ?? "jpg";
  const key = `profiles/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  const [created] = await db
    .insert(file)
    .values({
      id: createId(),
      key,
      bucket: "media",
      mimeType: contentType,
      uploadedBy: userId,
    })
    .returning();

  return { url, key, fileId: created.id };
}

export async function setDefaultProfile(userId: string, profileId: string) {
  return await db.transaction(async (tx) => {
    await tx
      .update(bodyProfile)
      .set({
        isDefault: false,
        updatedAt: new Date(),
      })
      .where(
        and(eq(bodyProfile.userId, userId), eq(bodyProfile.isDefault, true))
      );

    const [updated] = await tx
      .update(bodyProfile)
      .set({
        isDefault: true,
        updatedAt: new Date(),
      })
      .where(and(eq(bodyProfile.id, profileId), eq(bodyProfile.userId, userId)))
      .returning();

    return updated;
  });
}

export async function deleteProfileAssets(photoKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: photoKey,
  });

  await s3.send(command);
}

export async function getProfilePhotoUrl(photoKey: string) {
  return await getCachedPresignedUrl(photoKey);
}
