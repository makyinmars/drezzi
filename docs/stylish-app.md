# Stylish AI - Virtual Try-On Application Specifications

## Executive Summary

A mobile-first web application that lets users virtually try on clothing (starting with jeans) using AI-powered generative try-on technology. Users upload a reference photo, browse garments, and receive realistic composite images showing how clothes would look on their body.

**Target Users:** Fashion-conscious consumers who want to preview outfits before purchasing

**Core Value Proposition:** See how clothes look on YOUR body before buying, powered by state-of-the-art AI virtual try-on technology

**Hackathon:** Prisma Hackathon 2025

---

## App Name Candidates

| Name       | Rationale                                       | Domain Check |
| ---------- | ----------------------------------------------- | ------------ |
| **Drape**  | Short, memorable, evokes fabric flowing on body | drape.app    |
| **Fitly**  | Combines "fit" (clothes) + friendly suffix      | fitly.app    |
| **Tryve**  | "Try" + "vibe" mashup, modern feel              | tryve.io     |
| **Wardro** | Shortened "wardrobe", clean & brandable         | wardro.app   |
| **Looq**   | Play on "look", unique spelling                 | looq.style   |
| **Vestio** | From Latin "vestis" (garment), elegant          | vestio.app   |
| **Mirra**  | Like mirror, where you see yourself styled      | mirra.style  |
| **Silho**  | From "silhouette", minimal & elegant            | silho.app    |
| **Dressa** | Direct, feminine, fashion-forward               | dressa.co    |
| **Kloset** | Modern spelling of "closet"                     | kloset.ai    |

**Recommended**: **Drape** - One syllable, easy to say, domain-friendly, implies garment draping on your body.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [User Personas](#user-personas)
3. [Core Features](#core-features)
4. [User Flows](#user-flows)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [API Surface](#api-surface)
8. [AI Pipeline](#ai-pipeline)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Success Metrics](#success-metrics)

---

## Product Overview

### Vision

Democratize virtual try-on technology, making it accessible to everyday shoppers who want confidence in their clothing purchases without visiting physical stores.

### Mission

Eliminate the uncertainty of online clothing shopping through realistic AI-powered visualization that shows exactly how garments will look on each individual user.

### Key Differentiators

1. **Google Nano Banana AI** - State-of-the-art Gemini 2.5 Flash Image model for virtual try-on via Vercel AI Gateway
2. **Body Profile Management** - Save your measurements and photos for instant try-ons
3. **Style Intelligence** - AI-powered outfit recommendations and style tips
4. **Streaming UX** - Real-time progress updates via Vercel AI SDK streaming
5. **Social Sharing** - Create lookbooks and share outfits to social media

---

## User Personas

### Persona 1: "Confident Chloe"

- **Age:** 22-30
- **Behavior:** Shops online frequently, returns 30%+ of clothing
- **Goals:** See how clothes actually fit before buying
- **Pain Points:**
  - Can't tell how clothes will look from flat photos
  - Tired of returns and exchanges
  - Different brands fit differently
- **Needs:**
  - Realistic body-specific visualization
  - Quick try-on without registration hassle
  - Save favorite looks

### Persona 2: "Stylish Sam"

- **Age:** 25-40
- **Behavior:** Fashion enthusiast, curates outfits carefully
- **Goals:** Build cohesive wardrobes, experiment with styles
- **Pain Points:**
  - Hard to visualize outfit combinations
  - Wants to try trends without commitment
  - No way to get style feedback
- **Needs:**
  - Style recommendations
  - Outfit combination tools
  - Lookbook creation

### Persona 3: "Practical Pat"

- **Age:** 30-50
- **Behavior:** Shops occasionally, values efficiency
- **Goals:** Find clothes that fit without wasting time
- **Pain Points:**
  - Hates shopping in stores
  - Sizing varies by brand
  - Doesn't trust model photos
- **Needs:**
  - Simple, fast experience
  - Accurate fit visualization
  - Brand-specific sizing guidance

---

## Core Features

### 1. Body Profile Management

#### 1.1 Photo Upload

**Description:** Capture or upload reference photos for virtual try-on

**Features:**

- Direct camera capture (front-facing)
- Upload from gallery
- Photo guidelines overlay (pose, lighting tips)
- Auto-detection of unsuitable photos
- Crop and adjust tools
- Multiple profiles support

**Input Requirements:**

- High-resolution (1024px+ recommended)
- Front-facing, full body preferred
- Clear silhouette, minimal occlusion
- Good lighting, neutral background

**Validation:**

- Face/body detection check
- Resolution minimum (640px width)
- File size limit (10MB)
- Format support (JPG, PNG, WEBP)

#### 1.2 Measurements (Optional)

**Description:** Store body measurements for enhanced fit accuracy

**Fields:**

- Height (cm/ft-in)
- Waist (cm/in)
- Hip (cm/in)
- Inseam (cm/in)
- Chest (cm/in)
- Preferred fit style (slim, regular, relaxed)

**Features:**

- Measurement guide with visual instructions
- Unit conversion (metric/imperial)
- Auto-save as default profile

---

### 2. Garment Catalog

#### 2.1 Browse Garments

**Description:** Curated catalog of garments available for try-on

**Features:**

- Category filtering (jeans, shirts, dresses, etc.)
- Brand filtering
- Style tags (casual, formal, streetwear)
- Color filtering
- Price range filtering
- Search by name
- Sort by popularity, newest, price

**Display:**

- Grid view with garment thumbnails
- Quick-view on hover/tap
- Add to try-on queue
- Favorite/wishlist

#### 2.2 Garment Details

**Description:** Detailed view of individual garment

**Information:**

- Multiple angle photos
- Name and description
- Brand
- Price
- Available sizes
- Fabric/material
- Care instructions
- Affiliate/purchase link

**Actions:**

- Try on with selected body profile
- Add to wishlist
- Share garment

#### 2.3 Custom Garment Upload (Phase 2)

**Description:** Upload product photos from retailers

**Features:**

- URL scraping from supported retailers
- Manual image upload
- Auto-segmentation for try-on readiness
- Quality validation

---

### 3. Virtual Try-On

#### 3.1 Try-On Request

**Description:** Generate virtual try-on composite

**Input:**

- Body profile selection
- Garment selection
- Optional: Size preference

**Flow:**

1. User selects body profile
2. User selects garment
3. Tap "Try On" button
4. See streaming progress updates
5. View result composite

**Progress States:**

- Queued
- Preparing assets
- Processing alignment
- Generating composite
- Post-processing
- Complete

#### 3.2 Try-On Results

**Description:** Display generated try-on image

**Features:**

- Full-screen result view
- Before/after comparison slider
- Zoom and pan
- Multiple variants (if generated)
- Quality score indicator
- Save to gallery
- Share options
- Download high-res
- Try different garment
- Try same garment, different size

**Metadata:**

- Processing time
- Model confidence score
- Garment details
- Body profile used

#### 3.3 Try-On History

**Description:** Gallery of all generated try-ons

**Features:**

- Grid view of all results
- Filter by date, garment type
- Favorite/star best results
- Delete unwanted results
- Bulk actions (delete, export)

---

### 4. Lookbooks & Collections

#### 4.1 Lookbook Creation

**Description:** Curate collections of try-on results

**Features:**

- Create named lookbooks
- Add try-ons to lookbooks
- Reorder items
- Add notes per item
- Cover image selection
- Privacy settings (public/private)

#### 4.2 Lookbook Sharing

**Description:** Share lookbooks with others

**Features:**

- Generate shareable link
- Social media export (Instagram, Pinterest)
- Export as image collage
- Download all images as ZIP

---

### 5. Style Intelligence (Phase 2)

#### 5.1 Style Tips

**Description:** AI-generated styling suggestions

**Features:**

- Fit recommendations based on body type
- Color palette suggestions
- Complementary item recommendations
- Occasion-based outfit suggestions
- "Complete the look" suggestions

#### 5.2 Style Analysis

**Description:** Analyze user's style preferences

**Features:**

- Track favorited items
- Identify style patterns
- Personalized recommendations
- Trend alignment scoring

---

## User Flows

### Flow 1: First-Time Try-On

```
1. User lands on homepage
2. Sees hero with sample try-on demo
3. Taps "Try It Free"
4. Prompted to upload body photo
5. Reviews photo guidelines
6. Captures or selects photo
7. Photo validates successfully
8. Redirected to garment catalog
9. Browses jeans category
10. Selects a pair of jeans
11. Taps "Try On"
12. Sees streaming progress (5-8 seconds)
13. Views try-on result
14. Prompted to create account to save
15. Signs up (email or social)
16. Result saved to gallery
17. Explores more garments
```

**Time to first try-on:** < 2 minutes
**Success criteria:** 70% of visitors complete first try-on

### Flow 2: Returning User Quick Try-On

```
1. User opens app (logged in)
2. Lands on personalized dashboard
3. Sees "Continue where you left off"
4. Taps garment from recent views
5. Default body profile pre-selected
6. Taps "Try On"
7. Sees result in < 8 seconds
8. Saves to "Summer Outfits" lookbook
9. Taps "Try Another" for variations
```

**Time to try-on:** < 30 seconds
**Success criteria:** 80% success rate for returning users

### Flow 3: Create and Share Lookbook

```
1. User navigates to Gallery
2. Taps "Create Lookbook"
3. Names it "Date Night Options"
4. Selects 5 try-on results
5. Reorders to preference
6. Adds notes ("Love the fit!")
7. Sets to public
8. Taps "Share"
9. Copies link or posts to Instagram
10. Friend views lookbook via link
```

**Success criteria:** 30% of users create at least one lookbook

---

## Technical Architecture

### Technology Stack

**Runtime:**

- Bun

**Framework:**

- TanStack Start (file-based routing)
- React 19

**Frontend:**

- TanStack Query (data fetching)
- React Hook Form + Zod (forms)
- Tailwind CSS v4
- Shadcn/ui components
- Framer Motion (animations)

**Backend:**

- tRPC (type-safe APIs)
- **Prisma ORM** (database access)

**Database:**

- **PostgreSQL via Railway**

**AI/ML:**

- Google Gemini 2.5 Flash Image (Nano Banana) for virtual try-on
- Vercel AI Gateway (unified provider access, model routing, fallbacks)
- Vercel AI SDK with `@ai-sdk/google` (streaming, type-safe integration)

**Storage:**

- AWS S3 (via SST Bucket)
- Signed URLs for secure access

**Infrastructure:**

- SST v3 (AWS Lambda + S3 + SQS)
- AWS SQS for job queues

**Authentication:**

- Better Auth

**Code Quality:**

- Ultracite (formatting + linting)
- TypeScript strict mode

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client (TanStack Start)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Landing │  │  Catalog │  │  Try-On  │  │ Lookbook │       │
│  │   Page   │  │  Browse  │  │  Results │  │  Gallery │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ tRPC (Type-Safe)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (tRPC Routers)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   Auth   │  │ Profiles │  │ Garments │  │  TryOns  │       │
│  │  Router  │  │  Router  │  │  Router  │  │  Router  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└────────┬────────────┬──────────────┬──────────────┬─────────────┘
         │            │              │              │
         ▼            ▼              ▼              ▼
    ┌─────────┐  ┌─────────┐   ┌─────────┐   ┌──────────┐
    │ Better  │  │ Prisma  │   │   S3    │   │   SQS    │
    │  Auth   │  │ Client  │   │ Bucket  │   │  Queue   │
    └─────────┘  └────┬────┘   └─────────┘   └────┬─────┘
                      │                            │
                      ▼                            ▼
                 ┌─────────┐              ┌────────────────┐
                 │ Railway │              │  Try-On Worker │
                 │PostgreSQL│              │    (Lambda)    │
                 └─────────┘              └────────────────┘
                                                   │
                                                   ▼
                                          ┌────────────────┐
                                          │  Vercel AI     │
                                          │   Gateway      │
                                          └───────┬────────┘
                                                  │
                                                  ▼
                                          ┌────────────────┐
                                          │  Google Gemini │
                                          │  Nano Banana   │
                                          └────────────────┘
```

### SST Infrastructure (sst.config.ts)

```typescript
const bucket = new sst.aws.Bucket("MediaBucket", {
  cors: true,
  access: "public",
});

const queue = new sst.aws.Queue("TryOnQueue", {
  visibilityTimeout: "5 minutes",
});

const tryOnWorker = new sst.aws.Function("TryOnWorker", {
  handler: "src/workers/try-on.handler",
  timeout: "5 minutes",
  memory: "1024 MB",
  link: [bucket, queue],
  environment: {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY!, // Vercel AI Gateway
    DATABASE_URL: process.env.DATABASE_URL!, // Railway PostgreSQL
  },
});

queue.subscribe(tryOnWorker.arn);

new sst.aws.TanstackStart("App", {
  link: [bucket, queue],
  environment: {
    DATABASE_URL: process.env.DATABASE_URL!, // Railway PostgreSQL
  },
});
```

---

## Database Schema

### Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Railway PostgreSQL
}

// ============================================
// AUTH (Better Auth tables)
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  sessions     Session[]
  accounts     Account[]
  bodyProfiles BodyProfile[]
  tryOns       TryOn[]
  lookbooks    Lookbook[]

  @@map("user")
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("session")
}

model Account {
  id                String    @id @default(cuid())
  userId            String
  accountId         String
  providerId        String
  accessToken       String?
  refreshToken      String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope             String?
  idToken           String?
  password          String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("account")
}

model Verification {
  id         String   @id @default(cuid())
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@map("verification")
}

// ============================================
// STYLISH AI MODELS
// ============================================

model BodyProfile {
  id            String   @id @default(cuid())
  userId        String
  name          String   @default("Default")
  photoUrl      String
  photoKey      String   // S3 key
  height        Float?   // cm
  waist         Float?   // cm
  hip           Float?   // cm
  inseam        Float?   // cm
  chest         Float?   // cm
  fitPreference String   @default("regular") // slim, regular, relaxed
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tryOns TryOn[]

  @@index([userId])
  @@map("body_profile")
}

model Garment {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String   // jeans, shirt, dress, jacket, etc.
  subcategory String?  // skinny, bootcut, oversized, etc.
  brand       String?
  price       Float?
  currency    String   @default("USD")
  imageUrl    String
  imageKey    String   // S3 key
  maskUrl     String?  // segmentation mask
  retailUrl   String?  // affiliate link
  colors      String[] @default([])
  sizes       String[] @default([])
  tags        String[] @default([]) // casual, formal, streetwear
  metadata    Json?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tryOns TryOn[]

  @@index([category])
  @@index([brand])
  @@map("garment")
}

model TryOn {
  id              String    @id @default(cuid())
  userId          String
  bodyProfileId   String
  garmentId       String
  status          String    @default("pending") // pending, processing, completed, failed
  resultUrl       String?
  resultKey       String?   // S3 key
  falJobId        String?
  processingMs    Int?
  confidenceScore Float?
  errorMessage    String?
  isFavorite      Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  completedAt     DateTime?

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  bodyProfile   BodyProfile    @relation(fields: [bodyProfileId], references: [id])
  garment       Garment        @relation(fields: [garmentId], references: [id])
  lookbookItems LookbookItem[]
  styleTips     StyleTip[]

  @@index([userId])
  @@index([status])
  @@map("try_on")
}

model Lookbook {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  coverUrl    String?
  isPublic    Boolean  @default(false)
  shareSlug   String?  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items LookbookItem[]

  @@index([userId])
  @@index([shareSlug])
  @@map("lookbook")
}

model LookbookItem {
  id         String   @id @default(cuid())
  lookbookId String
  tryOnId    String
  order      Int      @default(0)
  note       String?
  createdAt  DateTime @default(now())

  lookbook Lookbook @relation(fields: [lookbookId], references: [id], onDelete: Cascade)
  tryOn    TryOn    @relation(fields: [tryOnId], references: [id], onDelete: Cascade)

  @@unique([lookbookId, tryOnId])
  @@map("lookbook_item")
}

model StyleTip {
  id        String   @id @default(cuid())
  tryOnId   String
  category  String   // fit, color, style, occasion
  content   String
  createdAt DateTime @default(now())

  tryOn TryOn @relation(fields: [tryOnId], references: [id], onDelete: Cascade)

  @@map("style_tip")
}
```

### Entity Relationships

```
User
 ├── BodyProfile (1:N) - User's body photos/measurements
 ├── TryOn (1:N) - User's try-on history
 └── Lookbook (1:N) - User's collections
      └── LookbookItem (1:N) - Try-ons in lookbook

Garment (standalone catalog)
 └── TryOn (1:N) - Used in try-ons

TryOn
 ├── BodyProfile (N:1)
 ├── Garment (N:1)
 ├── LookbookItem (1:N)
 └── StyleTip (1:N)
```

### Prisma Commands

```bash
# Generate Prisma Client
bunx prisma generate

# Push schema to Railway database
bunx prisma db push

# Create migration
bunx prisma migrate dev --name init

# Deploy migrations (production)
bunx prisma migrate deploy

# Open Prisma Studio
bunx prisma studio

# Seed database
bunx prisma db seed
```

---

## API Surface

### tRPC Routers

#### Auth Router (via Better Auth)

```
POST /api/auth/sign-up
POST /api/auth/sign-in
POST /api/auth/sign-out
GET  /api/auth/session
```

#### Profile Router

```typescript
profileRouter = {
  // Get current user's profiles
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.bodyProfile.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get single profile
  get: publicProcedure.input(z.object({ id: z.string() })).query(),

  // Create new body profile
  create: protectedProcedure
    .input(CreateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.bodyProfile.create({
        data: {
          userId: ctx.user.id,
          ...input,
        },
      });
    }),

  // Update profile
  update: protectedProcedure.input(UpdateProfileSchema).mutation(),

  // Delete profile
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(),

  // Set as default
  setDefault: protectedProcedure.input(z.object({ id: z.string() })).mutation(),

  // Get upload URL for photo
  getUploadUrl: protectedProcedure.mutation(),
};
```

#### Garment Router

```typescript
garmentRouter = {
  // List garments with filters
  list: publicProcedure
    .input(GarmentFiltersSchema)
    .query(async ({ ctx, input }) => {
      return ctx.prisma.garment.findMany({
        where: {
          isActive: true,
          category: input.category,
          brand: input.brand,
        },
        orderBy: { createdAt: "desc" },
        take: input.limit ?? 20,
        skip: input.offset ?? 0,
      });
    }),

  // Get single garment
  get: publicProcedure.input(z.object({ id: z.string() })).query(),

  // Get categories
  categories: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.garment.groupBy({
      by: ["category"],
      _count: true,
    });
    return result;
  }),

  // Search garments
  search: publicProcedure.input(z.object({ query: z.string() })).query(),
};
```

#### TryOn Router

```typescript
tryOnRouter = {
  // Create try-on job
  create: protectedProcedure
    .input(CreateTryOnSchema)
    .mutation(async ({ ctx, input }) => {
      const tryOn = await ctx.prisma.tryOn.create({
        data: {
          userId: ctx.user.id,
          bodyProfileId: input.bodyProfileId,
          garmentId: input.garmentId,
          status: "pending",
        },
      });

      // Send to SQS queue
      await sendToQueue({
        tryOnId: tryOn.id,
        bodyImageUrl: input.bodyImageUrl,
        garmentImageUrl: input.garmentImageUrl,
      });

      return tryOn;
    }),

  // Get try-on status/result
  get: protectedProcedure.input(z.object({ id: z.string() })).query(),

  // List user's try-ons
  list: protectedProcedure.input(TryOnFiltersSchema).query(),

  // Toggle favorite
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(),

  // Delete try-on
  delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(),
};
```

#### Lookbook Router

```typescript
lookbookRouter = {
  // List user's lookbooks
  list: protectedProcedure.query(),

  // Get lookbook with items
  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.lookbook.findUnique({
        where: { id: input.id },
        include: {
          items: {
            include: { tryOn: { include: { garment: true } } },
            orderBy: { order: "asc" },
          },
        },
      });
    }),

  // Get by share slug (public)
  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(),

  // Create lookbook
  create: protectedProcedure.input(CreateLookbookSchema).mutation(),

  // Add item to lookbook
  addItem: protectedProcedure.input(AddLookbookItemSchema).mutation(),

  // Generate share link
  generateShareLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(),
};
```

---

## AI Pipeline

### Google Nano Banana via Vercel AI Gateway

Google's Gemini 2.5 Flash Image model (codenamed "Nano Banana") provides state-of-the-art image generation and editing capabilities, including virtual try-on through multi-image fusion. We access it via Vercel AI Gateway for unified provider management, streaming, and fallback routing.

#### Model Details

| Property | Value |
| --- | --- |
| **Model ID** | `gemini-2.5-flash-image-preview` |
| **Provider** | Google Generative AI |
| **Capabilities** | Image generation, multi-image fusion, virtual try-on |
| **Cost** | ~$0.039/image ($30/1M output tokens, 1290 tokens/image) |
| **Watermarking** | Built-in SynthID invisible watermark |

#### Vercel AI Gateway Benefits

- **Unified Provider Access**: Single API for Google, OpenAI, Anthropic, and other providers
- **Model Routing**: Automatic fallback to alternative providers on failure
- **Streaming**: Real-time response streaming via AI SDK
- **Observability**: Built-in token usage tracking and latency metrics
- **Caching**: Response caching for cost optimization

#### Worker Implementation (src/workers/try-on.ts)

```typescript
import { Resource } from "sst";
import { google } from "@ai-sdk/google";
import { experimental_generateImage as generateImage } from "ai";
import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const prisma = new PrismaClient();

type TryOnEvent = {
  tryOnId: string;
  bodyImageUrl: string;
  garmentImageUrl: string;
};

export const handler = async (event: { Records: Array<{ body: string }> }) => {
  for (const record of event.Records) {
    const payload: TryOnEvent = JSON.parse(record.body);

    // Update status to processing
    await prisma.tryOn.update({
      where: { id: payload.tryOnId },
      data: { status: "processing" },
    });

    const startTime = Date.now();

    try {
      // Fetch input images as base64
      const [bodyImageRes, garmentImageRes] = await Promise.all([
        fetch(payload.bodyImageUrl),
        fetch(payload.garmentImageUrl),
      ]);

      const bodyImageBuffer = await bodyImageRes.arrayBuffer();
      const garmentImageBuffer = await garmentImageRes.arrayBuffer();

      const bodyImageBase64 = Buffer.from(bodyImageBuffer).toString("base64");
      const garmentImageBase64 = Buffer.from(garmentImageBuffer).toString("base64");

      // Call Google Nano Banana (Gemini 2.5 Flash Image) via Vercel AI SDK
      const result = await generateImage({
        model: google.image("gemini-2.5-flash-image-preview"),
        prompt: `Virtual try-on: Place the garment from the second image onto the person in the first image.
                 Preserve the person's pose, body shape, and facial features exactly.
                 The garment should drape naturally and realistically on their body.
                 Maintain proper lighting, shadows, and fabric physics.`,
        providerOptions: {
          google: {
            responseModalities: ["IMAGE"],
            // Include reference images for multi-image fusion
            inlineData: [
              { mimeType: "image/jpeg", data: bodyImageBase64 },
              { mimeType: "image/jpeg", data: garmentImageBase64 },
            ],
          },
        },
      });

      const processingMs = Date.now() - startTime;

      // Get the generated image
      const generatedImage = result.image;
      const imageBuffer = Buffer.from(generatedImage.base64, "base64");

      // Upload to S3
      const s3 = new S3Client({});
      const resultKey = `try-ons/${payload.tryOnId}/result.png`;

      await s3.send(
        new PutObjectCommand({
          Bucket: Resource.MediaBucket.name,
          Key: resultKey,
          Body: imageBuffer,
          ContentType: "image/png",
        }),
      );

      const resultUrl = `https://${Resource.MediaBucket.name}.s3.amazonaws.com/${resultKey}`;

      // Update with result
      await prisma.tryOn.update({
        where: { id: payload.tryOnId },
        data: {
          status: "completed",
          resultUrl,
          resultKey,
          processingMs,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.tryOn.update({
        where: { id: payload.tryOnId },
        data: {
          status: "failed",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }
};
```

#### Streaming Try-On with Real-Time Progress (src/services/try-on-stream.ts)

For real-time progress updates in the UI, use the Vercel AI SDK streaming capabilities:

```typescript
import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const streamTryOnAnalysis = async (tryOnResultUrl: string) => {
  // Stream style analysis and recommendations for the try-on result
  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image: tryOnResultUrl },
          {
            type: "text",
            text: `Analyze this virtual try-on result and provide:
                   1. Fit assessment (how well the garment suits the body type)
                   2. Style tips for this look
                   3. Complementary items to complete the outfit
                   4. Occasions this outfit would be perfect for`,
          },
        ],
      },
    ],
  });

  return result;
};
```

#### Latency Targets

| Stage | Target | Stretch |
| --- | --- | --- |
| Queue to start | < 2s | < 500ms |
| Nano Banana inference | < 5s | < 3s |
| Post-processing | < 1s | < 500ms |
| **Total** | **< 8s** | **< 4s** |

---

## Implementation Roadmap

### Phase 1: MVP Foundation (Days 1-2)

#### Day 1: Project Setup & Core Infrastructure

| Task             | Details                             |
| ---------------- | ----------------------------------- |
| Project scaffold | Create new TanStack Start project   |
| Prisma setup     | Schema, Railway connection          |
| SST config       | S3 bucket, SQS queue, Lambda worker |
| Auth setup       | Better Auth with email/social       |
| Base UI          | Landing page, navigation, layout    |

**Commands:**

```bash
# Initialize Prisma
bunx prisma init

# Create Railway PostgreSQL and get connection string
# Add to .env: DATABASE_URL="postgresql://..."

# Push schema
bunx prisma db push

# Generate client
bunx prisma generate
```

#### Day 2: Core Try-On Flow

| Task                | Details                          |
| ------------------- | -------------------------------- |
| Body profile upload | S3 presigned URLs, photo capture |
| Garment catalog     | Seed data, list/filter UI        |
| Nano Banana + Vercel AI | Worker + queue + streaming    |
| Try-on UI           | Request flow, progress streaming |
| Results display     | Gallery, favorites               |

### Phase 2: Polish & Features (Days 3-4)

#### Day 3: UX Enhancement

| Task                | Details                     |
| ------------------- | --------------------------- |
| Streaming progress  | Real-time status updates    |
| Before/after slider | Compare body vs result      |
| Lookbook creation   | Save collections            |
| Share functionality | Public links, social export |

#### Day 4: Demo Ready

| Task                | Details                        |
| ------------------- | ------------------------------ |
| Landing page polish | Hero, demo, testimonials       |
| Mobile optimization | Touch-friendly, responsive     |
| Error handling      | Graceful failures, retry logic |
| Seed demo data      | Garments, sample try-ons       |
| Deploy production   | Final SST deploy               |

---

## File Structure

```
drape/
├── prisma/
│   ├── schema.prisma           # Prisma schema
│   ├── seed.ts                 # Seed data
│   └── migrations/             # Migration files
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx           # Landing page
│   │   ├── catalog/
│   │   │   ├── index.tsx       # Browse garments
│   │   │   └── $garmentId.tsx  # Garment detail
│   │   ├── try-on/
│   │   │   ├── index.tsx       # Try-on interface
│   │   │   └── $tryOnId.tsx    # Result view
│   │   ├── profile/
│   │   │   ├── index.tsx       # Body profiles
│   │   │   └── new.tsx         # Create profile
│   │   ├── lookbooks/
│   │   │   ├── index.tsx       # My lookbooks
│   │   │   └── $lookbookId.tsx # View lookbook
│   │   ├── share/
│   │   │   └── $slug.tsx       # Public lookbook view
│   │   └── api/
│   │       └── trpc/
│   │           └── [...trpc].ts
│   ├── trpc/
│   │   ├── router.ts
│   │   └── routers/
│   │       ├── profile.ts
│   │       ├── garment.ts
│   │       ├── tryOn.ts
│   │       └── lookbook.ts
│   ├── db/
│   │   └── index.ts            # Prisma client export
│   ├── components/
│   │   ├── ui/                 # Shadcn components
│   │   ├── catalog/
│   │   ├── try-on/
│   │   ├── profile/
│   │   └── lookbook/
│   ├── services/
│   │   ├── nano-banana.ts      # Google Nano Banana client via Vercel AI SDK
│   │   ├── try-on-stream.ts    # Streaming try-on analysis
│   │   ├── s3.ts               # S3 operations
│   │   └── queue.ts            # SQS operations
│   ├── workers/
│   │   └── try-on.ts           # Lambda worker
│   └── lib/
│       ├── prisma.ts           # Prisma client singleton
│       └── utils.ts
├── sst.config.ts
├── package.json
└── .env                        # DATABASE_URL, GOOGLE_GENERATIVE_AI_API_KEY, AI_GATEWAY_API_KEY
```

### Prisma Client Singleton (src/lib/prisma.ts)

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

---

## Success Metrics

### Hackathon Judging Criteria

| Criteria                | How We Excel                                     |
| ----------------------- | ------------------------------------------------ |
| **Prisma Usage**        | Full schema, relations, queries, Prisma Studio   |
| **Innovation**          | Novel use of VTO AI for consumer fashion         |
| **Technical Execution** | Full-stack type safety, streaming UX, serverless |
| **User Experience**     | Mobile-first, sub-8s renders, intuitive flow     |
| **Completeness**        | End-to-end: upload → try-on → save → share       |

### KPIs (Post-Hackathon)

**Engagement:**

- First try-on completion rate: > 70%
- Average try-ons per user: > 5
- Return user rate (7-day): > 40%

**Performance:**

- P95 try-on latency: < 10s
- Error rate: < 2%
- Mobile Lighthouse score: > 90

---

## Cost Estimates

### Railway PostgreSQL

| Tier          | Cost       |
| ------------- | ---------- |
| Hobby         | $5/month   |
| Pro           | $20/month  |
| **Hackathon** | Free trial |

### Google Nano Banana (Gemini 2.5 Flash Image) Pricing

| Tier | Cost | Volume |
| --- | --- | --- |
| Free tier | $0 | Limited API credits |
| Per-image cost | ~$0.039/image | 1,290 tokens/image @ $30/1M tokens |
| Hackathon estimate | ~$40 | 1,000 demo renders |

### Vercel AI Gateway

| Tier | Cost | Notes |
| --- | --- | --- |
| Hobby | $0 | Included with Vercel account |
| Pro | $20/month | Enhanced observability |
| **Hackathon** | Free | Hobby tier sufficient |

### AWS (via SST)

| Resource | Estimate |
| --- | --- |
| Lambda | Free tier covers demo |
| S3 | < $5/month |
| SQS | Free tier covers demo |

### Total Hackathon Budget: ~$50-75

---

**Document Version:** 1.1
**Created:** December 3, 2025
**Updated:** December 3, 2025 - Migrated from FAL.ai to Google Nano Banana via Vercel AI Gateway
**Stack:** TanStack Start + Prisma + Railway + Google Nano Banana + Vercel AI Gateway + SST
**Status:** Ready for Implementation
