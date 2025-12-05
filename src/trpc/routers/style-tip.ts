import type { TRPCRouterRecord } from "@trpc/server";

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

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.tryOnId, userId },
      });

      if (!tryOn) {
        throw errors.tryOnNotFound();
      }

      const tips = await ctx.prisma.styleTip.findMany({
        where: { tryOnId: input.tryOnId },
        orderBy: { createdAt: "asc" },
      });

      return tips;
    }),

  create: protectedProcedure
    .input(apiStyleTipCreate)
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.tryOnId, userId },
      });

      if (!tryOn) {
        throw errors.tryOnNotFound();
      }

      const tip = await ctx.prisma.styleTip.create({
        data: {
          tryOnId: input.tryOnId,
          category: input.category,
          content: input.content,
        },
      });

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

      const tip = await ctx.prisma.styleTip.findFirst({
        where: { id },
        include: { tryOn: true },
      });

      if (!tip) {
        throw errors.styleTipNotFound();
      }

      if (tip.tryOn.userId !== userId) {
        throw errors.styleTipForbidden();
      }

      const updated = await ctx.prisma.styleTip.update({
        where: { id },
        data,
      });

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

      const tip = await ctx.prisma.styleTip.findFirst({
        where: { id: input.id },
        include: { tryOn: true },
      });

      if (!tip) {
        throw errors.styleTipNotFound();
      }

      if (tip.tryOn.userId !== userId) {
        throw errors.styleTipForbidden();
      }

      const deleted = await ctx.prisma.styleTip.delete({
        where: { id: input.id },
      });

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
        garmentColors: tryOnData.garment.colors,
        bodyProfileFitPreference: tryOnData.bodyProfile.fitPreference,
      });

      const tips = await ctx.prisma.styleTip.findMany({
        where: { tryOnId: input.tryOnId },
        orderBy: { createdAt: "asc" },
      });

      return tips;
    }),
} satisfies TRPCRouterRecord;
