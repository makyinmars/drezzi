import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

import { getPresignedUrl, s3 } from "@/lib/s3";

export async function getGarmentUploadUrl(userId: string, contentType: string) {
  const extension = contentType.split("/").at(1) ?? "jpg";
  const key = `garments/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  const imageUrl = `https://${Resource.MediaBucket.name}.s3.us-east-2.amazonaws.com/${key}`;

  return { url, key, imageUrl };
}

export async function deleteGarmentAssets(imageKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: imageKey,
  });

  await s3.send(command);
}

export async function getGarmentImageUrl(imageKey: string) {
  return await getPresignedUrl(imageKey);
}
