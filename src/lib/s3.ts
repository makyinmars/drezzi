import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

import { redis } from "@/lib/redis";

export const s3 = new S3Client({
  requestChecksumCalculation: "WHEN_REQUIRED",
});

const PRESIGNED_TTL = 300; // 5 minutes
const CACHE_PREFIX = "presigned:";

async function isUrlValid(url: string): Promise<boolean> {
  const response = await fetch(url, { method: "HEAD" }).catch(() => null);
  return response?.ok ?? false;
}

export async function getPresignedUrl(key: string, expiresIn = 900) {
  const command = new GetObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
}

export async function getCachedPresignedUrl(key: string): Promise<string> {
  const cacheKey = `${CACHE_PREFIX}${key}`;

  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached && (await isUrlValid(cached))) return cached;

  const url = await getPresignedUrl(key);
  await redis.setex(cacheKey, PRESIGNED_TTL, url).catch(() => {});

  return url;
}
