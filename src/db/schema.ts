import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const creditTransactionType = pgEnum("credit_transaction_type", [
  "PURCHASE",
  "USAGE",
  "REFUND",
  "BONUS",
  "ADMIN",
]);
export const enhancementStatus = pgEnum("enhancement_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export const paymentStatus = pgEnum("payment_status", [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
]);
export const status = pgEnum("status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);
export const userRole = pgEnum("user_role", ["GUEST", "ADMIN"]);

export const prismaMigrations = pgTable("_prisma_migrations", {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
  migrationName: varchar("migration_name", { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: timestamp("rolled_back_at", {
    withTimezone: true,
    mode: "date",
  }),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp("expires_at", { precision: 3, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { precision: 3, mode: "date" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "date" }).default(
    sql`CURRENT_TIMESTAMP`
  ),
});

export const todo = pgTable("todo", {
  id: text().primaryKey().notNull(),
  text: text().notNull(),
  description: text(),
  active: boolean().default(true).notNull(),
  status: status().default("NOT_STARTED").notNull(),
  createdAt: timestamp("created_at", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    role: userRole().default("GUEST").notNull(),
    image: text(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_email_key").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops")
    ),
  ]
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
  },
  (table) => [
    uniqueIndex("session_token_key").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      precision: 3,
      mode: "date",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      precision: 3,
      mode: "date",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const payment = pgTable(
  "payment",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeCustomerId: text("stripe_customer_id"),
    amount: integer().notNull(),
    currency: text().default("usd").notNull(),
    creditsGranted: integer("credits_granted").notNull(),
    packageId: text("package_id").notNull(),
    packageName: text("package_name").notNull(),
    status: paymentStatus().default("PENDING").notNull(),
    metadata: jsonb().$type<Record<string, object>>(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
  },
  (table) => [
    index("payment_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    index("payment_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops")
    ),
    index("payment_stripe_checkout_session_id_idx").using(
      "btree",
      table.stripeCheckoutSessionId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("payment_stripe_checkout_session_id_key").using(
      "btree",
      table.stripeCheckoutSessionId.asc().nullsLast().op("text_ops")
    ),
    index("payment_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "payment_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const bodyProfile = pgTable(
  "body_profile",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    name: text().default("Default").notNull(),
    height: doublePrecision(),
    waist: doublePrecision(),
    hip: doublePrecision(),
    inseam: doublePrecision(),
    chest: doublePrecision(),
    fitPreference: text("fit_preference").default("regular").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    photoId: text("photo_id").notNull(),
    enhancedPhotoId: text("enhanced_photo_id"),
    enhancementError: text("enhancement_error"),
    enhancementStatus: enhancementStatus("enhancement_status"),
  },
  (table) => [
    uniqueIndex("body_profile_enhanced_photo_id_key").using(
      "btree",
      table.enhancedPhotoId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("body_profile_photo_id_key").using(
      "btree",
      table.photoId.asc().nullsLast().op("text_ops")
    ),
    index("body_profile_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "body_profile_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.photoId],
      foreignColumns: [file.id],
      name: "body_profile_photo_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.enhancedPhotoId],
      foreignColumns: [file.id],
      name: "body_profile_enhanced_photo_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const creditTransaction = pgTable(
  "credit_transaction",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    walletId: text("wallet_id").notNull(),
    type: creditTransactionType().notNull(),
    amount: integer().notNull(),
    balanceAfter: integer("balance_after").notNull(),
    description: text(),
    paymentId: text("payment_id"),
    tryOnId: text("try_on_id"),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("credit_transaction_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops")
    ),
    uniqueIndex("credit_transaction_try_on_id_type_key").using(
      "btree",
      table.tryOnId.asc().nullsLast().op("text_ops"),
      table.type.asc().nullsLast().op("enum_ops")
    ),
    index("credit_transaction_type_idx").using(
      "btree",
      table.type.asc().nullsLast().op("enum_ops")
    ),
    index("credit_transaction_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    index("credit_transaction_wallet_id_idx").using(
      "btree",
      table.walletId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "credit_transaction_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.walletId],
      foreignColumns: [creditWallet.id],
      name: "credit_transaction_wallet_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [payment.id],
      name: "credit_transaction_payment_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.tryOnId],
      foreignColumns: [tryOn.id],
      name: "credit_transaction_try_on_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const creditWallet = pgTable(
  "credit_wallet",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    balance: integer().default(0).notNull(),
    totalPurchased: integer("total_purchased").default(0).notNull(),
    totalUsed: integer("total_used").default(0).notNull(),
    totalBonus: integer("total_bonus").default(0).notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
  },
  (table) => [
    index("credit_wallet_balance_idx").using(
      "btree",
      table.balance.asc().nullsLast().op("int4_ops")
    ),
    index("credit_wallet_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("credit_wallet_user_id_key").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "credit_wallet_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const styleTip = pgTable(
  "style_tip",
  {
    id: text().primaryKey().notNull(),
    tryOnId: text("try_on_id").notNull(),
    category: text().notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.tryOnId],
      foreignColumns: [tryOn.id],
      name: "style_tip_try_on_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const tryOn = pgTable(
  "try_on",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    bodyProfileId: text("body_profile_id").notNull(),
    garmentId: text("garment_id").notNull(),
    status: text().default("pending").notNull(),
    jobId: text("job_id"),
    processingMs: integer("processing_ms"),
    confidenceScore: doublePrecision("confidence_score"),
    errorMessage: text("error_message"),
    isFavorite: boolean("is_favorite").default(false).notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    completedAt: timestamp("completed_at", { precision: 3, mode: "date" }),
    backPhotoId: text("back_photo_id"),
    frontPhotoId: text("front_photo_id"),
    resultId: text("result_id"),
  },
  (table) => [
    uniqueIndex("try_on_back_photo_id_key").using(
      "btree",
      table.backPhotoId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("try_on_front_photo_id_key").using(
      "btree",
      table.frontPhotoId.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("try_on_result_id_key").using(
      "btree",
      table.resultId.asc().nullsLast().op("text_ops")
    ),
    index("try_on_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("text_ops")
    ),
    index("try_on_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "try_on_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.bodyProfileId],
      foreignColumns: [bodyProfile.id],
      name: "try_on_body_profile_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.garmentId],
      foreignColumns: [garment.id],
      name: "try_on_garment_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
    foreignKey({
      columns: [table.frontPhotoId],
      foreignColumns: [file.id],
      name: "try_on_front_photo_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.backPhotoId],
      foreignColumns: [file.id],
      name: "try_on_back_photo_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.resultId],
      foreignColumns: [file.id],
      name: "try_on_result_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const lookbookItem = pgTable(
  "lookbook_item",
  {
    id: text().primaryKey().notNull(),
    lookbookId: text("lookbook_id").notNull(),
    tryOnId: text("try_on_id").notNull(),
    order: integer().default(0).notNull(),
    note: text(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("lookbook_item_lookbook_id_try_on_id_key").using(
      "btree",
      table.lookbookId.asc().nullsLast().op("text_ops"),
      table.tryOnId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.lookbookId],
      foreignColumns: [lookbook.id],
      name: "lookbook_item_lookbook_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.tryOnId],
      foreignColumns: [tryOn.id],
      name: "lookbook_item_try_on_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const lookbook = pgTable(
  "lookbook",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    description: text(),
    isPublic: boolean("is_public").default(false).notNull(),
    shareSlug: text("share_slug"),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    coverId: text("cover_id"),
  },
  (table) => [
    uniqueIndex("lookbook_cover_id_key").using(
      "btree",
      table.coverId.asc().nullsLast().op("text_ops")
    ),
    index("lookbook_share_slug_idx").using(
      "btree",
      table.shareSlug.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("lookbook_share_slug_key").using(
      "btree",
      table.shareSlug.asc().nullsLast().op("text_ops")
    ),
    index("lookbook_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "lookbook_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.coverId],
      foreignColumns: [file.id],
      name: "lookbook_cover_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ]
);

export const garment = pgTable(
  "garment",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    category: text().notNull(),
    subcategory: text(),
    brand: text(),
    price: doublePrecision(),
    currency: text().default("USD").notNull(),
    retailUrl: text("retail_url"),
    colors: text().array().default(sql`'{}'::text[]`).notNull(),
    sizes: text().array().default(sql`'{}'::text[]`).notNull(),
    tags: text().array().default(sql`'{}'::text[]`).notNull(),
    metadata: jsonb().$type<Record<string, object>>(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", {
      precision: 3,
      mode: "date",
    }).notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    userId: text("user_id").notNull(),
    imageId: text("image_id").notNull(),
    maskId: text("mask_id"),
  },
  (table) => [
    index("garment_brand_idx").using(
      "btree",
      table.brand.asc().nullsLast().op("text_ops")
    ),
    index("garment_category_idx").using(
      "btree",
      table.category.asc().nullsLast().op("text_ops")
    ),
    uniqueIndex("garment_image_id_key").using(
      "btree",
      table.imageId.asc().nullsLast().op("text_ops")
    ),
    index("garment_is_public_idx").using(
      "btree",
      table.isPublic.asc().nullsLast().op("bool_ops")
    ),
    uniqueIndex("garment_mask_id_key").using(
      "btree",
      table.maskId.asc().nullsLast().op("text_ops")
    ),
    index("garment_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops")
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "garment_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
    foreignKey({
      columns: [table.maskId],
      foreignColumns: [file.id],
      name: "garment_mask_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.imageId],
      foreignColumns: [file.id],
      name: "garment_image_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),
  ]
);

export const file = pgTable(
  "file",
  {
    id: text().primaryKey().notNull(),
    key: text().notNull(),
    bucket: text().default("media").notNull(),
    filename: text(),
    mimeType: text("mime_type"),
    size: integer(),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { precision: 3, mode: "date" })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("file_key_key").using(
      "btree",
      table.key.asc().nullsLast().op("text_ops")
    ),
  ]
);
