import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { and, eq } from "drizzle-orm";
import { Resource } from "sst";
import Stripe from "stripe";
import { payment } from "@/db/schema";
import { db } from "@/lib/db";
import { syncStripeSessionToDB } from "@/lib/payments/checkout";

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const stripe = new Stripe(Resource.StripeSecretKey.value);

  const sig = event.headers["stripe-signature"];
  const body = event.body ?? "";

  if (!sig) {
    console.error("Missing stripe-signature header");
    return { statusCode: 400, body: "Missing signature" };
  }

  let webhookEvent: Stripe.Event;

  try {
    webhookEvent = stripe.webhooks.constructEvent(
      body,
      sig,
      Resource.StripeWebhookSecret.value
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return { statusCode: 400, body: "Invalid signature" };
  }

  console.log(`Processing webhook event: ${webhookEvent.type}`);

  try {
    switch (webhookEvent.type) {
      case "checkout.session.completed": {
        const session = webhookEvent.data.object as Stripe.Checkout.Session;
        const result = await syncStripeSessionToDB(db, session.id);
        console.log(
          `Checkout session ${session.id} synced:`,
          result.alreadyProcessed ? "already processed" : "newly processed"
        );
        break;
      }

      case "checkout.session.expired": {
        const session = webhookEvent.data.object as Stripe.Checkout.Session;
        const deleted = await db
          .delete(payment)
          .where(
            and(
              eq(payment.stripeCheckoutSessionId, session.id),
              eq(payment.status, "PENDING")
            )
          )
          .returning({
            id: payment.id,
          });
        console.log(
          `Expired checkout session ${session.id}: deleted ${deleted.length} pending payments`
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = webhookEvent.data.object as Stripe.PaymentIntent;
        const updated = await db
          .update(payment)
          .set({
            status: "FAILED",
            updatedAt: new Date(),
          })
          .where(eq(payment.stripePaymentIntentId, intent.id))
          .returning({
            id: payment.id,
          });
        console.log(
          `Payment intent ${intent.id} failed: updated ${updated.length} payments`
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${webhookEvent.type}`);
    }
  } catch (err) {
    console.error(`Error processing ${webhookEvent.type}:`, err);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
