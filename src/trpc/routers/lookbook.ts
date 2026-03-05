import type { TRPCRouterRecord } from "@trpc/server";
import { eq, inArray, sql } from "drizzle-orm";
import { lookbook, lookbookItem } from "@/db/schema";
import { createId } from "@/lib/id";
import { getGarmentImageUrl } from "@/services/garment";
import {
  deleteLookbookCover,
  generateShareSlug,
  getLookbookCoverUploadUrl,
  getLookbookCoverUrl,
  reorderLookbookItems,
} from "@/services/lookbook";
import { getProfilePhotoUrl } from "@/services/profile";
import { getTryOnResultUrl } from "@/services/try-on";
import {
  apiLookbookAddItem,
  apiLookbookCoverUpload,
  apiLookbookCreate,
  apiLookbookId,
  apiLookbookRemoveItem,
  apiLookbookReorderItems,
  apiLookbookSlug,
  apiLookbookUpdate,
  apiLookbookUpdateItemNote,
} from "@/validators/lookbook";
import { createErrors } from "../errors";
import { protectedProcedure, publicProcedure } from "../init";
import type { RouterOutput } from "../utils";

const IMAGE_TYPE_REGEX = /^image\/(jpeg|png|webp)$/;

export type LookbookListProcedure = RouterOutput["lookbook"]["list"];
export type LookbookByIdProcedure = RouterOutput["lookbook"]["byId"];

export const lookbookRouter = {
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const lookbooks = await ctx.db.query.lookbook.findMany({
      where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
      with: {
        cover: true,
        items: {
          limit: 4,
          orderBy: (t, { asc }) => [asc(t.order)],
          with: {
            tryOn: {
              with: { result: true },
            },
          },
        },
      },
      orderBy: (t, { desc }) => [desc(t.updatedAt)],
    });

    const lookbookIds = lookbooks.map((lb) => lb.id);
    const counts =
      lookbookIds.length === 0
        ? []
        : await ctx.db
            .select({
              lookbookId: lookbookItem.lookbookId,
              count: sql<number>`count(*)`,
            })
            .from(lookbookItem)
            .where(inArray(lookbookItem.lookbookId, lookbookIds))
            .groupBy(lookbookItem.lookbookId);
    const countMap = new Map(
      counts.map((row) => [row.lookbookId, Number(row.count)])
    );

    return await Promise.all(
      lookbooks.map(async (lb) => {
        const previews = await Promise.all(
          lb.items
            .filter((item) => item.tryOn.result?.key)
            .map((item) => getTryOnResultUrl(item.tryOn.result?.key ?? ""))
        );

        return {
          ...lb,
          coverUrl: await getLookbookCoverUrl(lb.cover?.key ?? null),
          itemCount: countMap.get(lb.id) ?? 0,
          _count: { items: countMap.get(lb.id) ?? 0 },
          previewUrls: previews,
        };
      })
    );
  }),

  byId: protectedProcedure
    .input(apiLookbookId)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbookData = await ctx.db.query.lookbook.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
        with: {
          cover: true,
          items: {
            orderBy: (t, { asc }) => [asc(t.order)],
            with: {
              tryOn: {
                with: {
                  result: true,
                  garment: { with: { image: true } },
                  bodyProfile: { with: { photo: true } },
                },
              },
            },
          },
        },
      });

      if (!lookbookData) {
        throw errors.lookbookNotFound();
      }

      const items = await Promise.all(
        lookbookData.items.map(async (item) => ({
          ...item,
          tryOn: {
            ...item.tryOn,
            resultUrl: item.tryOn.result
              ? await getTryOnResultUrl(item.tryOn.result.key)
              : null,
            garment: {
              ...item.tryOn.garment,
              colors: item.tryOn.garment.colors ?? [],
              sizes: item.tryOn.garment.sizes ?? [],
              tags: item.tryOn.garment.tags ?? [],
              metadata: item.tryOn.garment.metadata ?? {},
              imageUrl: await getGarmentImageUrl(item.tryOn.garment.image.key),
            },
            bodyProfile: {
              ...item.tryOn.bodyProfile,
              photoUrl: await getProfilePhotoUrl(
                item.tryOn.bodyProfile.photo.key
              ),
            },
          },
        }))
      );

      return {
        ...lookbookData,
        coverUrl: await getLookbookCoverUrl(lookbookData.cover?.key ?? null),
        items,
      };
    }),

  bySlug: publicProcedure
    .input(apiLookbookSlug)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);

      const lookbookData = await ctx.db.query.lookbook.findFirst({
        where: (t, { eq: eqOp }) => eqOp(t.shareSlug, input.slug),
        with: {
          user: {
            columns: {
              name: true,
              image: true,
            },
          },
          cover: true,
          items: {
            orderBy: (t, { asc }) => [asc(t.order)],
            with: {
              tryOn: {
                with: {
                  result: true,
                  garment: { with: { image: true } },
                  bodyProfile: { with: { photo: true } },
                },
              },
            },
          },
        },
      });

      if (!lookbookData) {
        throw errors.lookbookNotFound();
      }

      if (!lookbookData.isPublic) {
        throw errors.lookbookNotPublic();
      }

      const items = await Promise.all(
        lookbookData.items.map(async (item) => ({
          ...item,
          tryOn: {
            ...item.tryOn,
            resultUrl: item.tryOn.result
              ? await getTryOnResultUrl(item.tryOn.result.key)
              : null,
            garment: {
              ...item.tryOn.garment,
              colors: item.tryOn.garment.colors ?? [],
              sizes: item.tryOn.garment.sizes ?? [],
              tags: item.tryOn.garment.tags ?? [],
              metadata: item.tryOn.garment.metadata ?? {},
              imageUrl: await getGarmentImageUrl(item.tryOn.garment.image.key),
            },
            bodyProfile: {
              ...item.tryOn.bodyProfile,
              photoUrl: await getProfilePhotoUrl(
                item.tryOn.bodyProfile.photo.key
              ),
            },
          },
        }))
      );

      return {
        ...lookbookData,
        coverUrl: await getLookbookCoverUrl(lookbookData.cover?.key ?? null),
        items,
      };
    }),

  create: protectedProcedure
    .input(apiLookbookCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const [created] = await ctx.db
        .insert(lookbook)
        .values({
          id: createId(),
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
          userId,
          coverId: input.coverId ?? null,
          updatedAt: new Date(),
        })
        .returning();

      if (!created) {
        throw errors.lookbookCreateFailed();
      }

      return created;
    }),

  update: protectedProcedure
    .input(apiLookbookUpdate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      let oldCoverKey: string | null = null;

      const updated = await ctx.db.transaction(async (tx) => {
        const existing = await tx.query.lookbook.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, id), eqOp(t.userId, userId)),
          with: { cover: true },
        });

        if (!existing) {
          throw errors.lookbookNotFound();
        }

        if (
          data.coverId &&
          existing.cover &&
          data.coverId !== existing.coverId
        ) {
          oldCoverKey = existing.cover.key;
        }

        const [next] = await tx
          .update(lookbook)
          .set({
            name: data.name,
            description: data.description,
            isPublic: data.isPublic,
            coverId: data.coverId,
            updatedAt: new Date(),
          })
          .where(eq(lookbook.id, id))
          .returning();

        return next;
      });

      if (oldCoverKey) {
        deleteLookbookCover(oldCoverKey).catch(() => {});
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(apiLookbookId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      let coverKey: string | null = null;

      const deleted = await ctx.db.transaction(async (tx) => {
        const lookbookData = await tx.query.lookbook.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
          with: { cover: true },
        });

        if (!lookbookData) {
          throw errors.lookbookNotFound();
        }

        coverKey = lookbookData.cover?.key ?? null;

        const [deletedLookbook] = await tx
          .delete(lookbook)
          .where(eq(lookbook.id, input.id))
          .returning();

        return deletedLookbook;
      });

      if (coverKey) {
        deleteLookbookCover(coverKey).catch(() => {});
      }

      return deleted;
    }),

  addItem: protectedProcedure
    .input(apiLookbookAddItem)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      return await ctx.db.transaction(async (tx) => {
        const lookbookData = await tx.query.lookbook.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, input.lookbookId), eqOp(t.userId, userId)),
          columns: { id: true },
        });

        if (!lookbookData) {
          throw errors.lookbookNotFound();
        }

        const tryOnData = await tx.query.tryOn.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(
              eqOp(t.id, input.tryOnId),
              eqOp(t.userId, userId),
              eqOp(t.status, "completed")
            ),
          columns: { id: true },
        });

        if (!tryOnData) {
          throw errors.tryOnNotFound();
        }

        const existing = await tx.query.lookbookItem.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(
              eqOp(t.lookbookId, input.lookbookId),
              eqOp(t.tryOnId, input.tryOnId)
            ),
          columns: { id: true },
        });

        if (existing) {
          throw errors.lookbookItemDuplicate();
        }

        const maxItem = await tx.query.lookbookItem.findFirst({
          where: (t, { eq: eqOp }) => eqOp(t.lookbookId, input.lookbookId),
          orderBy: (t, { desc }) => [desc(t.order)],
          columns: { order: true },
        });
        const order = input.order ?? (maxItem ? maxItem.order + 1 : 0);

        const [created] = await tx
          .insert(lookbookItem)
          .values({
            id: createId(),
            lookbookId: input.lookbookId,
            tryOnId: input.tryOnId,
            note: input.note,
            order,
          })
          .returning();

        const item = await tx.query.lookbookItem.findFirst({
          where: (t, { eq: eqOp }) => eqOp(t.id, created.id),
          with: {
            tryOn: {
              with: {
                garment: true,
                bodyProfile: true,
              },
            },
          },
        });

        return item;
      });
    }),

  removeItem: protectedProcedure
    .input(apiLookbookRemoveItem)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const item = await ctx.db.query.lookbookItem.findFirst({
        where: (t, { eq: eqOp }) => eqOp(t.id, input.id),
        with: {
          lookbook: {
            columns: {
              userId: true,
            },
          },
        },
      });

      if (!item || item.lookbook.userId !== userId) {
        throw errors.lookbookItemNotFound();
      }

      const [deleted] = await ctx.db
        .delete(lookbookItem)
        .where(eq(lookbookItem.id, input.id))
        .returning();

      return deleted;
    }),

  updateItemNote: protectedProcedure
    .input(apiLookbookUpdateItemNote)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const item = await ctx.db.query.lookbookItem.findFirst({
        where: (t, { eq: eqOp }) => eqOp(t.id, input.id),
        with: {
          lookbook: {
            columns: {
              userId: true,
            },
          },
        },
      });

      if (!item || item.lookbook.userId !== userId) {
        throw errors.lookbookItemNotFound();
      }

      const [updated] = await ctx.db
        .update(lookbookItem)
        .set({ note: input.note })
        .where(eq(lookbookItem.id, input.id))
        .returning();

      return updated;
    }),

  reorderItems: protectedProcedure
    .input(apiLookbookReorderItems)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbookData = await ctx.db.query.lookbook.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.lookbookId), eqOp(t.userId, userId)),
        columns: { id: true },
      });

      if (!lookbookData) {
        throw errors.lookbookNotFound();
      }

      await reorderLookbookItems(input.lookbookId, input.items);

      return { success: true };
    }),

  generateShareLink: protectedProcedure
    .input(apiLookbookId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      return await ctx.db.transaction(async (tx) => {
        const lookbookData = await tx.query.lookbook.findFirst({
          where: (t, { and: andOp, eq: eqOp }) =>
            andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
        });

        if (!lookbookData) {
          throw errors.lookbookNotFound();
        }

        if (lookbookData.shareSlug && lookbookData.isPublic) {
          return { slug: lookbookData.shareSlug, isPublic: true };
        }

        const slug =
          lookbookData.shareSlug ??
          (await generateShareSlug(lookbookData.name));

        const [updated] = await tx
          .update(lookbook)
          .set({
            shareSlug: slug,
            isPublic: true,
            updatedAt: new Date(),
          })
          .where(eq(lookbook.id, input.id))
          .returning({
            shareSlug: lookbook.shareSlug,
            isPublic: lookbook.isPublic,
          });

        return { slug: updated.shareSlug, isPublic: updated.isPublic };
      });
    }),

  togglePublic: protectedProcedure
    .input(apiLookbookId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbookData = await ctx.db.query.lookbook.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.id), eqOp(t.userId, userId)),
      });

      if (!lookbookData) {
        throw errors.lookbookNotFound();
      }

      const [updated] = await ctx.db
        .update(lookbook)
        .set({
          isPublic: !lookbookData.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(lookbook.id, input.id))
        .returning({
          isPublic: lookbook.isPublic,
        });

      return { success: true, isPublic: updated.isPublic };
    }),

  getCoverUploadUrl: protectedProcedure
    .input(apiLookbookCoverUpload)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      if (!IMAGE_TYPE_REGEX.test(input.contentType)) {
        throw errors.invalidLookbookCover();
      }

      const result = await getLookbookCoverUploadUrl(userId, input.contentType);
      return result;
    }),

  availableTryOns: protectedProcedure
    .input(apiLookbookId)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existingItems = await ctx.db.query.lookbookItem.findMany({
        where: (t, { eq: eqOp }) => eqOp(t.lookbookId, input.id),
        columns: { tryOnId: true },
      });

      const existingIds = existingItems.map((i) => i.tryOnId);

      const tryOns =
        existingIds.length > 0
          ? await ctx.db.query.tryOn.findMany({
              where: (t, { and: andOp, eq: eqOp, notInArray: notInArrayOp }) =>
                andOp(
                  eqOp(t.userId, userId),
                  eqOp(t.status, "completed"),
                  notInArrayOp(t.id, existingIds)
                ),
              with: {
                result: true,
                garment: { with: { image: true } },
                bodyProfile: { with: { photo: true } },
              },
              orderBy: (t, { desc }) => [desc(t.createdAt)],
            })
          : await ctx.db.query.tryOn.findMany({
              where: (t, { and: andOp, eq: eqOp }) =>
                andOp(eqOp(t.userId, userId), eqOp(t.status, "completed")),
              with: {
                result: true,
                garment: { with: { image: true } },
                bodyProfile: { with: { photo: true } },
              },
              orderBy: (t, { desc }) => [desc(t.createdAt)],
            });

      return await Promise.all(
        tryOns.map(async (t) => ({
          ...t,
          resultUrl: t.result ? await getTryOnResultUrl(t.result.key) : null,
          garment: {
            ...t.garment,
            colors: t.garment.colors ?? [],
            sizes: t.garment.sizes ?? [],
            tags: t.garment.tags ?? [],
            metadata: t.garment.metadata ?? {},
            imageUrl: await getGarmentImageUrl(t.garment.image.key),
          },
          bodyProfile: {
            ...t.bodyProfile,
            photoUrl: await getProfilePhotoUrl(t.bodyProfile.photo.key),
          },
        }))
      );
    }),
} satisfies TRPCRouterRecord;
