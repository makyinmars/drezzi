import type { TRPCRouterRecord } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { bodyProfile, garment, lookbook, tryOn } from "@/db/schema";
import { getGarmentImageUrl } from "@/services/garment";
import { getProfilePhotoUrl } from "@/services/profile";
import { getTryOnResultUrl } from "@/services/try-on";
import { protectedProcedure } from "../init";

async function countValue(query: Promise<Array<{ count: number }>>) {
  const rows = await query;
  return Number(rows[0]?.count ?? 0);
}

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
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tryOn)
          .where(eq(tryOn.userId, userId))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tryOn)
          .where(and(eq(tryOn.userId, userId), eq(tryOn.status, "completed")))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tryOn)
          .where(and(eq(tryOn.userId, userId), eq(tryOn.status, "pending")))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tryOn)
          .where(and(eq(tryOn.userId, userId), eq(tryOn.status, "processing")))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(tryOn)
          .where(and(eq(tryOn.userId, userId), eq(tryOn.status, "failed")))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(lookbook)
          .where(eq(lookbook.userId, userId))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(lookbook)
          .where(and(eq(lookbook.userId, userId), eq(lookbook.isPublic, true)))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(garment)
          .where(eq(garment.userId, userId))
      ),
      countValue(
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(bodyProfile)
          .where(eq(bodyProfile.userId, userId))
      ),
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

    const tryOns = await ctx.db.query.tryOn.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
      with: {
        result: true,
        bodyProfile: {
          with: {
            photo: true,
          },
        },
        garment: {
          with: {
            image: true,
          },
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 5,
    });

    return await Promise.all(
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
