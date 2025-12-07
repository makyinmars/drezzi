import { Resource } from "sst";
import Stripe from "stripe";

let stripe: Stripe | null = null;

function getStripeKey(): string {
  // Lambda context - use SST Resource API
  if (typeof Resource?.StripeSecretKey?.value === "string") {
    return Resource.StripeSecretKey.value;
  }
  // Web app context - use serverEnv (lazy import to avoid validation in Lambda)
  const { serverEnv } = require("@/env/server");
  return serverEnv.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (stripe) return stripe;
  stripe = new Stripe(getStripeKey());
  return stripe;
}
