export const CREDIT_PACKAGES = {
  starter: { id: "starter", name: "Starter", credits: 8, priceInCents: 500 },
  basic: { id: "basic", name: "Basic", credits: 18, priceInCents: 1000 },
  pro: { id: "pro", name: "Pro", credits: 30, priceInCents: 1500 },
} as const;

export const TRY_ON_COST = 1;
export const FREE_SIGNUP_CREDITS = 3;

export type PackageId = keyof typeof CREDIT_PACKAGES;
export type CreditPackage = (typeof CREDIT_PACKAGES)[PackageId];
