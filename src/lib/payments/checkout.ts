import { and, eq } from "drizzle-orm";
import { payment } from "@/db/schema";
import type { Db } from "@/lib/db";
import { createId } from "@/lib/id";
import { CREDIT_PACKAGES, type PackageId } from "@/services/credits/constants";
import { addCredits } from "@/services/credits/wallet";
import { getStripe } from "./stripe";

type CreateCheckoutParams = {
  db: Db;
  userId: string;
  userEmail: string;
  packageId: PackageId;
  successUrl: string;
  cancelUrl: string;
};

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const {
    db: dbClient,
    userId,
    userEmail,
    packageId,
    successUrl,
    cancelUrl,
  } = params;

  const pkg = CREDIT_PACKAGES[packageId];
  if (!pkg) throw new Error(`Invalid package: ${packageId}`);

  const stripe = getStripe();

  const existingPayment = await dbClient.query.payment.findFirst({
    where: (t, { and: andOp, eq: eqOp, isNotNull: isNotNullOp }) =>
      andOp(eqOp(t.userId, userId), isNotNullOp(t.stripeCustomerId)),
    columns: {
      stripeCustomerId: true,
    },
  });

  let customerId = existingPayment?.stripeCustomerId ?? undefined;

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

  await dbClient.insert(payment).values({
    id: createId(),
    userId,
    stripeCheckoutSessionId: session.id,
    stripeCustomerId: customerId,
    amount: pkg.priceInCents,
    currency: "usd",
    creditsGranted: pkg.credits,
    packageId: pkg.id,
    packageName: pkg.name,
    status: "PENDING",
    updatedAt: new Date(),
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
  dbClient: Db,
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

  const updatedRows = await dbClient
    .update(payment)
    .set({
      status: "SUCCEEDED",
      stripePaymentIntentId: paymentIntent,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(payment.stripeCheckoutSessionId, sessionId),
        eq(payment.status, "PENDING")
      )
    )
    .returning({
      id: payment.id,
    });

  if (updatedRows.length === 0) {
    return { alreadyProcessed: true, payment: null };
  }

  const foundPayment = await dbClient.query.payment.findFirst({
    where: (t, { eq: eqOp }) => eqOp(t.stripeCheckoutSessionId, sessionId),
  });

  if (!foundPayment) {
    return { alreadyProcessed: true, payment: null };
  }

  await addCredits(dbClient, foundPayment.userId, foundPayment.creditsGranted, {
    type: "PURCHASE",
    description: `${foundPayment.packageName} credit pack`,
    paymentId: foundPayment.id,
  });

  return {
    alreadyProcessed: false,
    payment: {
      id: foundPayment.id,
      creditsGranted: foundPayment.creditsGranted,
    },
  };
}
