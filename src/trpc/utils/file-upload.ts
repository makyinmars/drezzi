import { PutObjectCommand } from "@aws-sdk/client-s3";
import { TRPCError } from "@trpc/server";
import { Resource } from "sst";
import { file } from "@/db/schema";
import type { Db, DbTx } from "@/lib/db";
import { createId } from "@/lib/id";
import { s3 } from "@/lib/s3";

type UploadParams = {
  file: File | Blob;
  userId: string;
  db: Db | DbTx;
  prefix: string;
  maxSizeBytes?: number;
  allowedMimeTypes?: RegExp;
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_IMAGE_REGEX = /^image\/(jpeg|png|webp)$/i;

async function toUint8Array(file: File | Blob) {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

export async function uploadFileToS3({
  file: rawFile,
  userId,
  db,
  prefix,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  allowedMimeTypes = DEFAULT_IMAGE_REGEX,
}: UploadParams) {
  if (!(rawFile.type && allowedMimeTypes.test(rawFile.type))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid file type",
    });
  }

  if (rawFile.size > maxSizeBytes) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File is too large",
    });
  }

  const extension = rawFile.type.split("/").at(1) ?? "bin";
  const key = `${prefix}/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const body = await toUint8Array(rawFile);

  await s3.send(
    new PutObjectCommand({
      Bucket: Resource.MediaBucket.name,
      Key: key,
      Body: body,
      ContentType: rawFile.type,
      ContentLength: body.byteLength,
    })
  );

  const [createdFile] = await db
    .insert(file)
    .values({
      id: createId(),
      key,
      bucket: "media",
      filename: rawFile instanceof File ? rawFile.name : undefined,
      mimeType: rawFile.type,
      size: rawFile.size,
      uploadedBy: userId,
    })
    .returning();

  return createdFile;
}
