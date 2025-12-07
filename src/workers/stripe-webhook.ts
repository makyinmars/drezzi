import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { Resource } from "sst";
import Stripe from "stripe";
import { syncStripeSessionToDB } from "@/lib/payments/checkout";
import { prisma } from "@/lib/prisma";

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
        const result = await syncStripeSessionToDB(prisma, session.id);
        console.log(
          `Checkout session ${session.id} synced:`,
          result.alreadyProcessed ? "already processed" : "newly processed"
        );
        break;
      }

      case "checkout.session.expired": {
        const session = webhookEvent.data.object as Stripe.Checkout.Session;
        const deleted = await prisma.payment.deleteMany({
          where: {
            stripeCheckoutSessionId: session.id,
            status: "PENDING",
          },
        });
        console.log(
          `Expired checkout session ${session.id}: deleted ${deleted.count} pending payments`
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = webhookEvent.data.object as Stripe.PaymentIntent;
        const updated = await prisma.payment.updateMany({
          where: { stripePaymentIntentId: intent.id },
          data: { status: "FAILED" },
        });
        console.log(
          `Payment intent ${intent.id} failed: updated ${updated.count} payments`
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
