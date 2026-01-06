# Drezzi to Monorepo Migration: Phased Implementation Guide

A detailed, phased approach to migrating the **Drezzi** TanStack Start application (Prisma-based) into the **sst-mono-repo** structure, converting from Prisma ORM to Drizzle ORM with Effect-based services.

---

## Overview

### Source Project
- **Location**: `/` (drezzi root)
- **ORM**: Prisma
- **Services**: Async/await functions
- **Schema**: `prisma/schema.prisma` (363 lines, 15 models)

### Target Project
- **Location**: `/sst-mono-repo`
- **ORM**: Drizzle
- **Services**: Effect-based with tagged errors
- **Schema**: `packages/core/src/db/schema/*.ts`

### Models to Migrate
| Prisma Model | Drizzle File | Priority |
|--------------|--------------|----------|
| User, Session, Account, Verification | `auth.ts` (extend) | P0 |
| File | `file.ts` (new) | P0 |
| BodyProfile | `body-profile.ts` (new) | P1 |
| Garment | `garment.ts` (new) | P1 |
| TryOn | `try-on.ts` (new) | P1 |
| Lookbook, LookbookItem | `lookbook.ts` (new) | P2 |
| StyleTip | `style-tip.ts` (new) | P2 |
| CreditWallet, Payment, CreditTransaction | `credits.ts` (new) | P2 |
| Todo | `todo.ts` (keep) | N/A |

---

## Phase 1: Database Schema Conversion (Days 1-3)

### 1.1 Create Shared Enums

**File**: `packages/core/src/db/schema/enums.ts`

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

// User role (already exists in auth.ts, move here for consistency)
export enum UserRole {
  GUEST = "GUEST",
  ADMIN = "ADMIN",
}
export const userRoleSchema = pgEnum("user_role", [UserRole.GUEST, UserRole.ADMIN]);

// Enhancement status for image processing
export enum EnhancementStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}
export const enhancementStatusSchema = pgEnum("enhancement_status", [
  EnhancementStatus.PENDING,
  EnhancementStatus.PROCESSING,
  EnhancementStatus.COMPLETED,
  EnhancementStatus.FAILED,
]);

// Credit transaction types
export enum CreditTransactionType {
  PURCHASE = "PURCHASE",
  USAGE = "USAGE",
  REFUND = "REFUND",
  BONUS = "BONUS",
  ADMIN = "ADMIN",
}
export const creditTransactionTypeSchema = pgEnum("credit_transaction_type", [
  CreditTransactionType.PURCHASE,
  CreditTransactionType.USAGE,
  CreditTransactionType.REFUND,
  CreditTransactionType.BONUS,
  CreditTransactionType.ADMIN,
]);

// Payment status
export enum PaymentStatus {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}
export const paymentStatusSchema = pgEnum("payment_status", [
  PaymentStatus.PENDING,
  PaymentStatus.SUCCEEDED,
  PaymentStatus.FAILED,
]);
```

### 1.2 Create File Schema

**File**: `packages/core/src/db/schema/file.ts`

```typescript
import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema } from "drizzle-zod";

export const files = pgTable("file", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  key: text("key").notNull().unique(),
  bucket: text("bucket").default("media").notNull(),
  filename: text("filename"),
  mimeType: text("mime_type"),
  size: integer("size"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const fileInsert = createInsertSchema(files);
export type File = typeof files.$inferSelect;
export type FileInsert = typeof files.$inferInsert;
```

### 1.3 Create Body Profile Schema

**File**: `packages/core/src/db/schema/body-profile.ts`

```typescript
import { pgTable, text, boolean, real, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { files } from "./file";
import { enhancementStatusSchema } from "./enums";

export const bodyProfiles = pgTable("body_profile", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").default("Default").notNull(),
  photoId: text("photo_id").notNull().unique().references(() => files.id),
  enhancedPhotoId: text("enhanced_photo_id").unique().references(() => files.id),
  enhancementStatus: enhancementStatusSchema("enhancement_status"),
  enhancementError: text("enhancement_error"),
  height: real("height"),
  waist: real("waist"),
  hip: real("hip"),
  inseam: real("inseam"),
  chest: real("chest"),
  fitPreference: text("fit_preference").default("regular").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
  index("body_profile_user_id_idx").on(table.userId),
]);

export const bodyProfileInsert = createInsertSchema(bodyProfiles);
export const bodyProfileUpdate = createUpdateSchema(bodyProfiles);

export const apiBodyProfileCreate = bodyProfileInsert.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type BodyProfile = typeof bodyProfiles.$inferSelect;
export type BodyProfileCreate = z.infer<typeof apiBodyProfileCreate>;
```

### 1.4 Create Garment Schema

**File**: `packages/core/src/db/schema/garment.ts`

```typescript
import { pgTable, text, boolean, real, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { files } from "./file";

export const garments = pgTable("garment", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  brand: text("brand"),
  price: real("price"),
  currency: text("currency").default("USD").notNull(),
  imageId: text("image_id").notNull().unique().references(() => files.id),
  maskId: text("mask_id").unique().references(() => files.id),
  retailUrl: text("retail_url"),
  colors: text("colors").array().default([]).notNull(),
  sizes: text("sizes").array().default([]).notNull(),
  tags: text("tags").array().default([]).notNull(),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
  index("garment_user_id_idx").on(table.userId),
  index("garment_category_idx").on(table.category),
  index("garment_brand_idx").on(table.brand),
  index("garment_is_public_idx").on(table.isPublic),
]);

export const garmentInsert = createInsertSchema(garments);
export const garmentUpdate = createUpdateSchema(garments);

export const apiGarmentCreate = garmentInsert.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type Garment = typeof garments.$inferSelect;
export type GarmentCreate = z.infer<typeof apiGarmentCreate>;
```

### 1.5 Create Try-On Schema

**File**: `packages/core/src/db/schema/try-on.ts`

```typescript
import { pgTable, text, boolean, real, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { files } from "./file";
import { bodyProfiles } from "./body-profile";
import { garments } from "./garment";

export const tryOns = pgTable("try_on", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  bodyProfileId: text("body_profile_id").notNull().references(() => bodyProfiles.id),
  garmentId: text("garment_id").notNull().references(() => garments.id),
  status: text("status").default("pending").notNull(),
  frontPhotoId: text("front_photo_id").unique().references(() => files.id),
  backPhotoId: text("back_photo_id").unique().references(() => files.id),
  resultId: text("result_id").unique().references(() => files.id),
  jobId: text("job_id"),
  processingMs: integer("processing_ms"),
  confidenceScore: real("confidence_score"),
  errorMessage: text("error_message"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("try_on_user_id_idx").on(table.userId),
  index("try_on_status_idx").on(table.status),
]);

export const tryOnInsert = createInsertSchema(tryOns);

export const apiTryOnCreate = tryOnInsert.pick({
  bodyProfileId: true,
  garmentId: true,
});

export type TryOn = typeof tryOns.$inferSelect;
export type TryOnCreate = z.infer<typeof apiTryOnCreate>;
```

### 1.6 Create Lookbook Schema

**File**: `packages/core/src/db/schema/lookbook.ts`

```typescript
import { pgTable, text, boolean, integer, timestamp, index, unique } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { files } from "./file";
import { tryOns } from "./try-on";

export const lookbooks = pgTable("lookbook", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  coverId: text("cover_id").unique().references(() => files.id),
  isPublic: boolean("is_public").default(false).notNull(),
  shareSlug: text("share_slug").unique(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
  index("lookbook_user_id_idx").on(table.userId),
  index("lookbook_share_slug_idx").on(table.shareSlug),
]);

export const lookbookItems = pgTable("lookbook_item", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  lookbookId: text("lookbook_id").notNull().references(() => lookbooks.id, { onDelete: "cascade" }),
  tryOnId: text("try_on_id").notNull().references(() => tryOns.id, { onDelete: "cascade" }),
  order: integer("order").default(0).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
  unique("lookbook_item_unique").on(table.lookbookId, table.tryOnId),
]);

export const lookbookInsert = createInsertSchema(lookbooks);
export const lookbookUpdate = createUpdateSchema(lookbooks);
export const lookbookItemInsert = createInsertSchema(lookbookItems);

export const apiLookbookCreate = lookbookInsert.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type Lookbook = typeof lookbooks.$inferSelect;
export type LookbookItem = typeof lookbookItems.$inferSelect;
export type LookbookCreate = z.infer<typeof apiLookbookCreate>;
```

### 1.7 Create Style Tip Schema

**File**: `packages/core/src/db/schema/style-tip.ts`

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { tryOns } from "./try-on";

export const styleTips = pgTable("style_tip", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  tryOnId: text("try_on_id").notNull().references(() => tryOns.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // fit, color, style, occasion
  content: text("content").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const styleTipInsert = createInsertSchema(styleTips);

export const apiStyleTipCreate = styleTipInsert.omit({
  id: true,
  createdAt: true,
});

export type StyleTip = typeof styleTips.$inferSelect;
export type StyleTipCreate = z.infer<typeof apiStyleTipCreate>;
```

### 1.8 Create Credits Schema

**File**: `packages/core/src/db/schema/credits.ts`

```typescript
import { pgTable, text, integer, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { createInsertSchema } from "drizzle-zod";
import { user } from "./auth";
import { tryOns } from "./try-on";
import { creditTransactionTypeSchema, paymentStatusSchema } from "./enums";

// Credit Wallet
export const creditWallets = pgTable("credit_wallet", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").default(0).notNull(),
  totalPurchased: integer("total_purchased").default(0).notNull(),
  totalUsed: integer("total_used").default(0).notNull(),
  totalBonus: integer("total_bonus").default(0).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
  index("credit_wallet_user_id_idx").on(table.userId),
  index("credit_wallet_balance_idx").on(table.balance),
]);

// Payments
export const payments = pgTable("payment", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").default("usd").notNull(),
  creditsGranted: integer("credits_granted").notNull(),
  packageId: text("package_id").notNull(),
  packageName: text("package_name").notNull(),
  status: paymentStatusSchema("status").default("PENDING").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
  index("payment_user_id_idx").on(table.userId),
  index("payment_stripe_session_idx").on(table.stripeCheckoutSessionId),
  index("payment_status_idx").on(table.status),
  index("payment_created_at_idx").on(table.createdAt),
]);

// Credit Transactions
export const creditTransactions = pgTable("credit_transaction", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  walletId: text("wallet_id").notNull().references(() => creditWallets.id, { onDelete: "cascade" }),
  type: creditTransactionTypeSchema("type").notNull(),
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  paymentId: text("payment_id").references(() => payments.id),
  tryOnId: text("try_on_id").references(() => tryOns.id),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (table) => [
  unique("credit_transaction_tryon_type").on(table.tryOnId, table.type),
  index("credit_transaction_user_id_idx").on(table.userId),
  index("credit_transaction_wallet_id_idx").on(table.walletId),
  index("credit_transaction_created_at_idx").on(table.createdAt),
  index("credit_transaction_type_idx").on(table.type),
]);

export const creditWalletInsert = createInsertSchema(creditWallets);
export const paymentInsert = createInsertSchema(payments);
export const creditTransactionInsert = createInsertSchema(creditTransactions);

export type CreditWallet = typeof creditWallets.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
```

### 1.9 Create Relations File

**File**: `packages/core/src/db/schema/relations.ts`

```typescript
import { relations } from "drizzle-orm";
import { user, session, account } from "./auth";
import { files } from "./file";
import { bodyProfiles } from "./body-profile";
import { garments } from "./garment";
import { tryOns } from "./try-on";
import { lookbooks, lookbookItems } from "./lookbook";
import { styleTips } from "./style-tip";
import { creditWallets, payments, creditTransactions } from "./credits";

// User relations
export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  bodyProfiles: many(bodyProfiles),
  garments: many(garments),
  tryOns: many(tryOns),
  lookbooks: many(lookbooks),
  creditWallet: one(creditWallets),
  payments: many(payments),
  creditTransactions: many(creditTransactions),
}));

// Body Profile relations
export const bodyProfileRelations = relations(bodyProfiles, ({ one, many }) => ({
  user: one(user, { fields: [bodyProfiles.userId], references: [user.id] }),
  photo: one(files, { fields: [bodyProfiles.photoId], references: [files.id] }),
  enhancedPhoto: one(files, { fields: [bodyProfiles.enhancedPhotoId], references: [files.id] }),
  tryOns: many(tryOns),
}));

// Garment relations
export const garmentRelations = relations(garments, ({ one, many }) => ({
  user: one(user, { fields: [garments.userId], references: [user.id] }),
  image: one(files, { fields: [garments.imageId], references: [files.id] }),
  mask: one(files, { fields: [garments.maskId], references: [files.id] }),
  tryOns: many(tryOns),
}));

// TryOn relations
export const tryOnRelations = relations(tryOns, ({ one, many }) => ({
  user: one(user, { fields: [tryOns.userId], references: [user.id] }),
  bodyProfile: one(bodyProfiles, { fields: [tryOns.bodyProfileId], references: [bodyProfiles.id] }),
  garment: one(garments, { fields: [tryOns.garmentId], references: [garments.id] }),
  frontPhoto: one(files, { fields: [tryOns.frontPhotoId], references: [files.id] }),
  backPhoto: one(files, { fields: [tryOns.backPhotoId], references: [files.id] }),
  result: one(files, { fields: [tryOns.resultId], references: [files.id] }),
  lookbookItems: many(lookbookItems),
  styleTips: many(styleTips),
  creditTransactions: many(creditTransactions),
}));

// Lookbook relations
export const lookbookRelations = relations(lookbooks, ({ one, many }) => ({
  user: one(user, { fields: [lookbooks.userId], references: [user.id] }),
  cover: one(files, { fields: [lookbooks.coverId], references: [files.id] }),
  items: many(lookbookItems),
}));

export const lookbookItemRelations = relations(lookbookItems, ({ one }) => ({
  lookbook: one(lookbooks, { fields: [lookbookItems.lookbookId], references: [lookbooks.id] }),
  tryOn: one(tryOns, { fields: [lookbookItems.tryOnId], references: [tryOns.id] }),
}));

// StyleTip relations
export const styleTipRelations = relations(styleTips, ({ one }) => ({
  tryOn: one(tryOns, { fields: [styleTips.tryOnId], references: [tryOns.id] }),
}));

// Credit relations
export const creditWalletRelations = relations(creditWallets, ({ one, many }) => ({
  user: one(user, { fields: [creditWallets.userId], references: [user.id] }),
  transactions: many(creditTransactions),
}));

export const paymentRelations = relations(payments, ({ one, many }) => ({
  user: one(user, { fields: [payments.userId], references: [user.id] }),
  transactions: many(creditTransactions),
}));

export const creditTransactionRelations = relations(creditTransactions, ({ one }) => ({
  user: one(user, { fields: [creditTransactions.userId], references: [user.id] }),
  wallet: one(creditWallets, { fields: [creditTransactions.walletId], references: [creditWallets.id] }),
  payment: one(payments, { fields: [creditTransactions.paymentId], references: [payments.id] }),
  tryOn: one(tryOns, { fields: [creditTransactions.tryOnId], references: [tryOns.id] }),
}));
```

### 1.10 Update Schema Index

**File**: `packages/core/src/db/schema/index.ts`

```typescript
export * from "./enums";
export * from "./auth";
export * from "./todo";
export * from "./file";
export * from "./body-profile";
export * from "./garment";
export * from "./try-on";
export * from "./lookbook";
export * from "./style-tip";
export * from "./credits";
export * from "./relations";
```

### Phase 1 Checklist

- [ ] Create `enums.ts` with all enums
- [ ] Create `file.ts` schema
- [ ] Create `body-profile.ts` schema
- [ ] Create `garment.ts` schema
- [ ] Create `try-on.ts` schema
- [ ] Create `lookbook.ts` schema
- [ ] Create `style-tip.ts` schema
- [ ] Create `credits.ts` schema
- [ ] Create `relations.ts` for all relations
- [ ] Update `index.ts` exports
- [ ] Run `bun drizzle-kit generate` to create migration
- [ ] Test migration on dev database

---

## Phase 2: Services Migration (Days 4-7)

### 2.1 Service Architecture Pattern

Follow the monorepo's Effect-based service pattern:

```typescript
// Pattern: Effect.Service with tagged errors
export class MyServiceError extends Data.TaggedError("MyServiceError")<{
  cause: unknown;
}> {}

export class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;
      
      return {
        myMethod: (input: Input) =>
          Effect.tryPromise({
            try: () => db.select().from(myTable),
            catch: (error) => new MyServiceError({ cause: error }),
          }).pipe(
            Effect.withSpan("MyService.myMethod")
          ),
      };
    }),
    dependencies: [DatabaseService.Default],
  }
) {}
```

### 2.2 Create File Service

**File**: `packages/core/src/services/files.ts`

```typescript
import { Data, Effect } from "effect";
import { eq } from "drizzle-orm";
import { DatabaseService } from "./database";
import { files, type File, type FileInsert } from "../db/schema";

export class FileNotFoundError extends Data.TaggedError("FileNotFoundError")<{
  id: string;
}> {}

export class FileDatabaseError extends Data.TaggedError("FileDatabaseError")<{
  cause: unknown;
}> {}

export class FileService extends Effect.Service<FileService>()(
  "FileService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      return {
        byId: (id: string) =>
          Effect.gen(function* () {
            const results = yield* Effect.tryPromise({
              try: () => db.select().from(files).where(eq(files.id, id)),
              catch: (error) => new FileDatabaseError({ cause: error }),
            });
            const [file] = results;
            if (!file) return yield* Effect.fail(new FileNotFoundError({ id }));
            return file;
          }).pipe(Effect.withSpan("FileService.byId")),

        byKey: (key: string) =>
          Effect.gen(function* () {
            const results = yield* Effect.tryPromise({
              try: () => db.select().from(files).where(eq(files.key, key)),
              catch: (error) => new FileDatabaseError({ cause: error }),
            });
            const [file] = results;
            if (!file) return yield* Effect.fail(new FileNotFoundError({ id: key }));
            return file;
          }).pipe(Effect.withSpan("FileService.byKey")),

        create: (input: FileInsert) =>
          Effect.tryPromise({
            try: () => db.insert(files).values(input).returning(),
            catch: (error) => new FileDatabaseError({ cause: error }),
          }).pipe(
            Effect.map((results) => results[0]!),
            Effect.withSpan("FileService.create")
          ),

        delete: (id: string) =>
          Effect.tryPromise({
            try: () => db.delete(files).where(eq(files.id, id)).returning(),
            catch: (error) => new FileDatabaseError({ cause: error }),
          }).pipe(Effect.withSpan("FileService.delete")),
      };
    }),
    dependencies: [DatabaseService.Default],
  }
) {}

export type { File };
```

### 2.3 Create Body Profile Service

**File**: `packages/core/src/services/body-profiles.ts`

```typescript
import { Data, Effect } from "effect";
import { and, eq } from "drizzle-orm";
import { DatabaseService } from "./database";
import { bodyProfiles, type BodyProfile, type BodyProfileCreate } from "../db/schema";

export class BodyProfileNotFoundError extends Data.TaggedError("BodyProfileNotFoundError")<{
  id: string;
}> {}

export class BodyProfileDatabaseError extends Data.TaggedError("BodyProfileDatabaseError")<{
  cause: unknown;
}> {}

export class BodyProfileService extends Effect.Service<BodyProfileService>()(
  "BodyProfileService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      return {
        list: (userId: string) =>
          Effect.tryPromise({
            try: () => db.select().from(bodyProfiles).where(eq(bodyProfiles.userId, userId)),
            catch: (error) => new BodyProfileDatabaseError({ cause: error }),
          }).pipe(Effect.withSpan("BodyProfileService.list")),

        byId: (id: string, userId: string) =>
          Effect.gen(function* () {
            const results = yield* Effect.tryPromise({
              try: () => db.select().from(bodyProfiles)
                .where(and(eq(bodyProfiles.id, id), eq(bodyProfiles.userId, userId))),
              catch: (error) => new BodyProfileDatabaseError({ cause: error }),
            });
            const [profile] = results;
            if (!profile) return yield* Effect.fail(new BodyProfileNotFoundError({ id }));
            return profile;
          }).pipe(Effect.withSpan("BodyProfileService.byId")),

        create: (userId: string, input: BodyProfileCreate) =>
          Effect.tryPromise({
            try: () => db.insert(bodyProfiles).values({ ...input, userId }).returning(),
            catch: (error) => new BodyProfileDatabaseError({ cause: error }),
          }).pipe(
            Effect.map((results) => results[0]!),
            Effect.withSpan("BodyProfileService.create")
          ),

        update: (id: string, userId: string, input: Partial<BodyProfileCreate>) =>
          Effect.gen(function* () {
            const results = yield* Effect.tryPromise({
              try: () => db.update(bodyProfiles)
                .set({ ...input, updatedAt: new Date() })
                .where(and(eq(bodyProfiles.id, id), eq(bodyProfiles.userId, userId)))
                .returning(),
              catch: (error) => new BodyProfileDatabaseError({ cause: error }),
            });
            const [updated] = results;
            if (!updated) return yield* Effect.fail(new BodyProfileNotFoundError({ id }));
            return updated;
          }).pipe(Effect.withSpan("BodyProfileService.update")),

        delete: (id: string, userId: string) =>
          Effect.tryPromise({
            try: () => db.delete(bodyProfiles)
              .where(and(eq(bodyProfiles.id, id), eq(bodyProfiles.userId, userId)))
              .returning(),
            catch: (error) => new BodyProfileDatabaseError({ cause: error }),
          }).pipe(Effect.withSpan("BodyProfileService.delete")),

        setDefault: (id: string, userId: string) =>
          Effect.gen(function* () {
            // Clear existing defaults
            yield* Effect.tryPromise({
              try: () => db.update(bodyProfiles)
                .set({ isDefault: false })
                .where(eq(bodyProfiles.userId, userId)),
              catch: (error) => new BodyProfileDatabaseError({ cause: error }),
            });
            // Set new default
            const results = yield* Effect.tryPromise({
              try: () => db.update(bodyProfiles)
                .set({ isDefault: true, updatedAt: new Date() })
                .where(and(eq(bodyProfiles.id, id), eq(bodyProfiles.userId, userId)))
                .returning(),
              catch: (error) => new BodyProfileDatabaseError({ cause: error }),
            });
            const [updated] = results;
            if (!updated) return yield* Effect.fail(new BodyProfileNotFoundError({ id }));
            return updated;
          }).pipe(Effect.withSpan("BodyProfileService.setDefault")),
      };
    }),
    dependencies: [DatabaseService.Default],
  }
) {}

export type { BodyProfile };
```

### 2.4 Additional Services (Create Similarly)

Following the same pattern, create:
- `packages/core/src/services/garments.ts`
- `packages/core/src/services/try-ons.ts`
- `packages/core/src/services/lookbooks.ts`
- `packages/core/src/services/style-tips.ts`
- `packages/core/src/services/credits.ts`
- `packages/core/src/services/payments.ts`

### 2.5 Update Services Index

**File**: `packages/core/src/services/index.ts`

```typescript
export * from "./database";
export * from "./auth";
export * from "./todos";
export * from "./files";
export * from "./body-profiles";
export * from "./garments";
export * from "./try-ons";
export * from "./lookbooks";
export * from "./style-tips";
export * from "./credits";
export * from "./payments";
```

### Phase 2 Checklist

- [ ] Create `FileService`
- [ ] Create `BodyProfileService`
- [ ] Create `GarmentService`
- [ ] Create `TryOnService`
- [ ] Create `LookbookService`
- [ ] Create `StyleTipService`
- [ ] Create `CreditsService`
- [ ] Create `PaymentService`
- [ ] Update `services/index.ts`
- [ ] Add unit tests for critical paths
- [ ] Verify Effect error handling

---

## Phase 3: tRPC Router Migration (Days 8-10)

### 3.1 Router Pattern

Convert from Prisma context to Effect context:

```typescript
// Before (Prisma)
const router = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.garment.findMany({ where: { userId: ctx.user.id } });
  }),
});

// After (Effect)
const router = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.runEffect(GarmentService.list(ctx.user.id));
  }),
});
```

### 3.2 Create Profile Router

**File**: `packages/core/src/trpc/routers/profile.ts`

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { BodyProfileService } from "../../services/body-profiles";
import { apiBodyProfileCreate } from "../../db/schema";

export const profileRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.runEffect(BodyProfileService.list(ctx.user.id))
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.runEffect(BodyProfileService.byId(input.id, ctx.user.id))
    ),

  create: protectedProcedure
    .input(apiBodyProfileCreate)
    .mutation(({ ctx, input }) =>
      ctx.runEffect(BodyProfileService.create(ctx.user.id, input))
    ),

  update: protectedProcedure
    .input(z.object({ id: z.string() }).merge(apiBodyProfileCreate.partial()))
    .mutation(({ ctx, input }) =>
      ctx.runEffect(BodyProfileService.update(input.id, ctx.user.id, input))
    ),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.runEffect(BodyProfileService.delete(input.id, ctx.user.id))
    ),

  setDefault: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.runEffect(BodyProfileService.setDefault(input.id, ctx.user.id))
    ),
});
```

### 3.3 Create Additional Routers

Following the same pattern, create:
- `packages/core/src/trpc/routers/garment.ts`
- `packages/core/src/trpc/routers/try-on.ts`
- `packages/core/src/trpc/routers/lookbook.ts`
- `packages/core/src/trpc/routers/style-tip.ts`
- `packages/core/src/trpc/routers/credits.ts`
- `packages/core/src/trpc/routers/dashboard.ts`
- `packages/core/src/trpc/routers/upscale.ts`
- `packages/core/src/trpc/routers/user.ts`

### 3.4 Update Main Router

**File**: `packages/core/src/trpc/router.ts`

```typescript
import { createTRPCRouter } from "./init";
import { todoRouter } from "./routers/todo";
import { authRouter } from "./routers/auth";
import { profileRouter } from "./routers/profile";
import { garmentRouter } from "./routers/garment";
import { tryOnRouter } from "./routers/try-on";
import { lookbookRouter } from "./routers/lookbook";
import { styleTipRouter } from "./routers/style-tip";
import { creditsRouter } from "./routers/credits";
import { dashboardRouter } from "./routers/dashboard";
import { upscaleRouter } from "./routers/upscale";
import { userRouter } from "./routers/user";

export const appRouter = createTRPCRouter({
  todo: todoRouter,
  auth: authRouter,
  profile: profileRouter,
  garment: garmentRouter,
  tryOn: tryOnRouter,
  lookbook: lookbookRouter,
  styleTip: styleTipRouter,
  credits: creditsRouter,
  dashboard: dashboardRouter,
  upscale: upscaleRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

### Phase 3 Checklist

- [ ] Create `profileRouter`
- [ ] Create `garmentRouter`
- [ ] Create `tryOnRouter`
- [ ] Create `lookbookRouter`
- [ ] Create `styleTipRouter`
- [ ] Create `creditsRouter`
- [ ] Create `dashboardRouter`
- [ ] Create `upscaleRouter`
- [ ] Create `userRouter`
- [ ] Update `router.ts` with all routers
- [ ] Test all tRPC procedures

---

## Phase 4: Workers/Functions Migration (Days 11-12)

### 4.1 Create Supporting Libraries

**File**: `packages/core/src/lib/sqs.ts`
```typescript
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { Resource } from "sst";

const sqs = new SQSClient({});

export async function enqueueTryOnJob(data: {
  tryOnId: string;
  userId: string;
  bodyProfileId: string;
  garmentId: string;
}) {
  await sqs.send(new SendMessageCommand({
    QueueUrl: Resource.TryOnQueue.url,
    MessageBody: JSON.stringify(data),
  }));
}

export async function enqueueUpscaleJob(data: {
  type: "profile" | "garment" | "tryOn";
  targetId: string;
  userId: string;
}) {
  await sqs.send(new SendMessageCommand({
    QueueUrl: Resource.UpscaleQueue.url,
    MessageBody: JSON.stringify(data),
  }));
}
```

**File**: `packages/core/src/lib/s3.ts`
```typescript
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Resource } from "sst";

const s3 = new S3Client({});

export async function getPresignedUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}

export async function getUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: Resource.MediaBucket.name,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn });
}
```

### 4.2 Create Worker Functions

**File**: `packages/functions/src/workers/try-on.ts`
```typescript
import type { SQSHandler } from "aws-lambda";
// Import services, AI SDK, etc.

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    const { tryOnId, userId, bodyProfileId, garmentId } = JSON.parse(record.body);
    
    // 1. Fetch images from S3
    // 2. Call AI (Gemini) for try-on
    // 3. Upload result to S3
    // 4. Update database
    // 5. Charge credits
    // 6. Generate style tips
    // 7. Notify via WebSocket
  }
};
```

### Phase 4 Checklist

- [ ] Create `lib/sqs.ts`
- [ ] Create `lib/s3.ts`
- [ ] Create `lib/redis.ts` (if using caching)
- [ ] Create `lib/websocket-publisher.ts`
- [ ] Create `workers/try-on.ts`
- [ ] Create `workers/upscale.ts`
- [ ] Create `workers/stripe-webhook.ts`
- [ ] Create WebSocket handlers (`connect`, `disconnect`, `default`)
- [ ] Test workers locally

---

## Phase 5: Web Package Migration (Days 13-15)

### 5.1 Copy UI Components

Copy these directories from drezzi to `packages/web/src/`:

```
src/components/ → packages/web/src/components/
src/routes/ → packages/web/src/routes/
src/screens/ → packages/web/src/screens/
src/hooks/ → packages/web/src/hooks/
src/config/ → packages/web/src/config/
src/constants/ → packages/web/src/constants/
src/styles/ → packages/web/src/styles/
public/ → packages/web/public/
```

> **Out of Scope**: Do NOT migrate i18n/locales (Lingui, `src/locales/`, translations) during this migration. The i18n setup will remain in the original drezzi project and be addressed separately.

### 5.2 Update Imports

Find and replace import patterns:

```typescript
// Before
import { prisma } from "@/lib/prisma";
import { apiGarmentCreate } from "@/validators/garment";
import { getSignedUrl } from "@/services/s3";

// After
import { GarmentService } from "@monorepo-template/core/services";
import { apiGarmentCreate } from "@monorepo-template/core/db/schema";
import { getSignedUrl } from "@monorepo-template/core/lib/s3";
```

### 5.3 Update tRPC Client

Ensure `packages/web/src/lib/trpc.ts` uses the extended appRouter.

### Phase 5 Checklist

- [ ] Copy all component directories
- [ ] Copy route files
- [ ] Copy screen files
- [ ] Copy hooks
- [ ] Copy config/constants
- [ ] Copy styles
- [ ] Copy public assets
- [ ] Update all imports
- [ ] Test all routes
- [ ] Verify styling

---

## Phase 6: Infrastructure Migration (Days 16-17)

### 6.1 Create Infrastructure Modules

**File**: `infra/queues.ts`
```typescript
export const tryOnQueue = new sst.aws.Queue("TryOnQueue");
export const upscaleQueue = new sst.aws.Queue("UpscaleQueue");
```

**File**: `infra/websocket.ts`
```typescript
export const wsConnections = new sst.aws.Dynamo("WsConnections", {
  fields: { connectionId: "string" },
  primaryIndex: { hashKey: "connectionId" },
});

export const realtimeWs = new sst.aws.ApiGatewayWebSocket("RealtimeWs");
```

**File**: `infra/workers.ts`
```typescript
import { tryOnQueue, upscaleQueue } from "./queues";

tryOnQueue.subscribe("packages/functions/src/workers/try-on.handler");
upscaleQueue.subscribe("packages/functions/src/workers/upscale.handler");
```

### 6.2 Update SST Config

Add all new infrastructure modules to `sst.config.ts`.

### Phase 6 Checklist

- [ ] Create `infra/queues.ts`
- [ ] Create `infra/websocket.ts`
- [ ] Create `infra/workers.ts`
- [ ] Create `infra/email.ts`
- [ ] Update `infra/secret.ts` with new secrets
- [ ] Update `infra/storage.ts` with CORS rules
- [ ] Update `infra/web.ts` with env vars
- [ ] Update `sst.config.ts`
- [ ] Deploy to dev stage
- [ ] Test full integration

---

## Query Conversion Reference

### Prisma → Drizzle

| Operation | Prisma | Drizzle |
|-----------|--------|---------|
| Find many | `prisma.model.findMany({ where })` | `db.select().from(table).where(...)` |
| Find first | `prisma.model.findFirst({ where })` | `const [r] = await db.select().from(table).where(...).limit(1)` |
| Find unique | `prisma.model.findUnique({ where: { id } })` | `const [r] = await db.select().from(table).where(eq(table.id, id))` |
| Create | `prisma.model.create({ data })` | `db.insert(table).values(data).returning()` |
| Update | `prisma.model.update({ where, data })` | `db.update(table).set(data).where(...).returning()` |
| Delete | `prisma.model.delete({ where })` | `db.delete(table).where(...).returning()` |
| Transaction | `prisma.$transaction(async (tx) => {})` | `db.transaction(async (tx) => {})` |
| Include | `{ include: { relation: true } }` | Use separate queries or `leftJoin` |

### Where Clause Operators

| Prisma | Drizzle |
|--------|---------|
| `{ field: value }` | `eq(table.field, value)` |
| `{ field: { in: [...] } }` | `inArray(table.field, [...])` |
| `{ field: { contains: "x" } }` | `like(table.field, "%x%")` |
| `{ AND: [...] }` | `and(...)` |
| `{ OR: [...] }` | `or(...)` |
| `{ NOT: {...} }` | `not(...)` |

---

## Estimated Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Schema | 3 days | All Drizzle schemas, migration |
| Phase 2: Services | 4 days | All Effect-based services |
| Phase 3: Routers | 3 days | All tRPC routers |
| Phase 4: Workers | 2 days | Lambda workers, libs |
| Phase 5: Web | 3 days | UI components, routes |
| Phase 6: Infra | 2 days | SST config, deploy |
| **Total** | **17 days** | Full migration |

---

## Risk Mitigation

1. **Database Migration**: Run on copy of prod data first
2. **Service Logic**: Maintain test coverage during conversion
3. **Performance**: Drizzle queries may need optimization
4. **Breaking Changes**: Keep drezzi functional until migration complete
5. **Rollback Plan**: Git branches for each phase, easy revert

---

## Final Validation Checklist

- [ ] All database migrations applied successfully
- [ ] All services have working Effect implementations
- [ ] All tRPC procedures return expected data
- [ ] All workers process jobs correctly
- [ ] UI renders without errors
- [ ] Authentication flows work
- [ ] File uploads/downloads work
- [ ] Real-time updates via WebSocket work
- [ ] Credit system works (purchase, charge, refund)
- [ ] Performance is acceptable
- [ ] No TypeScript errors
- [ ] Documentation updated
