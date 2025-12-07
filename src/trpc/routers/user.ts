import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
import type { TRPCRouterRecord } from "@trpc/server";
import { Resource } from "sst";
import { s3 } from "@/lib/s3";
import { protectedProcedure } from "../init";

export const userRouter = {
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Collect all S3 keys for user's files
    const keys: string[] = [];

    // Get profile photo keys
    const profiles = await ctx.prisma.bodyProfile.findMany({
      where: { userId },
      include: { photo: true, enhancedPhoto: true },
    });

    for (const profile of profiles) {
      keys.push(profile.photo.key);
      if (profile.enhancedPhoto) {
        keys.push(profile.enhancedPhoto.key);
      }
    }

    // Get garment image keys
    const garments = await ctx.prisma.garment.findMany({
      where: { userId },
      include: { image: true, mask: true },
    });

    for (const garment of garments) {
      keys.push(garment.image.key);
      if (garment.mask) {
        keys.push(garment.mask.key);
      }
    }

    // Get try-on result keys
    const tryOns = await ctx.prisma.tryOn.findMany({
      where: { userId },
      include: { frontPhoto: true, backPhoto: true, result: true },
    });

    for (const tryOn of tryOns) {
      if (tryOn.frontPhoto) keys.push(tryOn.frontPhoto.key);
      if (tryOn.backPhoto) keys.push(tryOn.backPhoto.key);
      if (tryOn.result) keys.push(tryOn.result.key);
    }

    // Get lookbook cover keys
    const lookbooks = await ctx.prisma.lookbook.findMany({
      where: { userId },
      include: { cover: true },
    });

    for (const lookbook of lookbooks) {
      if (lookbook.cover) keys.push(lookbook.cover.key);
    }

    // Delete user from database (cascades to all related records)
    await ctx.prisma.user.delete({
      where: { id: userId },
    });

    // Batch delete S3 objects (fire-and-forget, after DB deletion)
    if (keys.length > 0) {
      // S3 DeleteObjects accepts max 1000 keys per request
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
          // Log but don't fail - user is already deleted
        });
      }
    }

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
