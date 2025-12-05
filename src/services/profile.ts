import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

import { prisma } from "@/lib/prisma";
import { getCachedPresignedUrl, s3 } from "@/lib/s3";

export async function getProfileUploadUrl(userId: string, contentType: string) {
  const extension = contentType.split("/")[1] || "jpg";
  const key = `profiles/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const photoUrl = `https://${Resource.MediaBucket.name}.s3.us-east-2.amazonaws.com/${key}`;

  return { url, key, photoUrl };
}

export async function setDefaultProfile(userId: string, profileId: string) {
  return await prisma.$transaction([
    prisma.bodyProfile.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.bodyProfile.update({
      where: { id: profileId, userId },
      data: { isDefault: true },
    }),
  ]);
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
