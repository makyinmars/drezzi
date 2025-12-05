import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

export const s3 = new S3Client({});

export async function getPresignedUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn });
}
