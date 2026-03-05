import type { TRPCRouterRecord } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod/v4";
import { bodyProfile } from "@/db/schema";
import { enqueueUpscaleJob } from "@/lib/upscale-sqs";
import { createErrors } from "../errors";
import { protectedProcedure } from "../init";

export const upscaleRouter = {
  upscaleProfile: protectedProcedure
    .input(z.object({ profileId: z.cuid() }))
    .mutation(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const profile = await ctx.db.query.bodyProfile.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.profileId), eqOp(t.userId, userId)),
        with: { photo: true },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      if (profile.enhancementStatus === "PROCESSING") {
        throw errors.upscaleAlreadyProcessing();
      }

      await ctx.db
        .update(bodyProfile)
        .set({
          enhancementStatus: "PROCESSING",
          enhancementError: null,
          updatedAt: new Date(),
        })
        .where(eq(bodyProfile.id, input.profileId));

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

      const garment = await ctx.db.query.garment.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.garmentId), eqOp(t.userId, userId)),
        with: { image: true },
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

      const tryOnData = await ctx.db.query.tryOn.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(
            eqOp(t.id, input.tryOnId),
            eqOp(t.userId, userId),
            eqOp(t.status, "completed")
          ),
        with: { result: true },
      });

      if (!tryOnData?.result) {
        throw errors.tryOnNotFound();
      }

      await enqueueUpscaleJob({
        type: "tryon",
        entityId: input.tryOnId,
        userId,
        sourceImageKey: tryOnData.result.key,
      });

      return { success: true };
    }),

  getProfileEnhancementStatus: protectedProcedure
    .input(z.object({ profileId: z.cuid() }))
    .query(async ({ input, ctx }) => {
      const errors = createErrors(ctx.i18n);
      const userId = ctx.session.user.id;

      const profile = await ctx.db.query.bodyProfile.findFirst({
        where: (t, { and: andOp, eq: eqOp }) =>
          andOp(eqOp(t.id, input.profileId), eqOp(t.userId, userId)),
        columns: {
          enhancementStatus: true,
          enhancementError: true,
          enhancedPhotoId: true,
        },
      });

      if (!profile) {
        throw errors.profileNotFound();
      }

      return {
        status: profile.enhancementStatus,
        error: profile.enhancementError,
        hasEnhancedPhoto: !!profile.enhancedPhotoId,
      };
    }),
} satisfies TRPCRouterRecord;
