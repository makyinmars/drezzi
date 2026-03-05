import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { payment } from "@/db/schema";
import {
  createCheckoutSession,
  syncStripeSessionToDB,
} from "@/lib/payments/checkout";
import { CREDIT_PACKAGES } from "@/services/credits/constants";
import { getOrCreateWallet } from "@/services/credits/wallet";
import {
  apiHistoryFilters,
  apiPackageId,
  apiSessionId,
} from "@/validators/credits";
import { protectedProcedure } from "../init";

export const creditsRouter = {
  getPackages: protectedProcedure.query(() => {
    return Object.values(CREDIT_PACKAGES);
  }),

  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getOrCreateWallet(ctx.db, ctx.session.user.id);
    return {
      balance: wallet.balance,
      totalPurchased: wallet.totalPurchased,
      totalUsed: wallet.totalUsed,
      totalBonus: wallet.totalBonus,
    };
  }),

  getHistory: protectedProcedure
    .input(apiHistoryFilters)
    .query(async ({ ctx, input }) => {
      const wallet = await getOrCreateWallet(ctx.db, ctx.session.user.id);
      const cursor = input.cursor ?? undefined;

      const cursorRow = cursor
        ? await ctx.db.query.creditTransaction.findFirst({
            where: (t, { eq: eqOp }) => eqOp(t.id, cursor),
            columns: {
              id: true,
              createdAt: true,
            },
          })
        : undefined;

      const transactions = cursorRow
        ? await ctx.db.query.creditTransaction.findMany({
            where: (t, { and: andOp, eq: eqOp, lt: ltOp, or: orOp }) =>
              andOp(
                eqOp(t.walletId, wallet.id),
                orOp(
                  ltOp(t.createdAt, cursorRow.createdAt),
                  andOp(
                    eqOp(t.createdAt, cursorRow.createdAt),
                    ltOp(t.id, cursorRow.id)
                  )
                )
              ),
            orderBy: (t, { desc: descOp }) => [
              descOp(t.createdAt),
              descOp(t.id),
            ],
            limit: input.limit + 1,
            with: {
              payment: {
                columns: {
                  packageName: true,
                },
              },
              tryOn: {
                with: {
                  garment: {
                    columns: {
                      name: true,
                    },
                  },
                },
              },
            },
          })
        : await ctx.db.query.creditTransaction.findMany({
            where: (t, { eq: eqOp }) => eqOp(t.walletId, wallet.id),
            orderBy: (t, { desc: descOp }) => [
              descOp(t.createdAt),
              descOp(t.id),
            ],
            limit: input.limit + 1,
            with: {
              payment: {
                columns: {
                  packageName: true,
                },
              },
              tryOn: {
                with: {
                  garment: {
                    columns: {
                      name: true,
                    },
                  },
                },
              },
            },
          });

      const hasMore = transactions.length > input.limit;
      const items = hasMore ? transactions.slice(0, -1) : transactions;
      const nextCursor = hasMore ? items.at(-1)?.id : undefined;

      return {
        items: items.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          description: t.description,
          createdAt: t.createdAt,
          packageName: t.payment?.packageName,
          garmentName: t.tryOn?.garment?.name,
        })),
        nextCursor,
      };
    }),

  getPurchaseHistory: protectedProcedure
    .input(apiHistoryFilters)
    .query(async ({ ctx, input }) => {
      const cursor = input.cursor ?? undefined;

      const cursorRow = cursor
        ? await ctx.db.query.payment.findFirst({
            where: (t, { eq: eqOp }) => eqOp(t.id, cursor),
            columns: {
              id: true,
              createdAt: true,
            },
          })
        : undefined;

      const payments = cursorRow
        ? await ctx.db.query.payment.findMany({
            where: (t, { and: andOp, eq: eqOp, lt: ltOp, or: orOp }) =>
              andOp(
                eqOp(t.userId, ctx.session.user.id),
                orOp(
                  ltOp(t.createdAt, cursorRow.createdAt),
                  andOp(
                    eqOp(t.createdAt, cursorRow.createdAt),
                    ltOp(t.id, cursorRow.id)
                  )
                )
              ),
            orderBy: (t, { desc: descOp }) => [
              descOp(t.createdAt),
              descOp(t.id),
            ],
            limit: input.limit + 1,
          })
        : await ctx.db.query.payment.findMany({
            where: (t, { eq: eqOp }) => eqOp(t.userId, ctx.session.user.id),
            orderBy: (t, { desc: descOp }) => [
              descOp(t.createdAt),
              descOp(t.id),
            ],
            limit: input.limit + 1,
          });

      const hasMore = payments.length > input.limit;
      const items = hasMore ? payments.slice(0, -1) : payments;
      const nextCursor = hasMore ? items.at(-1)?.id : undefined;

      return {
        items: items.map((p) => ({
          id: p.id,
          packageName: p.packageName,
          amount: p.amount,
          currency: p.currency,
          creditsGranted: p.creditsGranted,
          status: p.status,
          createdAt: p.createdAt,
        })),
        nextCursor,
      };
    }),

  createCheckoutSession: protectedProcedure
    .input(apiPackageId)
    .mutation(async ({ ctx, input }) => {
      const pkg = CREDIT_PACKAGES[input.packageId];
      if (!pkg) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid credit package",
        });
      }

      const publicUrl = process.env.PUBLIC_URL ?? "http://localhost:3000";

      const result = await createCheckoutSession({
        db: ctx.db,
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        packageId: input.packageId,
        successUrl: `${publicUrl}/credits?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${publicUrl}/credits?purchase=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      });

      return {
        checkoutUrl: result.sessionUrl,
        sessionId: result.sessionId,
      };
    }),

  syncCheckoutSession: protectedProcedure
    .input(apiSessionId)
    .mutation(async ({ ctx, input }) => {
      const result = await syncStripeSessionToDB(ctx.db, input.sessionId);
      return {
        success: !result.alreadyProcessed,
        alreadyProcessed: result.alreadyProcessed,
        creditsGranted: result.payment?.creditsGranted,
      };
    }),

  cancelCheckout: protectedProcedure
    .input(apiSessionId)
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(payment)
        .where(
          and(
            eq(payment.userId, ctx.session.user.id),
            eq(payment.stripeCheckoutSessionId, input.sessionId),
            eq(payment.status, "PENDING")
          )
        )
        .returning({
          id: payment.id,
        });

      return { deleted: deleted.length > 0 };
    }),
} satisfies TRPCRouterRecord;
