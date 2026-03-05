import type { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import { styleTip } from "@/db/schema";
import { createId } from "@/lib/id";
import {
  getTryOnForTipGeneration,
  regenerateStyleTips,
} from "@/services/style-tip";
import {
  apiStyleTipByTryOnId,
  apiStyleTipCreate,
  apiStyleTipId,
  apiStyleTipUpdate,
} from "@/validators/style-tip";
import { createErrors } from "../errors";
import { protectedProcedure } from "../init";
import type { RouterOutput } from "../utils";

export type StyleTipListProcedure = RouterOutput["styleTip"]["byTryOnId"];

export const styleTipRouter = {
  byTryOnId: protectedProcedure
    .input(apiStyleTipByTryOnId)
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOnData = await ctx.db.query.tryOn.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.tryOnId), eqOp(t.userId, userId)),
        columns: { id: true },
      });

      if (!tryOnData) {
        throw errors.tryOnNotFound();
      }

      const tips = await ctx.db.query.styleTip.findMany({
        where: (t, { eq: eqOp }) => eqOp(t.tryOnId, input.tryOnId),
        orderBy: (t, { asc: ascOp }) => [ascOp(t.createdAt)],
      });

      return tips;
    }),

  create: protectedProcedure
    .input(apiStyleTipCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOnData = await ctx.db.query.tryOn.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.tryOnId), eqOp(t.userId, userId)),
        columns: { id: true },
      });

      if (!tryOnData) {
        throw errors.tryOnNotFound();
      }

      const [tip] = await ctx.db
        .insert(styleTip)
        .values({
          id: createId(),
          tryOnId: input.tryOnId,
          category: input.category,
          content: input.content,
        })
        .returning();

      if (!tip) {
        throw errors.styleTipCreateFailed();
      }

      return tip;
    }),

  update: protectedProcedure
    .input(apiStyleTipUpdate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      const tip = await ctx.db.query.styleTip.findFirst({
        where: (t, { eq: eqOp }) => eqOp(t.id, id),
        with: {
          tryOn: {
            columns: {
              userId: true,
            },
          },
        },
      });

      if (!tip) {
        throw errors.styleTipNotFound();
      }

      if (tip.tryOn.userId !== userId) {
        throw errors.styleTipForbidden();
      }

      const [updated] = await ctx.db
        .update(styleTip)
        .set(data)
        .where(eq(styleTip.id, id))
        .returning();

      if (!updated) {
        throw errors.styleTipUpdateFailed();
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(apiStyleTipId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tip = await ctx.db.query.styleTip.findFirst({
        where: (t, { eq: eqOp }) => eqOp(t.id, input.id),
        with: {
          tryOn: {
            columns: {
              userId: true,
            },
          },
        },
      });

      if (!tip) {
        throw errors.styleTipNotFound();
      }

      if (tip.tryOn.userId !== userId) {
        throw errors.styleTipForbidden();
      }

      const [deleted] = await ctx.db
        .delete(styleTip)
        .where(eq(styleTip.id, input.id))
        .returning();

      return deleted;
    }),

  regenerate: protectedProcedure
    .input(apiStyleTipByTryOnId)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOnData = await getTryOnForTipGeneration(input.tryOnId);

      if (!tryOnData) {
        throw errors.tryOnNotFound();
      }

      if (tryOnData.userId !== userId) {
        throw errors.tryOnForbidden();
      }

      if (tryOnData.status !== "completed") {
        throw errors.tryOnStatusInvalid();
      }

      await regenerateStyleTips({
        tryOnId: input.tryOnId,
        garmentName: tryOnData.garment.name,
        garmentCategory: tryOnData.garment.category,
        garmentDescription: tryOnData.garment.description,
        garmentColors: tryOnData.garment.colors ?? [],
        bodyProfileFitPreference: tryOnData.bodyProfile.fitPreference,
      });

      const tips = await ctx.db.query.styleTip.findMany({
        where: (t, { eq: eqOp }) => eqOp(t.tryOnId, input.tryOnId),
        orderBy: (t, { asc: ascOp }) => [ascOp(t.createdAt)],
      });

      return tips;
    }),
} satisfies TRPCRouterRecord;
