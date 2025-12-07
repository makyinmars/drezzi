I have all the necessary context from the provided files. Let me create the comprehensive implementation guide for the drezzi credits system. This is a documentation task, so I'll proceed directly with creating the markdown document.

<chatName="Drezzi Credits System Implementation Guide"/>

Based on the provided cima reference implementation and drezzi's existing architecture, I'll create a comprehensive implementation guide. Here's the complete documentation:

---

# Credits System Implementation Guide for Drezzi

## Executive Summary

This guide details the implementation of a credit-based payment system for Drezzi's virtual try-on feature. Users purchase credit packages via Stripe Checkout, and credits are consumed when performing AI-powered virtual try-on operations.

### Key Decisions

| Decision           | Choice                    | Rationale                                      |
| ------------------ | ------------------------- | ---------------------------------------------- |
| Payment Model      | One-time credit purchases | Simple, no subscription complexity             |
| Payment Provider   | Stripe Checkout           | Hosted UI, PCI compliance, fraud protection    |
| Idempotency        | Database status checks    | Prevents double-crediting on webhook/sync race |
| Transaction Safety | Prisma transactions       | Atomic wallet operations                       |
| Signup Incentive   | 3 free credits            | Encourages trial without payment friction      |

### Credit Package Pricing

| Package | Credits | Price | Cost/Credit | Savings |
| ------- | ------- | ----- | ----------- | ------- |
| Starter | 8       | $5    | $0.63       | —       |
| Basic   | 18      | $10   | $0.56       | 11%     |
| Pro     | 30      | $15   | $0.50       | 21%     |

### Credit Costs

| Operation             | Cost     |
| --------------------- | -------- |
| Virtual Try-On        | 1 credit |
| AI Upscale (optional) | 1 credit |

---

## Architecture Overview

### Purchase Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CREDIT PURCHASE FLOW                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  User    │───▶│ Credits Page │───▶│ Select Package  │───▶│ tRPC: create     │
│          │    │              │    │ (Starter/Basic/ │    │ CheckoutSession  │
└──────────┘    └──────────────┘    │  Pro)           │    └────────┬─────────┘
                                    └─────────────────┘             │
                                                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              STRIPE CHECKOUT                                  │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐  │
│  │ Create/Get      │───▶│ Create Checkout  │───▶│ Create PENDING payment  │  │
│  │ Stripe Customer │    │ Session          │    │ record in database      │  │
│  └─────────────────┘    └──────────────────┘    └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           STRIPE HOSTED CHECKOUT                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  User enters payment details on Stripe's secure hosted page             │ │
│  │  - Card number, expiry, CVC                                             │ │
│  │  - Stripe handles PCI compliance                                        │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
         ┌──────────────────┐            ┌──────────────────┐
         │ SUCCESS REDIRECT │            │ CANCEL REDIRECT  │
         │ /credits?purchase│            │ /credits?purchase│
         │ =success         │            │ =cancelled       │
         └────────┬─────────┘            └────────┬─────────┘
                  │                               │
                  ▼                               ▼
         ┌──────────────────┐            ┌──────────────────┐
         │ tRPC: syncCheck- │            │ tRPC: cancel     │
         │ outSession       │            │ Checkout         │
         │ (polls Stripe)   │            │ (delete PENDING) │
         └────────┬─────────┘            └──────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           CREDIT FULFILLMENT                                  │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐  │
│  │ Atomic update:  │───▶│ If updated:      │───▶│ Add credits to wallet   │  │
│  │ PENDING →       │    │ grant credits    │    │ Record transaction      │  │
│  │ SUCCEEDED       │    │ (exactly once)   │    │                         │  │
│  └─────────────────┘    └──────────────────┘    └─────────────────────────┘  │
│                                                                               │
│  NOTE: Both syncCheckoutSession (from redirect) AND webhook may fire.        │
│  The atomic PENDING→SUCCEEDED update ensures credits granted exactly once.   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Try-On Credit Usage Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TRY-ON CREDIT USAGE FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  User    │───▶│ Try-On Page  │───▶│ Select Garment  │───▶│ tRPC: startTryOn │
│          │    │              │    │ & Body Profile  │    │                  │
└──────────┘    └──────────────┘    └─────────────────┘    └────────┬─────────┘
                                                                    │
                                                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            PRE-FLIGHT CHECK                                   │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  hasCredits(userId, TRY_ON_COST)                                        │ │
│  │  - If insufficient: return error immediately                            │ │
│  │  - If sufficient: proceed to queue                                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              SQS QUEUE                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  TryOn record created with status: "pending"                            │ │
│  │  Message sent to TryOnQueue                                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           TRY-ON WORKER                                       │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐  │
│  │ Process try-on  │───▶│ AI generates     │───▶│ On SUCCESS:             │  │
│  │ request         │    │ result image     │    │ chargeCreditsForTryOn   │  │
│  └─────────────────┘    └──────────────────┘    │ (idempotent)            │  │
│                                                  └─────────────────────────┘  │
│                                    │                                          │
│                                    ▼                                          │
│                         ┌──────────────────┐                                  │
│                         │ On FAILURE:      │                                  │
│                         │ No charge        │                                  │
│                         │ (user retries)   │                                  │
│                         └──────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           WEBSOCKET NOTIFICATION                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  Notify user via WebSocket:                                             │ │
│  │  - Try-on complete (with result URL)                                    │ │
│  │  - Credit balance updated                                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Prisma)

Add the following to `prisma/schema.prisma`:

```prisma
// ============================================================================
// CREDITS SYSTEM
// ============================================================================

enum CreditTransactionType {
  PURCHASE
  USAGE
  REFUND
  BONUS
  ADMIN

  @@map("credit_transaction_type")
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED

  @@map("payment_status")
}

model CreditWallet {
  id             String   @id @default(cuid())
  userId         String   @unique @map("user_id")
  balance        Int      @default(0)
  totalPurchased Int      @default(0) @map("total_purchased")
  totalUsed      Int      @default(0) @map("total_used")
  totalBonus     Int      @default(0) @map("total_bonus")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions CreditTransaction[]

  @@index([userId])
  @@index([balance])
  @@map("credit_wallet")
}

model Payment {
  id                      String        @id @default(cuid())
  userId                  String        @map("user_id")
  stripeCheckoutSessionId String?       @unique @map("stripe_checkout_session_id")
  stripePaymentIntentId   String?       @map("stripe_payment_intent_id")
  stripeCustomerId        String?       @map("stripe_customer_id")
  amount                  Int           // Amount in cents
  currency                String        @default("usd")
  creditsGranted          Int           @map("credits_granted")
  packageId               String        @map("package_id")
  packageName             String        @map("package_name")
  status                  PaymentStatus @default(PENDING)
  metadata                Json?
  createdAt               DateTime      @default(now()) @map("created_at")
  updatedAt               DateTime      @updatedAt @map("updated_at")

  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions CreditTransaction[]

  @@index([userId])
  @@index([stripeCheckoutSessionId])
  @@index([status])
  @@index([createdAt])
  @@map("payment")
}

model CreditTransaction {
  id           String                @id @default(cuid())
  userId       String                @map("user_id")
  walletId     String                @map("wallet_id")
  type         CreditTransactionType
  amount       Int                   // Positive for credit, negative for debit
  balanceAfter Int                   @map("balance_after")
  description  String?
  paymentId    String?               @map("payment_id")
  tryOnId      String?               @map("try_on_id")
  createdAt    DateTime              @default(now()) @map("created_at")

  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  wallet  CreditWallet  @relation(fields: [walletId], references: [id], onDelete: Cascade)
  payment Payment?      @relation(fields: [paymentId], references: [id])
  tryOn   TryOn?        @relation(fields: [tryOnId], references: [id])

  @@unique([tryOnId, type], name: "uq_credit_transaction_tryon_type")
  @@index([userId])
  @@index([walletId])
  @@index([createdAt])
  @@index([type])
  @@map("credit_transaction")
}
```

### Update User Model

Add relations to the existing `User` model:

```prisma
model User {
  // ... existing fields ...

  // Add these relations
  creditWallet       CreditWallet?
  payments           Payment[]
  creditTransactions CreditTransaction[]

  // ... existing relations ...
}
```

### Update TryOn Model

Add relation to the existing `TryOn` model:

```prisma
model TryOn {
  // ... existing fields ...

  // Add this relation
  creditTransactions CreditTransaction[]

  // ... existing relations ...
}
```

---

## SST Infrastructure Updates

Update `sst.config.ts` to add Stripe secrets and webhook handler:

```typescript
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "drezzi",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-east-2",
          profile:
            input.stage === "production"
              ? "developer-production"
              : "developer-dev",
        },
      },
      cloudflare: "6.2.0",
    };
  },
  async run() {
    // ==========================================
    // SECRETS - Stripe Configuration
    // ==========================================
    const stripeSecretKey = new sst.Secret("StripeSecretKey");
    const stripeWebhookSecret = new sst.Secret("StripeWebhookSecret");

    // ... existing email, domain, bucket, websocket, queue setup ...

    // ==========================================
    // STRIPE WEBHOOK - Credit Purchase Handler
    // ==========================================
    const stripeWebhook = new sst.aws.Function("StripeWebhook", {
      handler: "src/workers/stripe-webhook.handler",
      runtime: "nodejs20.x",
      timeout: "30 seconds",
      memory: "512 MB",
      link: [stripeSecretKey, stripeWebhookSecret],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
      },
      url: true, // Creates a function URL for the webhook
    });

    // ==========================================
    // TRY-ON WORKER - Updated with Credit Service
    // ==========================================
    const tryOnWorker = new sst.aws.Function("TryOnWorker", {
      handler: "src/workers/try-on.handler",
      runtime: "nodejs20.x",
      timeout: "5 minutes",
      memory: "1024 MB",
      link: [bucket, connectionsTable],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        WEBSOCKET_API_ENDPOINT: websocket.managementEndpoint,
        GOOGLE_GENERATIVE_AI_API_KEY:
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY as string,
      },
      permissions: [
        {
          actions: ["s3:GetObject", "s3:PutObject"],
          resources: [bucket.arn, $interpolate`${bucket.arn}/*`],
        },
        {
          actions: [
            "sqs:ReceiveMessage",
            "sqs:DeleteMessage",
            "sqs:ChangeMessageVisibility",
            "sqs:GetQueueAttributes",
          ],
          resources: [queue.arn],
        },
        {
          actions: ["execute-api:ManageConnections"],
          resources: [$interpolate`${websocket.nodes.api.executionArn}/*`],
        },
      ],
    });

    // ... rest of existing configuration ...

    const web = new sst.aws.TanStackStart("MyWeb", {
      link: [bucket, queue, upscaleQueue, email, stripeSecretKey], // Add stripeSecretKey
      environment: {
        // ... existing env vars ...
        STRIPE_SECRET_KEY: stripeSecretKey.value, // Add for server-side Stripe
      },
      // ... domain config ...
    });

    return {
      // ... existing outputs ...
      stripeWebhook: stripeWebhook.url, // Add webhook URL for Stripe Dashboard
    };
  },
});
```

### Set Secrets

After deployment, set the secrets:

```bash
# Development
bunx sst secret set StripeSecretKey sk_test_xxx --stage franklin
bunx sst secret set StripeWebhookSecret whsec_xxx --stage franklin

# Production
bunx sst secret set StripeSecretKey sk_live_xxx --stage production
bunx sst secret set StripeWebhookSecret whsec_xxx --stage production
```

---

## Service Layer

### Constants (`src/services/credits/constants.ts`)

```typescript
/**
 * Credit package definitions
 * Cost per credit decreases with larger packages
 */
export const CREDIT_PACKAGES = {
  starter: {
    id: "starter",
    name: "Starter",
    credits: 8,
    priceInCents: 500,
    priceDisplay: "$5",
    costPerCredit: 0.63,
    savings: 0,
    description: "Perfect for trying out virtual try-on",
  },
  basic: {
    id: "basic",
    name: "Basic",
    credits: 18,
    priceInCents: 1000,
    priceDisplay: "$10",
    costPerCredit: 0.56,
    savings: 11,
    description: "Best value for regular use",
    popular: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    credits: 30,
    priceInCents: 1500,
    priceDisplay: "$15",
    costPerCredit: 0.5,
    savings: 21,
    description: "Maximum savings for fashion enthusiasts",
  },
} as const;

export type PackageId = keyof typeof CREDIT_PACKAGES;
export type CreditPackage = (typeof CREDIT_PACKAGES)[PackageId];

/**
 * Cost per virtual try-on operation in credits
 */
export const TRY_ON_COST = 1;

/**
 * Cost per AI upscale operation (optional)
 */
export const UPSCALE_COST = 1;

/**
 * Free credits granted on signup
 */
export const FREE_SIGNUP_CREDITS = 3;

/**
 * Minimum credit balance required to start try-on
 */
export const MIN_CREDITS_FOR_TRY_ON = TRY_ON_COST;
```

### Wallet Service (`src/services/credits/wallet.ts`)

```typescript
import {
  CreditTransactionType,
  PaymentStatus,
  PrismaClient,
} from "@prisma/client";
import { FREE_SIGNUP_CREDITS, TRY_ON_COST } from "./constants";

// Re-export types for convenience
export type { CreditWallet } from "@prisma/client";

/**
 * Get or create a credit wallet for a user
 * Creates wallet with signup bonus if it doesn't exist
 */
export const getOrCreateWallet = async (
  prisma: PrismaClient,
  userId: string,
) => {
  // Try to get existing wallet
  const existing = await prisma.creditWallet.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  // Create new wallet with signup bonus in a transaction
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.creditWallet.create({
      data: {
        userId,
        balance: FREE_SIGNUP_CREDITS,
        totalBonus: FREE_SIGNUP_CREDITS,
      },
    });

    // Record the signup bonus transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: CreditTransactionType.BONUS,
        amount: FREE_SIGNUP_CREDITS,
        balanceAfter: FREE_SIGNUP_CREDITS,
        description: "Welcome bonus - 3 free virtual try-ons",
      },
    });

    return wallet;
  });
};

/**
 * Get current credit balance for a user
 */
export const getBalance = async (
  prisma: PrismaClient,
  userId: string,
): Promise<number> => {
  const wallet = await getOrCreateWallet(prisma, userId);
  return wallet.balance;
};

/**
 * Check if user has enough credits for an operation
 */
export const hasCredits = async (
  prisma: PrismaClient,
  userId: string,
  amount: number = TRY_ON_COST,
): Promise<boolean> => {
  const balance = await getBalance(prisma, userId);
  return balance >= amount;
};

/**
 * Deduct credits from user's wallet
 * Returns the new balance or throws if insufficient credits
 */
export const deductCredits = async (
  prisma: PrismaClient,
  userId: string,
  amount: number,
  description: string,
  tryOnId?: string,
): Promise<{ success: true; newBalance: number }> => {
  return prisma.$transaction(async (tx) => {
    // Get wallet with row-level lock (Prisma handles this in transaction)
    const wallet = await tx.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Credit wallet not found");
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient credits");
    }

    const newBalance = wallet.balance - amount;

    // Update wallet
    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalUsed: { increment: amount },
      },
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: CreditTransactionType.USAGE,
        amount: -amount, // Negative for debit
        balanceAfter: newBalance,
        description,
        tryOnId,
      },
    });

    return { success: true as const, newBalance };
  });
};

/**
 * Deduct credits for a specific try-on exactly once.
 * Idempotent: if a USAGE transaction already exists for tryOnId, no new debit.
 */
export const chargeCreditsForTryOn = async (
  prisma: PrismaClient,
  userId: string,
  amount: number,
  description: string,
  tryOnId: string,
): Promise<{ success: true; alreadyCharged: boolean; newBalance: number }> => {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Credit wallet not found");
    }

    // Check for existing usage transaction (idempotency)
    const existingUsage = await tx.creditTransaction.findFirst({
      where: {
        userId,
        tryOnId,
        type: CreditTransactionType.USAGE,
      },
    });

    if (existingUsage) {
      return {
        success: true as const,
        alreadyCharged: true,
        newBalance: wallet.balance,
      };
    }

    if (wallet.balance < amount) {
      throw new Error("Insufficient credits");
    }

    const newBalance = wallet.balance - amount;

    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalUsed: { increment: amount },
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: CreditTransactionType.USAGE,
        amount: -amount,
        balanceAfter: newBalance,
        description,
        tryOnId,
      },
    });

    return { success: true as const, alreadyCharged: false, newBalance };
  });
};

/**
 * Refund credits for a specific try-on if we previously charged it.
 * Idempotent: if a REFUND transaction already exists for tryOnId, no new credit.
 */
export const refundCreditsForTryOn = async (
  prisma: PrismaClient,
  userId: string,
  amount: number,
  description: string,
  tryOnId: string,
): Promise<{ success: true; alreadyRefunded: boolean; newBalance: number }> => {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error("Credit wallet not found");
    }

    // Check for existing refund (idempotency)
    const existingRefund = await tx.creditTransaction.findFirst({
      where: {
        userId,
        tryOnId,
        type: CreditTransactionType.REFUND,
      },
    });

    if (existingRefund) {
      return {
        success: true as const,
        alreadyRefunded: true,
        newBalance: wallet.balance,
      };
    }

    const newBalance = wallet.balance + amount;

    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalUsed: { decrement: amount },
      },
    });

    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: CreditTransactionType.REFUND,
        amount, // Positive for refund
        balanceAfter: newBalance,
        description,
        tryOnId,
      },
    });

    return { success: true as const, alreadyRefunded: false, newBalance };
  });
};

/**
 * Add credits to user's wallet (used after successful payment)
 */
export const addCredits = async (
  prisma: PrismaClient,
  userId: string,
  amount: number,
  type: CreditTransactionType,
  description: string,
  paymentId?: string,
): Promise<{ success: true; newBalance: number }> => {
  return prisma.$transaction(async (tx) => {
    // Get or create wallet
    let wallet = await tx.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.creditWallet.create({
        data: { userId, balance: 0 },
      });
    }

    const newBalance = wallet.balance + amount;

    // Update wallet based on transaction type
    const updateData: Record<string, unknown> = { balance: newBalance };

    if (type === CreditTransactionType.PURCHASE) {
      updateData.totalPurchased = { increment: amount };
    } else if (type === CreditTransactionType.BONUS) {
      updateData.totalBonus = { increment: amount };
    }

    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: updateData,
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type,
        amount, // Positive for credit
        balanceAfter: newBalance,
        description,
        paymentId,
      },
    });

    return { success: true as const, newBalance };
  });
};

/**
 * Grant signup bonus to a new user
 * Called from auth hook on user creation
 */
export const grantSignupBonus = async (
  prisma: PrismaClient,
  userId: string,
): Promise<void> => {
  await getOrCreateWallet(prisma, userId);
};
```

---

## Stripe Integration

### Stripe Client (`src/lib/payments/stripe.ts`)

```typescript
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Get Stripe client instance (singleton pattern)
 */
export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-11-17.clover",
      typescript: true,
    });
  }
  return stripeInstance;
};
```

### Checkout Service (`src/lib/payments/checkout.ts`)

```typescript
import {
  PaymentStatus,
  PrismaClient,
  CreditTransactionType,
} from "@prisma/client";
import { CREDIT_PACKAGES, type PackageId } from "@/services/credits/constants";
import { addCredits } from "@/services/credits/wallet";
import { getStripe } from "./stripe";

const PACKAGE_IMAGES: Record<PackageId, string> = {
  starter: "https://your-cdn.com/images/starter-pack.png",
  basic: "https://your-cdn.com/images/basic-pack.png",
  pro: "https://your-cdn.com/images/pro-pack.png",
};

type CreateCheckoutParams = {
  prisma: PrismaClient;
  userId: string;
  userEmail: string;
  packageId: PackageId;
  successUrl: string;
  cancelUrl: string;
};

type CheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
};

/**
 * Get or create Stripe customer for a user
 */
const getOrCreateStripeCustomer = async (
  userId: string,
  email: string,
): Promise<string> => {
  const stripe = getStripe();

  // Search for existing customer
  const existingCustomers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  return customer.id;
};

/**
 * Create a Stripe Checkout session for credit purchase
 */
export const createCheckoutSession = async ({
  prisma,
  userId,
  userEmail,
  packageId,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams): Promise<CheckoutResult> => {
  const pkg = CREDIT_PACKAGES[packageId];
  const stripe = getStripe();

  const customerId = await getOrCreateStripeCustomer(userId, userEmail);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pkg.priceInCents,
          product_data: {
            name: `${pkg.name} Credit Pack`,
            description: `${pkg.credits} virtual try-on credits for Drezzi`,
            images: [PACKAGE_IMAGES[packageId]],
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageId,
      credits: pkg.credits.toString(),
      packageName: pkg.name,
    },
    success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${cancelUrl}&session_id={CHECKOUT_SESSION_ID}`,
    allow_promotion_codes: false,
  });

  // Create pending payment record
  await prisma.payment.create({
    data: {
      userId,
      stripeCheckoutSessionId: session.id,
      stripeCustomerId: customerId,
      amount: pkg.priceInCents,
      creditsGranted: pkg.credits,
      packageId,
      packageName: pkg.name,
      status: PaymentStatus.PENDING,
    },
  });

  if (!session.url) {
    throw new Error("Stripe checkout session URL is missing");
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

/**
 * Sync Stripe checkout session data to database
 * Called from both /success route and webhook for reliability
 */
export const syncStripeSessionToDB = async (
  prisma: PrismaClient,
  sessionId: string,
): Promise<{ success: boolean; alreadyProcessed: boolean }> => {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });

  if (session.status !== "complete" || session.payment_status !== "paid") {
    return { success: false, alreadyProcessed: false };
  }

  const userId = session.metadata?.userId;
  const credits = Number.parseInt(session.metadata?.credits ?? "0", 10);
  const packageName = session.metadata?.packageName ?? "Credit Pack";

  if (!(userId && credits)) {
    console.error("[Stripe Sync] Missing userId or credits in metadata");
    return { success: false, alreadyProcessed: false };
  }

  // Atomic update with Prisma transaction
  return prisma.$transaction(async (tx) => {
    // Find and update payment atomically
    const existingPayment = await tx.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });

    if (!existingPayment || existingPayment.status !== PaymentStatus.PENDING) {
      return { success: true, alreadyProcessed: true };
    }

    const updatedPayment = await tx.payment.update({
      where: {
        id: existingPayment.id,
        status: PaymentStatus.PENDING, // Optimistic lock
      },
      data: {
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
      },
    });

    // Get or create wallet
    let wallet = await tx.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.creditWallet.create({
        data: { userId, balance: 0 },
      });
    }

    const newBalance = wallet.balance + credits;

    // Update wallet
    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalPurchased: { increment: credits },
      },
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: CreditTransactionType.PURCHASE,
        amount: credits,
        balanceAfter: newBalance,
        description: `Purchased ${packageName} (${credits} credits)`,
        paymentId: updatedPayment.id,
      },
    });

    return { success: true, alreadyProcessed: false };
  });
};
```

---

## Webhook Handler

Create `src/workers/stripe-webhook.ts`:

```typescript
import type { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  PrismaClient,
  PaymentStatus,
  CreditTransactionType,
} from "@prisma/client";
import { Resource } from "sst";
import Stripe from "stripe";

const prisma = new PrismaClient();

const ALLOWED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.payment_failed",
] as const;

type AllowedEvent = (typeof ALLOWED_EVENTS)[number];

const isAllowedEvent = (type: string): type is AllowedEvent => {
  return ALLOWED_EVENTS.includes(type as AllowedEvent);
};

/**
 * Process a completed checkout session
 */
const handleCheckoutCompleted = async (
  session: Stripe.Checkout.Session,
): Promise<void> => {
  const sessionId = session.id;
  const userId = session.metadata?.userId;
  const credits = Number.parseInt(session.metadata?.credits ?? "0", 10);
  const packageName = session.metadata?.packageName ?? "Credit Pack";

  if (!(userId && credits)) {
    console.error(`[Webhook] Missing metadata in session ${sessionId}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Find pending payment
    const existingPayment = await tx.payment.findUnique({
      where: { stripeCheckoutSessionId: sessionId },
    });

    if (!existingPayment || existingPayment.status !== PaymentStatus.PENDING) {
      console.log(`[Webhook] Session ${sessionId} already processed`);
      return;
    }

    // Update payment status
    const updatedPayment = await tx.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined,
      },
    });

    // Get or create wallet
    let wallet = await tx.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.creditWallet.create({
        data: { userId, balance: 0 },
      });
    }

    const newBalance = wallet.balance + credits;

    // Update wallet
    await tx.creditWallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalPurchased: { increment: credits },
      },
    });

    // Record transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: CreditTransactionType.PURCHASE,
        amount: credits,
        balanceAfter: newBalance,
        description: `Purchased ${packageName} (${credits} credits)`,
        paymentId: updatedPayment.id,
      },
    });

    console.log(`[Webhook] Granted ${credits} credits to user ${userId}`);
  });
};

/**
 * Handle expired checkout session
 */
const handleCheckoutExpired = async (
  session: Stripe.Checkout.Session,
): Promise<void> => {
  await prisma.payment.deleteMany({
    where: {
      stripeCheckoutSessionId: session.id,
      status: PaymentStatus.PENDING,
    },
  });
  console.log(`[Webhook] Deleted expired session ${session.id}`);
};

/**
 * Handle failed payment intent
 */
const handlePaymentFailed = async (
  paymentIntent: Stripe.PaymentIntent,
): Promise<void> => {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: PaymentStatus.FAILED },
  });
  console.log(`[Webhook] Marked payment as failed`);
};

/**
 * Main webhook handler
 */
export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const stripe = new Stripe(Resource.StripeSecretKey.value, {
    apiVersion: "2025-11-17.clover",
  });

  const signature = event.headers["stripe-signature"];

  if (!signature || !event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing signature or body" }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      Resource.StripeWebhookSecret.value,
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid signature" }),
    };
  }

  console.log(`[Webhook] Received: ${stripeEvent.type}`);

  if (!isAllowedEvent(stripeEvent.type)) {
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, ignored: true }),
    };
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          stripeEvent.data.object as Stripe.Checkout.Session,
        );
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(
          stripeEvent.data.object as Stripe.Checkout.Session,
        );
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(
          stripeEvent.data.object as Stripe.PaymentIntent,
        );
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true }),
    };
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, error: "Processing error" }),
    };
  }
};
```

---

## tRPC Router

Create `src/trpc/routers/credits.ts`:

```typescript
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import {
  createCheckoutSession,
  syncStripeSessionToDB,
} from "@/lib/payments/checkout";
import { CREDIT_PACKAGES, type PackageId } from "@/services/credits/constants";
import { getOrCreateWallet } from "@/services/credits/wallet";
import { protectedProcedure } from "../init";

// Validation schemas
const createCheckoutInput = z.object({
  packageId: z.enum(["starter", "basic", "pro"]),
});

const creditHistoryInput = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const creditsRouter = {
  /**
   * Get current credit balance and wallet stats
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await getOrCreateWallet(ctx.prisma, ctx.session.user.id);

    return {
      balance: wallet.balance,
      totalPurchased: wallet.totalPurchased,
      totalUsed: wallet.totalUsed,
      totalBonus: wallet.totalBonus,
    };
  }),

  /**
   * Get credit transaction history with pagination
   */
  getHistory: protectedProcedure
    .input(creditHistoryInput)
    .query(async ({ ctx, input }) => {
      const wallet = await getOrCreateWallet(ctx.prisma, ctx.session.user.id);

      const [transactions, total] = await Promise.all([
        ctx.prisma.creditTransaction.findMany({
          where: { walletId: wallet.id },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
          include: {
            tryOn: {
              select: { id: true },
            },
          },
        }),
        ctx.prisma.creditTransaction.count({
          where: { walletId: wallet.id },
        }),
      ]);

      return {
        items: transactions,
        total,
        hasMore: input.offset + transactions.length < total,
      };
    }),

  /**
   * Get payment/purchase history with pagination
   */
  getPurchaseHistory: protectedProcedure
    .input(creditHistoryInput)
    .query(async ({ ctx, input }) => {
      const [payments, total] = await Promise.all([
        ctx.prisma.payment.findMany({
          where: { userId: ctx.session.user.id },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.payment.count({
          where: { userId: ctx.session.user.id },
        }),
      ]);

      return {
        items: payments.map((p) => ({
          id: p.id,
          packageName: p.packageName,
          creditsGranted: p.creditsGranted,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
        })),
        total,
        hasMore: input.offset + payments.length < total,
      };
    }),

  /**
   * Get available credit packages
   */
  getPackages: protectedProcedure.query(async () => {
    return Object.values(CREDIT_PACKAGES).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      priceInCents: pkg.priceInCents,
      priceDisplay: pkg.priceDisplay,
      costPerCredit: pkg.costPerCredit,
      savings: pkg.savings,
      description: pkg.description,
      popular: "popular" in pkg ? pkg.popular : false,
    }));
  }),

  /**
   * Create Stripe checkout session for credit purchase
   */
  createCheckoutSession: protectedProcedure
    .input(createCheckoutInput)
    .mutation(async ({ ctx, input }) => {
      const publicUrl = process.env.VITE_PUBLIC_URL || "http://localhost:3000";

      const result = await createCheckoutSession({
        prisma: ctx.prisma,
        userId: ctx.session.user.id,
        userEmail: ctx.session.user.email,
        packageId: input.packageId as PackageId,
        successUrl: `${publicUrl}/credits?purchase=success`,
        cancelUrl: `${publicUrl}/credits?purchase=cancelled`,
      });

      return result;
    }),

  /**
   * Sync checkout session after successful payment
   */
  syncCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return syncStripeSessionToDB(ctx.prisma, input.sessionId);
    }),

  /**
   * Cancel checkout and delete pending payment record
   */
  cancelCheckout: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.payment.deleteMany({
        where: {
          stripeCheckoutSessionId: input.sessionId,
          status: "PENDING",
        },
      });
      return { success: true };
    }),
} satisfies TRPCRouterRecord;
```

### Register Router

Update `src/trpc/router.ts`:

```typescript
import { createTRPCRouter } from "./init";
import { authRouter } from "./routers/auth";
import { creditsRouter } from "./routers/credits"; // Add this
// ... other imports

export const trpcRouter = createTRPCRouter({
  auth: authRouter,
  credits: creditsRouter, // Add this
  // ... other routers
});
```

---

## TryOn Worker Integration

Update the existing `src/workers/try-on.ts` to integrate credit checking and charging:

```typescript
import { PrismaClient } from "@prisma/client";
import {
  chargeCreditsForTryOn,
  hasCredits,
  refundCreditsForTryOn,
} from "@/services/credits/wallet";
import { TRY_ON_COST } from "@/services/credits/constants";

const prisma = new PrismaClient();

// In the handler function, add credit check before processing:
export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    const { tryOnId, userId } = JSON.parse(record.body);

    try {
      // 1. Verify credits before processing
      const hasEnough = await hasCredits(prisma, userId, TRY_ON_COST);
      if (!hasEnough) {
        await prisma.tryOn.update({
          where: { id: tryOnId },
          data: {
            status: "failed",
            errorMessage: "Insufficient credits",
          },
        });
        // Notify via WebSocket
        await notifyUser(userId, {
          type: "try_on_failed",
          tryOnId,
          reason: "insufficient_credits",
        });
        continue;
      }

      // 2. Process the try-on (existing logic)
      const result = await processTryOn(tryOnId);

      // 3. Charge credits on success (idempotent)
      if (result.success) {
        await chargeCreditsForTryOn(
          prisma,
          userId,
          TRY_ON_COST,
          `Virtual try-on #${tryOnId.slice(0, 8)}`,
          tryOnId,
        );

        // Notify success with new balance
        const wallet = await prisma.creditWallet.findUnique({
          where: { userId },
        });

        await notifyUser(userId, {
          type: "try_on_complete",
          tryOnId,
          resultUrl: result.resultUrl,
          newBalance: wallet?.balance ?? 0,
        });
      }
    } catch (error) {
      console.error(`[TryOnWorker] Error processing ${tryOnId}:`, error);

      // Update try-on status
      await prisma.tryOn.update({
        where: { id: tryOnId },
        data: {
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      // Note: No charge on failure - user can retry
    }
  }
};
```

---

## Signup Bonus Integration

Integrate with Better Auth user creation hook. Update your auth configuration:

```typescript
// src/auth/index.ts
import { grantSignupBonus } from "@/services/credits/wallet";

export const auth = betterAuth({
  // ... existing config

  hooks: {
    after: {
      signUp: async ({ user }) => {
        // Grant signup bonus when user is created
        await grantSignupBonus(prisma, user.id);
      },
    },
  },
});
```

---

## Frontend Components Reference

The frontend implementation requires:

### Credits Page (`src/routes/(authed)/credits/index.tsx`)

```typescript
// Key sections:
// 1. Balance display with total stats
// 2. Package selection grid
// 3. Transaction history table
// 4. Purchase history table

// Use tRPC hooks:
const { data: balance } = trpc.credits.getBalance.useQuery();
const { data: packages } = trpc.credits.getPackages.useQuery();
const { data: history } = trpc.credits.getHistory.useQuery({ limit: 20 });

const createCheckout = trpc.credits.createCheckoutSession.useMutation({
  onSuccess: (data) => {
    window.location.href = data.checkoutUrl;
  },
});
```

### Credit Balance Component

```typescript
// Display current balance in navbar/header
const CreditBalance = () => {
  const { data } = trpc.credits.getBalance.useQuery();
  return (
    <div className="flex items-center gap-2">
      <CoinsIcon className="h-4 w-4" />
      <span>{data?.balance ?? 0}</span>
    </div>
  );
};
```

### Try-On Page Integration

```typescript
// Check credits before allowing try-on
const { data: balance } = trpc.credits.getBalance.useQuery();
const hasEnoughCredits = (balance?.balance ?? 0) >= TRY_ON_COST;

<Button
  disabled={!hasEnoughCredits}
  onClick={startTryOn}
>
  {hasEnoughCredits ? "Start Try-On (1 credit)" : "Insufficient Credits"}
</Button>
```

---

## Implementation Checklist

### Phase 1: Database & Infrastructure

- [ ] Add credit models to `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name add_credits_system`
- [ ] Update `sst.config.ts` with Stripe secrets and webhook
- [ ] Deploy and set secrets (`sst secrets set`)

### Phase 2: Service Layer

- [ ] Create `src/services/credits/constants.ts`
- [ ] Create `src/services/credits/wallet.ts`
- [ ] Create `src/lib/payments/stripe.ts`
- [ ] Create `src/lib/payments/checkout.ts`

### Phase 3: API Layer

- [ ] Create `src/trpc/routers/credits.ts`
- [ ] Register router in `src/trpc/router.ts`
- [ ] Create `src/workers/stripe-webhook.ts`

### Phase 4: Integration

- [ ] Update `src/workers/try-on.ts` with credit logic
- [ ] Add signup bonus hook to auth config
- [ ] Test end-to-end flow

### Phase 5: Frontend

- [ ] Create credits page/screen
- [ ] Add balance display to header
- [ ] Update try-on page with credit checks
- [ ] Handle purchase success/cancel redirects

### Phase 6: Testing & Deployment

- [ ] Test with Stripe CLI webhooks
- [ ] Test idempotency (retry scenarios)
- [ ] Deploy to dev environment
- [ ] Configure Stripe webhook in dashboard
- [ ] Deploy to production

---

## Testing Guide

### Stripe CLI Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login and forward webhooks
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger checkout.session.expired
stripe trigger payment_intent.payment_failed
```

### Test Cases

| Scenario                      | Expected Result                      |
| ----------------------------- | ------------------------------------ |
| New user signup               | Receives 3 free credits              |
| Purchase starter pack         | Balance increases by 8               |
| Start try-on with credits     | Job queued, balance unchanged        |
| Try-on completes successfully | Balance decremented by 1             |
| Try-on fails                  | Balance unchanged, user can retry    |
| Double webhook delivery       | Credits granted exactly once         |
| Purchase during webhook delay | Sync completes first, webhook no-ops |
| Cancel checkout               | PENDING payment deleted              |
| Session expires               | PENDING payment deleted              |

### Test Cards

| Card Number      | Scenario           |
| ---------------- | ------------------ |
| 4242424242424242 | Success            |
| 4000000000000002 | Card declined      |
| 4000000000009995 | Insufficient funds |
| 4000000000000341 | Attaching fails    |

---

## Appendix: Type Exports

Create `src/types/credits.ts` for shared types:

```typescript
import type { CreditTransaction, CreditWallet, Payment } from "@prisma/client";

export type { CreditTransaction, CreditWallet, Payment };

export type CreditBalance = {
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  totalBonus: number;
};

export type CreditPackage = {
  id: string;
  name: string;
  credits: number;
  priceInCents: number;
  priceDisplay: string;
  costPerCredit: number;
  savings: number;
  description: string;
  popular?: boolean;
};
```

---

This implementation guide provides a complete blueprint for adding a credit-based payment system to Drezzi, adapted from the working cima implementation. The key adaptations include:

1. **Prisma instead of Drizzle** - All database operations use Prisma's transaction API
2. **Try-On instead of Video** - Credit consumption tied to virtual try-on operations
3. **Existing Infrastructure** - Leverages drezzi's existing workers, WebSocket, and queues
4. **Idempotency** - Same patterns for preventing double-charges and double-credits
