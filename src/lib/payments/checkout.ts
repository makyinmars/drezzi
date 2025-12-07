import {
  CREDIT_PACKAGES,
  FREE_SIGNUP_CREDITS,
  type PackageId,
} from "@/services/credits/constants";
import type { PrismaClient } from "../../../generated/prisma/client";

import { getStripe } from "./stripe";

type CreateCheckoutParams = {
  prisma: PrismaClient;
  userId: string;
  userEmail: string;
  packageId: PackageId;
  successUrl: string;
  cancelUrl: string;
};

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const { prisma, userId, userEmail, packageId, successUrl, cancelUrl } =
    params;

  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) throw new Error(`Invalid package: ${packageId}`);

  const stripe = getStripe();

  const existingPayment = await prisma.payment.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true },
  });

  let customerId = existingPayment?.stripeCustomerId;

  if (!customerId) {
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${pkg.name} Credit Pack`,
            description: `${pkg.credits} credits for virtual try-ons`,
          },
          unit_amount: pkg.priceInCents,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      packageId,
      credits: String(pkg.credits),
    },
  });

  await prisma.payment.create({
    data: {
      userId,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: customerId,
      amount: pkg.priceInCents,
      currency: "usd",
      creditsGranted: pkg.credits,
      packageId: pkg.id,
      packageName: pkg.name,
      status: "PENDING",
    },
  });

  return {
    sessionUrl: session.url,
    sessionId: session.id,
  };
}

type SyncResult =
  | { alreadyProcessed: true; payment: null }
  | {
      alreadyProcessed: false;
      payment: { id: string; creditsGranted: number };
    };

export async function syncStripeSessionToDB(
  prisma: PrismaClient,
  sessionId: string
): Promise<SyncResult> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  if (session.payment_status !== "paid") {
    return { alreadyProcessed: true, payment: null };
  }

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const result = await prisma.payment.updateMany({
    where: {
      stripeCheckoutSessionId: sessionId,
      status: "PENDING",
    },
    data: {
      status: "SUCCEEDED",
      stripePaymentIntentId: paymentIntent,
    },
  });

  if (result.count === 0) {
    return { alreadyProcessed: true, payment: null };
  }

  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
  });

  if (!payment) {
    return { alreadyProcessed: true, payment: null };
  }

  let wallet = await prisma.creditWallet.findUnique({
    where: { userId: payment.userId },
  });

  if (!wallet) {
    wallet = await prisma.creditWallet.create({
      data: {
        userId: payment.userId,
        balance: FREE_SIGNUP_CREDITS,
        totalBonus: FREE_SIGNUP_CREDITS,
      },
    });

    await prisma.creditTransaction.create({
      data: {
        userId: payment.userId,
        walletId: wallet.id,
        type: "BONUS",
        amount: FREE_SIGNUP_CREDITS,
        balanceAfter: FREE_SIGNUP_CREDITS,
        description: "Welcome bonus credits",
      },
    });
  }

  const newBalance = wallet.balance + payment.creditsGranted;

  await prisma.creditWallet.update({
    where: { id: wallet.id },
    data: {
      balance: newBalance,
      totalPurchased: wallet.totalPurchased + payment.creditsGranted,
    },
  });

  await prisma.creditTransaction.create({
    data: {
      userId: payment.userId,
      walletId: wallet.id,
      type: "PURCHASE",
      amount: payment.creditsGranted,
      balanceAfter: newBalance,
      description: `${payment.packageName} credit pack`,
      paymentId: payment.id,
    },
  });

  return {
    alreadyProcessed: false,
    payment: { id: payment.id, creditsGranted: payment.creditsGranted },
  };
}
