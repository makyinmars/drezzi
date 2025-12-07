import type {
  CreditTransactionType,
  PrismaClient,
} from "../../../generated/prisma/client";

import { FREE_SIGNUP_CREDITS, TRY_ON_COST } from "./constants";

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export async function getOrCreateWallet(
  prisma: PrismaClient | TransactionClient,
  userId: string
) {
  const existing = await prisma.creditWallet.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  return await (prisma as PrismaClient).$transaction(
    async (tx: TransactionClient) => {
      const wallet = await tx.creditWallet.create({
        data: {
          userId,
          balance: FREE_SIGNUP_CREDITS,
          totalBonus: FREE_SIGNUP_CREDITS,
        },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: "BONUS",
          amount: FREE_SIGNUP_CREDITS,
          balanceAfter: FREE_SIGNUP_CREDITS,
          description: "Welcome bonus credits",
        },
      });

      return wallet;
    }
  );
}

export async function getBalance(prisma: PrismaClient, userId: string) {
  const wallet = await getOrCreateWallet(prisma, userId);
  return wallet.balance;
}

export async function hasCredits(
  prisma: PrismaClient,
  userId: string,
  amount = TRY_ON_COST
) {
  const balance = await getBalance(prisma, userId);
  return balance >= amount;
}

type AddCreditsParams = {
  type: CreditTransactionType;
  description: string;
  paymentId?: string;
};

export async function addCredits(
  prisma: PrismaClient | TransactionClient,
  userId: string,
  amount: number,
  params: AddCreditsParams
) {
  return await (prisma as PrismaClient).$transaction(
    async (tx: TransactionClient) => {
      const wallet = await getOrCreateWallet(tx, userId);

      const newBalance = wallet.balance + amount;
      const updateData: Record<string, number> = { balance: newBalance };

      if (params.type === "PURCHASE") {
        updateData.totalPurchased = wallet.totalPurchased + amount;
      } else if (params.type === "BONUS") {
        updateData.totalBonus = wallet.totalBonus + amount;
      }

      const updated = await tx.creditWallet.update({
        where: { id: wallet.id },
        data: updateData,
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: params.type,
          amount,
          balanceAfter: newBalance,
          description: params.description,
          paymentId: params.paymentId,
        },
      });

      return { wallet: updated, transaction };
    }
  );
}

type ChargeResult =
  | { alreadyCharged: true; transaction: { id: string }; newBalance: number }
  | { alreadyCharged: false; transaction: { id: string }; newBalance: number };

export async function chargeCreditsForTryOn(
  prisma: PrismaClient,
  userId: string,
  tryOnId: string,
  description = "Virtual try-on"
): Promise<ChargeResult> {
  return await prisma.$transaction(async (tx: TransactionClient) => {
    const existing = await tx.creditTransaction.findFirst({
      where: { tryOnId, type: "USAGE" },
    });

    if (existing) {
      const wallet = await tx.creditWallet.findUnique({ where: { userId } });
      return {
        alreadyCharged: true,
        transaction: { id: existing.id },
        newBalance: wallet?.balance ?? 0,
      };
    }

    const wallet = await getOrCreateWallet(tx, userId);

    if (wallet.balance < TRY_ON_COST) {
      throw new Error("Insufficient credits");
    }

    const newBalance = wallet.balance - TRY_ON_COST;

    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalUsed: wallet.totalUsed + TRY_ON_COST,
      },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: "USAGE",
        amount: -TRY_ON_COST,
        balanceAfter: newBalance,
        description,
        tryOnId,
      },
    });

    return {
      alreadyCharged: false,
      transaction: { id: transaction.id },
      newBalance,
    };
  });
}

export async function refundCreditsForTryOn(
  prisma: PrismaClient,
  userId: string,
  tryOnId: string,
  description = "Try-on refund"
) {
  return await prisma.$transaction(async (tx: TransactionClient) => {
    const existing = await tx.creditTransaction.findFirst({
      where: { tryOnId, type: "REFUND" },
    });

    if (existing) {
      return { alreadyRefunded: true, transaction: existing };
    }

    const wallet = await getOrCreateWallet(tx, userId);
    const newBalance = wallet.balance + TRY_ON_COST;

    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalUsed: Math.max(0, wallet.totalUsed - TRY_ON_COST),
      },
    });

    const transaction = await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: "REFUND",
        amount: TRY_ON_COST,
        balanceAfter: newBalance,
        description,
        tryOnId,
      },
    });

    return { alreadyRefunded: false, transaction };
  });
}
