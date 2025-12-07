# Stripe Credits Implementation Guide

Stripe-powered credit purchases for Drezzi virtual try-ons. Users buy credit packs through Stripe Checkout; credits are charged when a try-on job succeeds.

---

## Implementation Status

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Prisma Schema | **Done** | Credit models and enums added |
| 2. SST Wiring | **Done** | Stripe secrets and webhook function configured |
| 3. Credit Services | **Done** | Wallet, checkout, and Stripe client implemented |
| 4. Stripe Webhook | **Done** | Lambda handler for payment events |
| 5. tRPC Router | **Done** | Credits API endpoints |
| 6. Try-On Integration | **Done** | Credit charging after successful try-on |
| 7. Frontend | **Done** | Credits page, balance display |
| 8. Testing | **Pending** | Local and live testing |
| 9. Deployment | **Pending** | Production rollout |

---

## High-Level Flows

**Purchase**
1) tRPC creates Stripe Checkout Session and a `Payment` row with `PENDING` status
2) User pays on Stripe-hosted page
3) Success redirect calls `syncCheckoutSession` with the `session_id` query param
4) Stripe webhook repeats fulfillment; both paths converge on the same idempotent DB update

**Fulfillment (idempotent)**
- Only transition `Payment.status` from `PENDING` → `SUCCEEDED` once
- Wallet credited and `CreditTransaction` inserted inside the same Prisma transaction
- Repeated webhook or sync calls no-op because status is no longer `PENDING`

**Try-On Usage**
- After worker success: `chargeCreditsForTryOn` (idempotent per `tryOnId`)
- No charge on failure; refund helper exists for reversals if needed

---

## Phase 1: Prisma Schema (Done)

Models added to `prisma/schema.prisma`:

- `CreditTransactionType` enum: `PURCHASE`, `USAGE`, `REFUND`, `BONUS`, `ADMIN`
- `PaymentStatus` enum: `PENDING`, `SUCCEEDED`, `FAILED`
- `CreditWallet` model with balance tracking
- `Payment` model for Stripe checkout sessions
- `CreditTransaction` model with unique constraint `[tryOnId, type]` for idempotency

Relations updated on `User` and `TryOn` models.

Database synced:
```bash
bun --env-file=.env.franklin prisma db push
bun --env-file=.env.franklin prisma generate
```

---

## Phase 2: SST Wiring (Done)

File: `sst.config.ts`

Added:
- `StripeSecretKey` and `StripeWebhookSecret` secrets
- `StripeWebhook` Lambda function with URL endpoint
- `stripeSecretKey` linked to web app
- `STRIPE_SECRET_KEY` environment variable

Output: `stripeWebhook` URL returned for Stripe Dashboard configuration.

---

## Phase 3: Credit Services (Done)

### 3.1 Constants
File: `src/services/credits/constants.ts`

```typescript
export const CREDIT_PACKAGES = {
  starter: { id: "starter", name: "Starter", credits: 8, priceInCents: 500 },
  basic: { id: "basic", name: "Basic", credits: 18, priceInCents: 1000 },
  pro: { id: "pro", name: "Pro", credits: 30, priceInCents: 1500 },
} as const;

export const TRY_ON_COST = 1;
export const FREE_SIGNUP_CREDITS = 3;
```

### 3.2 Wallet Service
File: `src/services/credits/wallet.ts`

Functions:
- `getOrCreateWallet(prisma, userId)` - Creates wallet with 3 bonus credits for new users
- `getBalance(prisma, userId)` - Returns current balance
- `hasCredits(prisma, userId, amount)` - Boolean check
- `addCredits(prisma, userId, amount, params)` - Add credits with transaction
- `chargeCreditsForTryOn(prisma, userId, tryOnId, description)` - Idempotent charge
- `refundCreditsForTryOn(prisma, userId, tryOnId, description)` - Reversal helper

### 3.3 Stripe Client
File: `src/lib/payments/stripe.ts`

Lazy singleton using Stripe SDK (uses default API version from package).

### 3.4 Checkout Service
File: `src/lib/payments/checkout.ts`

- `createCheckoutSession()` - Creates Stripe session and PENDING payment
- `syncStripeSessionToDB()` - Idempotent fulfillment with atomic wallet credit

---

## Phase 4: Stripe Webhook (Done)

File: `src/workers/stripe-webhook.ts`

Lambda handler that:
- Verifies webhook signature with `Resource.StripeWebhookSecret.value`
- Handles `checkout.session.completed` → calls `syncStripeSessionToDB`
- Handles `checkout.session.expired` → deletes PENDING payments
- Handles `payment_intent.payment_failed` → marks payment FAILED
- Always returns 200 (idempotency handles retries)

---

## Phase 5: tRPC Router (Done)

File: `src/trpc/routers/credits.ts`

Procedures:
- `getPackages` - Returns credit packages for UI
- `getBalance` - Returns wallet balance and totals
- `getHistory` - Paginated transaction history
- `getPurchaseHistory` - Paginated payment history
- `createCheckoutSession` - Creates Stripe checkout, returns URL
- `syncCheckoutSession` - Syncs payment after redirect
- `cancelCheckout` - Cleans up cancelled sessions

Validators: `src/validators/credits.ts`

Router registered in `src/trpc/router.ts` as `credits: creditsRouter`.

---

## Phase 6: Try-On Worker Integration (Done)

File: `src/workers/try-on.ts`

After successful try-on completion (step 5.5):
- Calls `chargeCreditsForTryOn(prisma, userId, tryOnId, "Virtual try-on")`
- Idempotent: unique constraint prevents double-charging
- New balance included in WebSocket complete event

---

## Phase 7: Frontend (Done)

### Credits Route
File: `src/routes/(authed)/credits/index.tsx`
- Search params: `purchase`, `session_id`
- Loader prefetches balance, packages, history

### Credits Screen
File: `src/screens/credits/index.tsx`
- Balance card with totals
- Package selection cards with pricing
- Transaction history list
- Handles success/cancelled redirects

### Balance Badge
File: `src/components/credits/balance-badge.tsx`
- Shows current balance for navbar integration

---

## Phase 8: Testing (Pending)

### Local Webhook Testing
```bash
stripe login
stripe listen --forward-to <stripeWebhook.url>
stripe trigger checkout.session.completed
```

### Manual Test Cases
- [ ] Purchase starter pack → wallet +8 credits, payment SUCCEEDED
- [ ] Retry webhook delivery → no double credit (idempotency)
- [ ] Try-on success → balance -1 credit
- [ ] Try-on failure → balance unchanged
- [ ] New user signup → 3 bonus credits

### Validation
```bash
bun typecheck
bun format
```

---

## Phase 9: Deployment Checklist (Pending)

### Pre-deployment
- [x] Prisma schema updated and pushed to database
- [x] SST config updated with Stripe secrets and webhook
- [x] All services and routers implemented
- [x] Frontend credits page created
- [x] Typecheck passes

### Deployment Steps
1. [ ] Run `sst deploy` to deploy webhook function
2. [ ] Copy the `stripeWebhook` URL from deployment output
3. [ ] Configure webhook in Stripe Dashboard:
   - Go to Developers → Webhooks
   - Add endpoint with the `stripeWebhook` URL
   - Select events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`
4. [ ] Verify `StripeSecretKey` and `StripeWebhookSecret` are set for the stage
5. [ ] Test purchase flow end-to-end
6. [ ] Test webhook retry behavior

### Post-deployment
- [ ] Monitor first purchases in Stripe Dashboard
- [ ] Check application logs for any errors
- [ ] Verify idempotency by triggering duplicate webhooks

---

## File Summary

| Category | Files |
|----------|-------|
| Schema | `prisma/schema.prisma` |
| Config | `sst.config.ts` |
| Services | `src/services/credits/constants.ts`, `src/services/credits/wallet.ts` |
| Payments | `src/lib/payments/stripe.ts`, `src/lib/payments/checkout.ts` |
| Worker | `src/workers/stripe-webhook.ts`, `src/workers/try-on.ts` (modified) |
| API | `src/trpc/routers/credits.ts`, `src/validators/credits.ts` |
| Frontend | `src/routes/(authed)/credits/index.tsx`, `src/screens/credits/index.tsx`, `src/components/credits/balance-badge.tsx` |

---

## Key Implementation Details

### Idempotency Patterns

**Payment Fulfillment:**
```typescript
const result = await tx.payment.updateMany({
  where: { stripeCheckoutSessionId: sessionId, status: "PENDING" },
  data: { status: "SUCCEEDED" },
});
if (result.count === 0) return { alreadyProcessed: true };
```

**Try-On Charging:**
- Unique constraint `@@unique([tryOnId, type])` prevents duplicate USAGE transactions
- `chargeCreditsForTryOn` checks for existing transaction before creating

### Signup Bonus
New users receive 3 free credits on first wallet access via `getOrCreateWallet`.

### WebSocket Balance Updates
Try-on complete events include `balance` field for real-time UI updates.
