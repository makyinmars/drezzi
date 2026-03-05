import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import type { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { Resource } from "sst";
import { user } from "@/db/schema";
import { s3 } from "@/lib/s3";
import { protectedProcedure } from "../init";

export const userRouter = {
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const keys: string[] = [];

    const profiles = await ctx.db.query.bodyProfile.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
      with: { photo: true, enhancedPhoto: true },
    });

    for (const profile of profiles) {
      keys.push(profile.photo.key);
      if (profile.enhancedPhoto) {
        keys.push(profile.enhancedPhoto.key);
      }
    }

    const garments = await ctx.db.query.garment.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
      with: { image: true, mask: true },
    });

    for (const garmentData of garments) {
      keys.push(garmentData.image.key);
      if (garmentData.mask) {
        keys.push(garmentData.mask.key);
      }
    }

    const tryOns = await ctx.db.query.tryOn.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
      with: { frontPhoto: true, backPhoto: true, result: true },
    });

    for (const tryOnData of tryOns) {
      if (tryOnData.frontPhoto) keys.push(tryOnData.frontPhoto.key);
      if (tryOnData.backPhoto) keys.push(tryOnData.backPhoto.key);
      if (tryOnData.result) keys.push(tryOnData.result.key);
    }

    const lookbooks = await ctx.db.query.lookbook.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
      with: { cover: true },
    });

    for (const lookbookData of lookbooks) {
      if (lookbookData.cover) keys.push(lookbookData.cover.key);
    }

    await ctx.db.delete(user).where(eq(user.id, userId));

    if (keys.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < keys.length; i += 1000) {
        chunks.push(keys.slice(i, i + 1000));
      }

      for (const chunk of chunks) {
        const command = new DeleteObjectsCommand({
          Bucket: Resource.MediaBucket.name,
          Delete: {
            Objects: chunk.map((key) => ({ Key: key })),
            Quiet: true,
          },
        });

        s3.send(command).catch(() => {
          // User is already deleted; object cleanup can fail silently.
        });
      }
    }

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
