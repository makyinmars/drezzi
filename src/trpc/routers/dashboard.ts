import type { TRPCRouterRecord } from "@trpc/server";

import { getGarmentImageUrl } from "@/services/garment";
import { getProfilePhotoUrl } from "@/services/profile";
import { getTryOnResultUrl } from "@/services/try-on";

import { protectedProcedure } from "../init";

export const dashboardRouter = {
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [
      totalTryOns,
      completedTryOns,
      pendingTryOns,
      processingTryOns,
      failedTryOns,
      totalLookbooks,
      publicLookbooks,
      totalGarments,
      totalProfiles,
    ] = await Promise.all([
      ctx.prisma.tryOn.count({ where: { userId } }),
      ctx.prisma.tryOn.count({ where: { userId, status: "completed" } }),
      ctx.prisma.tryOn.count({ where: { userId, status: "pending" } }),
      ctx.prisma.tryOn.count({ where: { userId, status: "processing" } }),
      ctx.prisma.tryOn.count({ where: { userId, status: "failed" } }),
      ctx.prisma.lookbook.count({ where: { userId } }),
      ctx.prisma.lookbook.count({ where: { userId, isPublic: true } }),
      ctx.prisma.garment.count({ where: { userId } }),
      ctx.prisma.bodyProfile.count({ where: { userId } }),
    ]);

    const successRate =
      totalTryOns > 0 ? Math.round((completedTryOns / totalTryOns) * 100) : 0;

    return {
      totalTryOns,
      completedTryOns,
      pendingTryOns,
      processingTryOns,
      failedTryOns,
      totalLookbooks,
      publicLookbooks,
      totalGarments,
      totalProfiles,
      successRate,
    };
  }),

  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const tryOns = await ctx.prisma.tryOn.findMany({
      where: { userId },
      include: {
        result: true,
        bodyProfile: { include: { photo: true } },
        garment: { include: { image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return Promise.all(
      tryOns.map(async (t) => ({
        id: t.id,
        status: t.status,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
        resultUrl: t.result ? await getTryOnResultUrl(t.result.key) : null,
        garment: {
          id: t.garment.id,
          name: t.garment.name,
          category: t.garment.category,
          imageUrl: await getGarmentImageUrl(t.garment.image.key),
        },
        bodyProfile: {
          id: t.bodyProfile.id,
          name: t.bodyProfile.name,
          photoUrl: await getProfilePhotoUrl(t.bodyProfile.photo.key),
        },
      }))
    );
  }),
} satisfies TRPCRouterRecord;
