import type { TRPCRouterRecord } from "@trpc/server";
import { and, eq, gte, lte } from "drizzle-orm";
import z from "zod/v4";
import { tryOn } from "@/db/schema";
import { createId } from "@/lib/id";
import { enqueueTryOnJob } from "@/lib/sqs";
import { getGarmentImageUrl } from "@/services/garment";
import { getProfilePhotoUrl } from "@/services/profile";
import { deleteTryOnAssets, getTryOnResultUrl } from "@/services/try-on";
import {
  apiTryOnCreate,
  apiTryOnFilters,
  apiTryOnId,
} from "@/validators/try-on";
import { createErrors } from "../errors";
import { protectedProcedure } from "../init";
import type { RouterOutput } from "../utils";

export type TryOnListProcedure = RouterOutput["tryOn"]["list"];

type TryOnResponseItemBase = {
  result: { key: string } | null;
  bodyProfile: {
    photo: {
      key: string;
    };
  };
  garment: {
    image: {
      key: string;
    };
    colors: string[] | null;
    sizes: string[] | null;
    tags: string[] | null;
    metadata: Record<string, object> | null;
  };
};

async function toTryOnResponse<T extends TryOnResponseItemBase>(items: T[]) {
  return await Promise.all(
    items.map(async (t) => ({
      ...t,
      resultUrl: t.result ? await getTryOnResultUrl(t.result.key) : null,
      bodyProfile: {
        ...t.bodyProfile,
        photoUrl: await getProfilePhotoUrl(t.bodyProfile.photo.key),
      },
      garment: {
        ...t.garment,
        colors: t.garment.colors ?? [],
        sizes: t.garment.sizes ?? [],
        tags: t.garment.tags ?? [],
        metadata: t.garment.metadata ?? {},
        imageUrl: await getGarmentImageUrl(t.garment.image.key),
      },
    }))
  );
}

export const tryOnRouter = {
  list: protectedProcedure
    .input(apiTryOnFilters)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const conditions = [eq(tryOn.userId, userId)];

      if (input.status) {
        conditions.push(eq(tryOn.status, input.status));
      }
      if (input.isFavorite !== undefined) {
        conditions.push(eq(tryOn.isFavorite, input.isFavorite));
      }
      if (input.dateFrom) {
        conditions.push(gte(tryOn.createdAt, input.dateFrom));
      }
      if (input.dateTo) {
        conditions.push(lte(tryOn.createdAt, input.dateTo));
      }

      const tryOns = await ctx.db.query.tryOn.findMany({
        where: and(...conditions),
        with: {
          result: true,
          bodyProfile: { with: { photo: true } },
          garment: { with: { image: true } },
          styleTips: true,
        },
        orderBy: (t, { desc: descOp }) => [descOp(t.createdAt)],
      });

      const filtered =
        input.garmentCategory !== undefined
          ? tryOns.filter(
              (item) => item.garment.category === input.garmentCategory
            )
          : tryOns;

      return await toTryOnResponse(filtered);
    }),

  byId: protectedProcedure.input(apiTryOnId).query(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);
    const userId = ctx.session.user.id;

    const tryOnData = await ctx.db.query.tryOn.findFirst({
      where: (t, { and: andOp, eq: eqOp }) =>
        andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
      with: {
        result: true,
        bodyProfile: { with: { photo: true } },
        garment: { with: { image: true } },
        styleTips: true,
      },
    });

    if (!tryOnData) {
      throw errors.tryOnNotFound();
    }

    return (await toTryOnResponse([tryOnData]))[0];
  }),

  create: protectedProcedure
    .input(z.union([apiTryOnCreate, z.instanceof(FormData)]))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const parsed =
        input instanceof FormData
          ? apiTryOnCreate.parse({
              bodyProfileId: input.get("bodyProfileId")?.toString() ?? "",
              garmentId: input.get("garmentId")?.toString() ?? "",
            })
          : input;

      return await ctx.db.transaction(async (tx) => {
        const bodyProfile = await tx.query.bodyProfile.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, parsed.bodyProfileId), eqOp(t.userId, userId)),
          with: { photo: true },
        });

        if (!bodyProfile) {
          throw errors.profileNotFound();
        }

        const garmentData = await tx.query.garment.findFirst({
          where: (t, { and: andOp, eq: eqOp, or: orOp }) =>
            andOp(
              eqOp(t.id, parsed.garmentId),
              orOp(eqOp(t.userId, userId), eqOp(t.isPublic, true))
            ),
          with: { image: true },
        });

        if (!garmentData) {
          throw errors.garmentNotFound();
        }

        const [created] = await tx
          .insert(tryOn)
          .values({
            id: createId(),
            userId,
            bodyProfileId: parsed.bodyProfileId,
            garmentId: parsed.garmentId,
            status: "processing",
            updatedAt: new Date(),
          })
          .returning();

        const jobId = await enqueueTryOnJob({
          tryOnId: created.id,
          userId,
          bodyImageUrl: bodyProfile.photo.key,
          garmentImageUrl: garmentData.image.key,
        });

        const [updated] = await tx
          .update(tryOn)
          .set({
            jobId,
            updatedAt: new Date(),
          })
          .where(eq(tryOn.id, created.id))
          .returning();

        const fullTryOn = await tx.query.tryOn.findFirst({
          where: (t, { eq: eqOp }) => eqOp(t.id, updated.id),
          with: {
            bodyProfile: { with: { photo: true } },
            garment: { with: { image: true } },
            result: true,
          },
        });

        if (!fullTryOn) {
          throw errors.tryOnCreateFailed();
        }

        return {
          ...(await toTryOnResponse([fullTryOn]))[0],
          jobId,
          status: "processing" as const,
        };
      });
    }),

  toggleFavorite: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOnData = await ctx.db.query.tryOn.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
      });

      if (!tryOnData) {
        throw errors.tryOnNotFound();
      }

      const [updated] = await ctx.db
        .update(tryOn)
        .set({
          isFavorite: !tryOnData.isFavorite,
          updatedAt: new Date(),
        })
        .where(eq(tryOn.id, input.id))
        .returning({
          isFavorite: tryOn.isFavorite,
        });

      return { success: true, isFavorite: updated.isFavorite };
    }),

  delete: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      let resultKey: string | null = null;

      const deleted = await ctx.db.transaction(async (tx) => {
        const tryOnData = await tx.query.tryOn.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
          with: { result: true },
        });

        if (!tryOnData) {
          throw errors.tryOnNotFound();
        }

        resultKey = tryOnData.result?.key ?? null;

        const [deletedTryOn] = await tx
          .delete(tryOn)
          .where(eq(tryOn.id, input.id))
          .returning();

        return deletedTryOn;
      });

      if (resultKey) {
        deleteTryOnAssets(resultKey).catch(() => {});
      }

      return deleted;
    }),

  retry: protectedProcedure
    .input(apiTryOnId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      return await ctx.db.transaction(async (tx) => {
        const tryOnData = await tx.query.tryOn.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(
              eqOp(t.id, input.id),
              eqOp(t.userId, userId),
              eqOp(t.status, "failed")
            ),
          with: {
            bodyProfile: { with: { photo: true } },
            garment: { with: { image: true } },
          },
        });

        if (!tryOnData) {
          throw errors.tryOnNotFound();
        }

        const jobId = await enqueueTryOnJob({
          tryOnId: tryOnData.id,
          userId,
          bodyImageUrl: tryOnData.bodyProfile.photo.key,
          garmentImageUrl: tryOnData.garment.image.key,
        });

        const [updated] = await tx
          .update(tryOn)
          .set({
            jobId,
            status: "processing",
            errorMessage: null,
            updatedAt: new Date(),
          })
          .where(eq(tryOn.id, tryOnData.id))
          .returning();

        return updated;
      });
    }),

  favorites: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const tryOns = await ctx.db.query.tryOn.findMany({
      where: (t, { and: andOp, eq: eqOp }) =>
        andOp(
          eqOp(t.userId, userId),
          eqOp(t.isFavorite, true),
          eqOp(t.status, "completed")
        ),
      with: {
        result: true,
        bodyProfile: { with: { photo: true } },
        garment: { with: { image: true } },
      },
      orderBy: (t, { desc: descOp }) => [descOp(t.createdAt)],
    });

    return await toTryOnResponse(tryOns);
  }),

  recent: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const tryOns = await ctx.db.query.tryOn.findMany({
      where: (t, { and: andOp, eq: eqOp }) =>
        andOp(eqOp(t.userId, userId), eqOp(t.status, "completed")),
      with: {
        result: true,
        bodyProfile: { with: { photo: true } },
        garment: { with: { image: true } },
      },
      orderBy: (t, { desc: descOp }) => [descOp(t.completedAt)],
      limit: 10,
    });

    return await toTryOnResponse(tryOns);
  }),
} satisfies TRPCRouterRecord;
