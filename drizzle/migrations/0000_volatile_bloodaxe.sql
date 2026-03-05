-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."credit_transaction_type" AS ENUM('PURCHASE', 'USAGE', 'REFUND', 'BONUS', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."enhancement_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('GUEST', 'ADMIN');--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp(3) NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "todo" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"status" "status" DEFAULT 'NOT_STARTED' NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'GUEST' NOT NULL,
	"image" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp(3),
	"refresh_token_expires_at" timestamp(3),
	"scope" text,
	"password" text,
	"created_at" timestamp(3) NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"stripe_customer_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"credits_granted" integer NOT NULL,
	"package_id" text NOT NULL,
	"package_name" text NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "body_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Default' NOT NULL,
	"height" double precision,
	"waist" double precision,
	"hip" double precision,
	"inseam" double precision,
	"chest" double precision,
	"fit_preference" text DEFAULT 'regular' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"photo_id" text NOT NULL,
	"enhanced_photo_id" text,
	"enhancement_error" text,
	"enhancement_status" "enhancement_status"
);
--> statement-breakpoint
CREATE TABLE "credit_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wallet_id" text NOT NULL,
	"type" "credit_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"payment_id" text,
	"try_on_id" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_purchased" integer DEFAULT 0 NOT NULL,
	"total_used" integer DEFAULT 0 NOT NULL,
	"total_bonus" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "style_tip" (
	"id" text PRIMARY KEY NOT NULL,
	"try_on_id" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "try_on" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"body_profile_id" text NOT NULL,
	"garment_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"job_id" text,
	"processing_ms" integer,
	"confidence_score" double precision,
	"error_message" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"completed_at" timestamp(3),
	"back_photo_id" text,
	"front_photo_id" text,
	"result_id" text
);
--> statement-breakpoint
CREATE TABLE "lookbook_item" (
	"id" text PRIMARY KEY NOT NULL,
	"lookbook_id" text NOT NULL,
	"try_on_id" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lookbook" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"share_slug" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"cover_id" text
);
--> statement-breakpoint
CREATE TABLE "garment" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"subcategory" text,
	"brand" text,
	"price" double precision,
	"currency" text DEFAULT 'USD' NOT NULL,
	"retail_url" text,
	"colors" text[] DEFAULT '{"RAY"}',
	"sizes" text[] DEFAULT '{"RAY"}',
	"tags" text[] DEFAULT '{"RAY"}',
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp(3) NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"user_id" text NOT NULL,
	"image_id" text NOT NULL,
	"mask_id" text
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"bucket" text DEFAULT 'media' NOT NULL,
	"filename" text,
	"mime_type" text,
	"size" integer,
	"uploaded_by" text,
	"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "body_profile" ADD CONSTRAINT "body_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "body_profile" ADD CONSTRAINT "body_profile_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "body_profile" ADD CONSTRAINT "body_profile_enhanced_photo_id_fkey" FOREIGN KEY ("enhanced_photo_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."credit_wallet"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD CONSTRAINT "credit_transaction_try_on_id_fkey" FOREIGN KEY ("try_on_id") REFERENCES "public"."try_on"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "credit_wallet" ADD CONSTRAINT "credit_wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "style_tip" ADD CONSTRAINT "style_tip_try_on_id_fkey" FOREIGN KEY ("try_on_id") REFERENCES "public"."try_on"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "try_on" ADD CONSTRAINT "try_on_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "try_on" ADD CONSTRAINT "try_on_body_profile_id_fkey" FOREIGN KEY ("body_profile_id") REFERENCES "public"."body_profile"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "try_on" ADD CONSTRAINT "try_on_garment_id_fkey" FOREIGN KEY ("garment_id") REFERENCES "public"."garment"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "try_on" ADD CONSTRAINT "try_on_front_photo_id_fkey" FOREIGN KEY ("front_photo_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "try_on" ADD CONSTRAINT "try_on_back_photo_id_fkey" FOREIGN KEY ("back_photo_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "try_on" ADD CONSTRAINT "try_on_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lookbook_item" ADD CONSTRAINT "lookbook_item_lookbook_id_fkey" FOREIGN KEY ("lookbook_id") REFERENCES "public"."lookbook"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lookbook_item" ADD CONSTRAINT "lookbook_item_try_on_id_fkey" FOREIGN KEY ("try_on_id") REFERENCES "public"."try_on"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lookbook" ADD CONSTRAINT "lookbook_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "lookbook" ADD CONSTRAINT "lookbook_cover_id_fkey" FOREIGN KEY ("cover_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "garment" ADD CONSTRAINT "garment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "garment" ADD CONSTRAINT "garment_mask_id_fkey" FOREIGN KEY ("mask_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "garment" ADD CONSTRAINT "garment_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "public"."file"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "payment_created_at_idx" ON "payment" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status" enum_ops);--> statement-breakpoint
CREATE INDEX "payment_stripe_checkout_session_id_idx" ON "payment" USING btree ("stripe_checkout_session_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "payment_stripe_checkout_session_id_key" ON "payment" USING btree ("stripe_checkout_session_id" text_ops);--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payment" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "body_profile_enhanced_photo_id_key" ON "body_profile" USING btree ("enhanced_photo_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "body_profile_photo_id_key" ON "body_profile" USING btree ("photo_id" text_ops);--> statement-breakpoint
CREATE INDEX "body_profile_user_id_idx" ON "body_profile" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_created_at_idx" ON "credit_transaction" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "credit_transaction_try_on_id_type_key" ON "credit_transaction" USING btree ("try_on_id" text_ops,"type" enum_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_type_idx" ON "credit_transaction" USING btree ("type" enum_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_user_id_idx" ON "credit_transaction" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "credit_transaction_wallet_id_idx" ON "credit_transaction" USING btree ("wallet_id" text_ops);--> statement-breakpoint
CREATE INDEX "credit_wallet_balance_idx" ON "credit_wallet" USING btree ("balance" int4_ops);--> statement-breakpoint
CREATE INDEX "credit_wallet_user_id_idx" ON "credit_wallet" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "credit_wallet_user_id_key" ON "credit_wallet" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "try_on_back_photo_id_key" ON "try_on" USING btree ("back_photo_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "try_on_front_photo_id_key" ON "try_on" USING btree ("front_photo_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "try_on_result_id_key" ON "try_on" USING btree ("result_id" text_ops);--> statement-breakpoint
CREATE INDEX "try_on_status_idx" ON "try_on" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "try_on_user_id_idx" ON "try_on" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "lookbook_item_lookbook_id_try_on_id_key" ON "lookbook_item" USING btree ("lookbook_id" text_ops,"try_on_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "lookbook_cover_id_key" ON "lookbook" USING btree ("cover_id" text_ops);--> statement-breakpoint
CREATE INDEX "lookbook_share_slug_idx" ON "lookbook" USING btree ("share_slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "lookbook_share_slug_key" ON "lookbook" USING btree ("share_slug" text_ops);--> statement-breakpoint
CREATE INDEX "lookbook_user_id_idx" ON "lookbook" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "garment_brand_idx" ON "garment" USING btree ("brand" text_ops);--> statement-breakpoint
CREATE INDEX "garment_category_idx" ON "garment" USING btree ("category" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "garment_image_id_key" ON "garment" USING btree ("image_id" text_ops);--> statement-breakpoint
CREATE INDEX "garment_is_public_idx" ON "garment" USING btree ("is_public" bool_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "garment_mask_id_key" ON "garment" USING btree ("mask_id" text_ops);--> statement-breakpoint
CREATE INDEX "garment_user_id_idx" ON "garment" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "file_key_key" ON "file" USING btree ("key" text_ops);
*/