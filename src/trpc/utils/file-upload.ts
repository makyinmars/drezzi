import { PutObjectCommand } from "@aws-sdk/client-s3";
import { TRPCError } from "@trpc/server";
import { Resource } from "sst";
import { s3 } from "@/lib/s3";
import type { PrismaClient } from "../../../generated/prisma/client";

// Type that works for both PrismaClient and transaction client
type PrismaTransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type UploadParams = {
  file: File | Blob;
  userId: string;
  prisma: PrismaClient | PrismaTransactionClient;
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
  file,
  userId,
  prisma,
  prefix,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  allowedMimeTypes = DEFAULT_IMAGE_REGEX,
}: UploadParams) {
  if (!(file.type && allowedMimeTypes.test(file.type))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid file type",
    });
  }

  if (file.size > maxSizeBytes) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File is too large",
    });
  }

  const extension = file.type.split("/").at(1) ?? "bin";
  const key = `${prefix}/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const body = await toUint8Array(file);

  await s3.send(
    new PutObjectCommand({
      Bucket: Resource.MediaBucket.name,
      Key: key,
      Body: body,
      ContentType: file.type,
      ContentLength: body.byteLength,
    })
  );

  const createdFile = await prisma.file.create({
    data: {
      key,
      bucket: "media",
      filename: file instanceof File ? file.name : undefined,
      mimeType: file.type,
      size: file.size,
      uploadedBy: userId,
    },
  });

  return createdFile;
}
