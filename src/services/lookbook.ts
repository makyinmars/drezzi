import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq } from "drizzle-orm";
import { Resource } from "sst";
import { file, lookbookItem } from "@/db/schema";
import { db } from "@/lib/db";
import { createId } from "@/lib/id";
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

  const existing = await db.query.lookbook.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.shareSlug, slug),
    columns: { id: true },
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
  return await db.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .update(lookbookItem)
        .set({ order: item.order })
        .where(
          and(
            eq(lookbookItem.id, item.id),
            eq(lookbookItem.lookbookId, lookbookId)
          )
        );
    }
  });
}

export async function getNextItemOrder(lookbookId: string): Promise<number> {
  const maxItem = await db.query.lookbookItem.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.lookbookId, lookbookId),
    orderBy: (t, { desc: descOp }) => [descOp(t.order)],
    columns: { order: true },
  });

  return (maxItem?.order ?? -1) + 1;
}
