import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

import { redis } from "@/lib/redis";

export const s3 = new S3Client({});

const PRESIGNED_TTL = 3300; // 55 minutes
const CACHE_PREFIX = "presigned:";

export async function getPresignedUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
}

export async function getCachedPresignedUrl(key: string): Promise<string> {
  const cacheKey = `${CACHE_PREFIX}${key}`;

  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const url = await getPresignedUrl(key);
  await redis.setex(cacheKey, PRESIGNED_TTL, url);

  return url;
}
