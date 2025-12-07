import type { TRPCRouterRecord } from "@trpc/server";

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

    const lookbooks = await ctx.prisma.lookbook.findMany({
      where: { userId },
      include: {
        _count: { select: { items: true } },
        cover: true,
        items: {
          take: 4,
          orderBy: { order: "asc" },
          include: {
            tryOn: {
              include: { result: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Promise.all(
      lookbooks.map(async (lb) => {
        const previews = await Promise.all(
          lb.items
            .filter((item) => item.tryOn.result?.key)
            .map((item) => getTryOnResultUrl(item.tryOn.result?.key ?? ""))
        );

        return {
          ...lb,
          coverUrl: await getLookbookCoverUrl(lb.cover?.key ?? null),
          itemCount: lb._count.items,
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

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.id, userId },
        include: {
          cover: true,
          items: {
            orderBy: { order: "asc" },
            include: {
              tryOn: {
                include: {
                  result: true,
                  garment: { include: { image: true } },
                  bodyProfile: { include: { photo: true } },
                },
              },
            },
          },
        },
      });

      if (!lookbook) {
        throw errors.lookbookNotFound();
      }

      const items = await Promise.all(
        lookbook.items.map(async (item) => ({
          ...item,
          tryOn: {
            ...item.tryOn,
            resultUrl: item.tryOn.result
              ? await getTryOnResultUrl(item.tryOn.result.key)
              : null,
            garment: {
              ...item.tryOn.garment,
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
        ...lookbook,
        coverUrl: await getLookbookCoverUrl(lookbook.cover?.key ?? null),
        items,
      };
    }),

  bySlug: publicProcedure
    .input(apiLookbookSlug)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);

      const lookbook = await ctx.prisma.lookbook.findUnique({
        where: { shareSlug: input.slug },
        include: {
          user: { select: { name: true, image: true } },
          cover: true,
          items: {
            orderBy: { order: "asc" },
            include: {
              tryOn: {
                include: {
                  result: true,
                  garment: { include: { image: true } },
                  bodyProfile: { include: { photo: true } },
                },
              },
            },
          },
        },
      });

      if (!lookbook) {
        throw errors.lookbookNotFound();
      }

      if (!lookbook.isPublic) {
        throw errors.lookbookNotPublic();
      }

      const items = await Promise.all(
        lookbook.items.map(async (item) => ({
          ...item,
          tryOn: {
            ...item.tryOn,
            resultUrl: item.tryOn.result
              ? await getTryOnResultUrl(item.tryOn.result.key)
              : null,
            garment: {
              ...item.tryOn.garment,
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
        ...lookbook,
        coverUrl: await getLookbookCoverUrl(lookbook.cover?.key ?? null),
        items,
      };
    }),

  create: protectedProcedure
    .input(apiLookbookCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.create({
        data: {
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
          userId,
          coverId: input.coverId ?? null,
        },
      });

      if (!lookbook) {
        throw errors.lookbookCreateFailed();
      }

      return lookbook;
    }),

  update: protectedProcedure
    .input(apiLookbookUpdate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      // Store old cover key for S3 cleanup after transaction
      let oldCoverKey: string | null = null;

      const updated = await ctx.prisma.$transaction(async (tx) => {
        const existing = await tx.lookbook.findFirst({
          where: { id, userId },
          include: { cover: true },
        });

        if (!existing) {
          throw errors.lookbookNotFound();
        }

        // Check if cover is being replaced
        if (
          data.coverId &&
          existing.cover &&
          data.coverId !== existing.coverId
        ) {
          oldCoverKey = existing.cover.key;
        }

        return await tx.lookbook.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            isPublic: data.isPublic,
            coverId: data.coverId,
          },
        });
      });

      // S3 cleanup after transaction commits (fire-and-forget)
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

      // Store key for S3 cleanup after transaction
      let coverKey: string | null = null;

      const deleted = await ctx.prisma.$transaction(async (tx) => {
        const lookbook = await tx.lookbook.findFirst({
          where: { id: input.id, userId },
          include: { cover: true },
        });

        if (!lookbook) {
          throw errors.lookbookNotFound();
        }

        coverKey = lookbook.cover?.key ?? null;

        return await tx.lookbook.delete({
          where: { id: input.id },
        });
      });

      // S3 cleanup after transaction commits (fire-and-forget)
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

      return await ctx.prisma.$transaction(async (tx) => {
        const lookbook = await tx.lookbook.findFirst({
          where: { id: input.lookbookId, userId },
        });

        if (!lookbook) {
          throw errors.lookbookNotFound();
        }

        const tryOn = await tx.tryOn.findFirst({
          where: { id: input.tryOnId, userId, status: "completed" },
        });

        if (!tryOn) {
          throw errors.tryOnNotFound();
        }

        const existing = await tx.lookbookItem.findUnique({
          where: {
            lookbookId_tryOnId: {
              lookbookId: input.lookbookId,
              tryOnId: input.tryOnId,
            },
          },
        });

        if (existing) {
          throw errors.lookbookItemDuplicate();
        }

        // Calculate order within transaction to prevent race conditions
        const maxItem = await tx.lookbookItem.findFirst({
          where: { lookbookId: input.lookbookId },
          orderBy: { order: "desc" },
        });
        const order = input.order ?? (maxItem ? maxItem.order + 1 : 0);

        const item = await tx.lookbookItem.create({
          data: {
            lookbookId: input.lookbookId,
            tryOnId: input.tryOnId,
            note: input.note,
            order,
          },
          include: {
            tryOn: {
              include: {
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

      const item = await ctx.prisma.lookbookItem.findFirst({
        where: { id: input.id },
        include: { lookbook: true },
      });

      if (!item || item.lookbook.userId !== userId) {
        throw errors.lookbookItemNotFound();
      }

      const deleted = await ctx.prisma.lookbookItem.delete({
        where: { id: input.id },
      });

      return deleted;
    }),

  updateItemNote: protectedProcedure
    .input(apiLookbookUpdateItemNote)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const item = await ctx.prisma.lookbookItem.findFirst({
        where: { id: input.id },
        include: { lookbook: true },
      });

      if (!item || item.lookbook.userId !== userId) {
        throw errors.lookbookItemNotFound();
      }

      const updated = await ctx.prisma.lookbookItem.update({
        where: { id: input.id },
        data: { note: input.note },
      });

      return updated;
    }),

  reorderItems: protectedProcedure
    .input(apiLookbookReorderItems)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.lookbookId, userId },
      });

      if (!lookbook) {
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

      return await ctx.prisma.$transaction(async (tx) => {
        const lookbook = await tx.lookbook.findFirst({
          where: { id: input.id, userId },
        });

        if (!lookbook) {
          throw errors.lookbookNotFound();
        }

        // Early return if already public with slug
        if (lookbook.shareSlug && lookbook.isPublic) {
          return { slug: lookbook.shareSlug, isPublic: true };
        }

        const slug =
          lookbook.shareSlug ?? (await generateShareSlug(lookbook.name));

        const updated = await tx.lookbook.update({
          where: { id: input.id },
          data: { shareSlug: slug, isPublic: true },
        });

        return { slug: updated.shareSlug, isPublic: updated.isPublic };
      });
    }),

  togglePublic: protectedProcedure
    .input(apiLookbookId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const lookbook = await ctx.prisma.lookbook.findFirst({
        where: { id: input.id, userId },
      });

      if (!lookbook) {
        throw errors.lookbookNotFound();
      }

      const updated = await ctx.prisma.lookbook.update({
        where: { id: input.id },
        data: { isPublic: !lookbook.isPublic },
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

      const existingItems = await ctx.prisma.lookbookItem.findMany({
        where: { lookbookId: input.id },
        select: { tryOnId: true },
      });

      const existingIds = existingItems.map((i) => i.tryOnId);

      const tryOns = await ctx.prisma.tryOn.findMany({
        where: {
          userId,
          status: "completed",
          id: { notIn: existingIds },
        },
        include: {
          result: true,
          garment: { include: { image: true } },
          bodyProfile: { include: { photo: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return Promise.all(
        tryOns.map(async (t) => ({
          ...t,
          resultUrl: t.result ? await getTryOnResultUrl(t.result.key) : null,
          garment: {
            ...t.garment,
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
