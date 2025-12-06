import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

import { prisma } from "@/lib/prisma";
import { getCachedPresignedUrl, s3 } from "@/lib/s3";

export async function generateShareSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 6);
  const slug = `${base}-${timestamp}-${random}`;

  const existing = await prisma.lookbook.findUnique({
    where: { shareSlug: slug },
  });

  if (existing) {
    return generateShareSlug(name);
  }

  return slug;
}

export async function getLookbookCoverUploadUrl(
  userId: string,
  contentType: string
) {
  const extension = contentType.split("/").at(1) ?? "jpg";
  const key = `lookbooks/${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  const file = await prisma.file.create({
    data: {
      key,
      bucket: "media",
      mimeType: contentType,
      uploadedBy: userId,
    },
  });

  return { url, key, fileId: file.id };
}

export async function getLookbookCoverUrl(
  coverKey: string | null
): Promise<string | null> {
  if (!coverKey) return null;
  return await getCachedPresignedUrl(coverKey);
}

export async function deleteLookbookCover(coverKey: string | null) {
  if (!coverKey) return;

  const command = new DeleteObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: coverKey,
  });

  await s3.send(command);
}

export async function reorderLookbookItems(
  lookbookId: string,
  items: Array<{ id: string; order: number }>
) {
  return await prisma.$transaction(
    items.map((item) =>
      prisma.lookbookItem.update({
        where: { id: item.id, lookbookId },
        data: { order: item.order },
      })
    )
  );
}

export async function getNextItemOrder(lookbookId: string): Promise<number> {
  const maxItem = await prisma.lookbookItem.findFirst({
    where: { lookbookId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (maxItem?.order ?? -1) + 1;
}
