import type { TRPCRouterRecord } from "@trpc/server";
import z from "zod/v4";

import { enqueueUpscaleJob } from "@/lib/upscale-sqs";

import { createErrors } from "../errors";
import { protectedProcedure } from "../init";

export const upscaleRouter = {
  upscaleProfile: protectedProcedure
    .input(z.object({ profileId: z.cuid() }))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.profileId, userId },
        include: { photo: true },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      if (profile.enhancementStatus === "PROCESSING") {
        throw errors.upscaleAlreadyProcessing();
      }

      await ctx.prisma.bodyProfile.update({
        where: { id: input.profileId },
        data: {
          enhancementStatus: "PROCESSING",
          enhancementError: null,
        },
      });

      await enqueueUpscaleJob({
        type: "profile",
        entityId: input.profileId,
        userId,
        sourceImageKey: profile.photo.key,
      });

      return { success: true, status: "PROCESSING" as const };
    }),

  upscaleGarment: protectedProcedure
    .input(z.object({ garmentId: z.cuid() }))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const garment = await ctx.prisma.garment.findFirst({
        where: { id: input.garmentId, userId },
        include: { image: true },
      });

      if (!garment) {
        throw errors.garmentNotFound();
      }

      await enqueueUpscaleJob({
        type: "garment",
        entityId: input.garmentId,
        userId,
        sourceImageKey: garment.image.key,
      });

      return { success: true };
    }),

  upscaleTryOn: protectedProcedure
    .input(z.object({ tryOnId: z.cuid() }))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const tryOn = await ctx.prisma.tryOn.findFirst({
        where: { id: input.tryOnId, userId, status: "completed" },
        include: { result: true },
      });

      if (!tryOn?.result) {
        throw errors.tryOnNotFound();
      }

      await enqueueUpscaleJob({
        type: "tryon",
        entityId: input.tryOnId,
        userId,
        sourceImageKey: tryOn.result.key,
      });

      return { success: true };
    }),

  getProfileEnhancementStatus: protectedProcedure
    .input(z.object({ profileId: z.cuid() }))
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const profile = await ctx.prisma.bodyProfile.findFirst({
        where: { id: input.profileId, userId },
        select: {
          enhancementStatus: true,
          enhancementError: true,
          enhancedPhoto: true,
        },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      return {
        status: profile.enhancementStatus,
        error: profile.enhancementError,
        hasEnhancedPhoto: !!profile.enhancedPhoto,
      };
    }),
} satisfies TRPCRouterRecord;
