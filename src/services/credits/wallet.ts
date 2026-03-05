import { eq } from "drizzle-orm";
import type { CreditTransactionType } from "@/db/enums";
import { creditTransaction, creditWallet } from "@/db/schema";
import type { Db, DbTx } from "@/lib/db";
import { createId } from "@/lib/id";
import { FREE_SIGNUP_CREDITS, TRY_ON_COST } from "./constants";

type DbClient = Db | DbTx;

async function withTransaction<T>(
  client: DbClient,
  fn: (tx: DbTx) => Promise<T>
): Promise<T> {
  if ("rollback" in client) {
    return await fn(client as DbTx);
  }
  return await (client as Db).transaction(fn);
}

export async function getOrCreateWallet(client: DbClient, userId: string) {
  const existing = await client.query.creditWallet.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
  });

  if (existing) return existing;

  const [createdWallet] = await client
    .insert(creditWallet)
    .values({
      id: createId(),
      userId,
      balance: FREE_SIGNUP_CREDITS,
      totalBonus: FREE_SIGNUP_CREDITS,
      updatedAt: new Date(),
    })
    .onConflictDoNothing({
      target: creditWallet.userId,
    })
    .returning();

  if (createdWallet) {
    await client.insert(creditTransaction).values({
      id: createId(),
      userId,
      walletId: createdWallet.id,
      type: "BONUS",
      amount: FREE_SIGNUP_CREDITS,
      balanceAfter: FREE_SIGNUP_CREDITS,
      description: "Welcome bonus credits",
    });
    return createdWallet;
  }

  const wallet = await client.query.creditWallet.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
  });

  if (!wallet) {
    throw new Error("Failed to initialize credit wallet");
  }

  return wallet;
}

export async function getBalance(client: Db, userId: string) {
  const wallet = await getOrCreateWallet(client, userId);
  return wallet.balance;
}

export async function hasCredits(
  client: Db,
  userId: string,
  amount = TRY_ON_COST
) {
  const balance = await getBalance(client, userId);
  return balance >= amount;
}

type AddCreditsParams = {
  type: CreditTransactionType;
  description: string;
  paymentId?: string;
};

export async function addCredits(
  client: DbClient,
  userId: string,
  amount: number,
  params: AddCreditsParams
) {
  return await withTransaction(client, async (tx) => {
    const wallet = await getOrCreateWallet(tx, userId);
    const newBalance = wallet.balance + amount;

    const updateData: Record<string, number | Date> = {
      balance: newBalance,
      updatedAt: new Date(),
    };

    if (params.type === "PURCHASE") {
      updateData.totalPurchased = wallet.totalPurchased + amount;
    } else if (params.type === "BONUS") {
      updateData.totalBonus = wallet.totalBonus + amount;
    }

    const [updatedWallet] = await tx
      .update(creditWallet)
      .set(updateData)
      .where(eq(creditWallet.id, wallet.id))
      .returning();

    const [transaction] = await tx
      .insert(creditTransaction)
      .values({
        id: createId(),
        userId,
        walletId: wallet.id,
        type: params.type,
        amount,
        balanceAfter: newBalance,
        description: params.description,
        paymentId: params.paymentId,
      })
      .returning();

    return { wallet: updatedWallet, transaction };
  });
}

type ChargeResult =
  | { alreadyCharged: true; transaction: { id: string }; newBalance: number }
  | { alreadyCharged: false; transaction: { id: string }; newBalance: number };

export async function chargeCreditsForTryOn(
  client: Db,
  userId: string,
  tryOnId: string,
  description = "Virtual try-on"
): Promise<ChargeResult> {
  return await client.transaction(async (tx) => {
    const existing = await tx.query.creditTransaction.findFirst({
      where: (t, { and: andOp, eq: eqOp }) =>
        andOp(eqOp(t.tryOnId, tryOnId), eqOp(t.type, "USAGE")),
      columns: { id: true },
    });

    if (existing) {
      const wallet = await tx.query.creditWallet.findFirst({
        where: (t, { eq: eqOp }) => eqOp(t.userId, userId),
      });

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

    await tx
      .update(creditWallet)
      .set({
        balance: newBalance,
        totalUsed: wallet.totalUsed + TRY_ON_COST,
        updatedAt: new Date(),
      })
      .where(eq(creditWallet.id, wallet.id));

    const [transaction] = await tx
      .insert(creditTransaction)
      .values({
        id: createId(),
        userId,
        walletId: wallet.id,
        type: "USAGE",
        amount: -TRY_ON_COST,
        balanceAfter: newBalance,
        description,
        tryOnId,
      })
      .returning();

    return {
      alreadyCharged: false,
      transaction: { id: transaction.id },
      newBalance,
    };
  });
}

export async function refundCreditsForTryOn(
  client: Db,
  userId: string,
  tryOnId: string,
  description = "Try-on refund"
) {
  return await client.transaction(async (tx) => {
    const existing = await tx.query.creditTransaction.findFirst({
      where: (t, { and: andOp, eq: eqOp }) =>
        andOp(eqOp(t.tryOnId, tryOnId), eqOp(t.type, "REFUND")),
    });

    if (existing) {
      return { alreadyRefunded: true, transaction: existing };
    }

    const wallet = await getOrCreateWallet(tx, userId);
    const newBalance = wallet.balance + TRY_ON_COST;

    await tx
      .update(creditWallet)
      .set({
        balance: newBalance,
        totalUsed: Math.max(0, wallet.totalUsed - TRY_ON_COST),
        updatedAt: new Date(),
      })
      .where(eq(creditWallet.id, wallet.id));

    const [transaction] = await tx
      .insert(creditTransaction)
      .values({
        id: createId(),
        userId,
        walletId: wallet.id,
        type: "REFUND",
        amount: TRY_ON_COST,
        balanceAfter: newBalance,
        description,
        tryOnId,
      })
      .returning();

    return { alreadyRefunded: false, transaction };
  });
}
