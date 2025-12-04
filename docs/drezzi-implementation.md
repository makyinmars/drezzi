# Drezzi Implementation Guide

A step-by-step guide for implementing the Drezzi (Stylish AI) virtual try-on application based on the specifications in `docs/stylish-app.md`.

## Prerequisites

- Bun installed
- Docker for local PostgreSQL
- AWS credentials configured for SST deployment
- Railway account (for production PostgreSQL)
- Google Cloud account (for Gemini API)

---

## Phase 1: Project Setup & Cleanup

### 1.1 Remove Drizzle Dependencies

Remove Drizzle-related packages that are no longer needed:

```bash
bun remove drizzle-orm drizzle-kit drizzle-zod
```

Delete Drizzle-related files if they exist:

- `drizzle.config.ts`
- `src/db/migrate.ts`
- Any files in `src/db/schema/` (Drizzle schemas)

### 1.2 Update package.json Scripts

Replace the Drizzle database commands with Prisma commands:

```json
{
  "scripts": {
    "db:generate": "bunx prisma generate",
    "db:migrate": "bunx prisma migrate dev",
    "db:push": "bunx prisma db push",
    "db:seed": "bunx prisma db seed",
    "db:studio": "bunx prisma studio",
    "db:reset": "bunx prisma migrate reset"
  }
}
```

Remove these Drizzle-specific scripts:

- `db:check`
- `db:pull`
- `db:up`

### 1.3 Add New Dependencies

Install AI and AWS dependencies:

```bash
# Vercel AI SDK with Google provider
bun add ai @ai-sdk/google

# AWS SDK for S3 and SQS
bun add @aws-sdk/client-s3 @aws-sdk/client-sqs @aws-sdk/s3-request-presigner
```

### 1.4 Update SST Configuration

Update `sst.config.ts` to add S3 bucket, SQS queue, and Lambda worker.

**Reference:** See `docs/stylish-app.md` section "SST Infrastructure (sst.config.ts)" for the complete configuration including:

- `MediaBucket` - S3 bucket for images
- `TryOnQueue` - SQS queue for processing jobs
- `TryOnWorker` - Lambda function for AI processing

### 1.5 Configure Environment Variables

Add these variables to your `.env` file:

```env
# Database (Railway PostgreSQL for production)
DATABASE_URL="postgresql://..."

# Google Gemini AI
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# Vercel AI Gateway (optional)
AI_GATEWAY_API_KEY="your-gateway-key"

# Existing vars
VITE_PUBLIC_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

---

## Phase 2: Database Migration

### 2.1 Update Prisma Schema

Update `prisma/schema.prisma` with the Stylish AI models.

**Reference:** See `docs/stylish-app.md` section "Database Schema" for complete Prisma schema including:

- `BodyProfile` - User body photos and measurements
- `Garment` - Clothing catalog items
- `TryOn` - Virtual try-on results
- `Lookbook` - Collections of try-ons
- `LookbookItem` - Items within lookbooks
- `StyleTip` - AI-generated styling suggestions

**Changes to make:**

1. Remove `TodoStatus` enum
2. Remove `Todo` model
3. Add new models from spec
4. Update `User` model relations

### 2.2 Generate and Run Migration

```bash
# Generate Prisma client
bunx prisma generate

# Create migration
bunx prisma migrate dev --name stylish_ai_models

# Or push without migration (development only)
bunx prisma db push
```

### 2.3 Update Seed Script

Update `src/db/seed/main-seed.ts` to seed garment data instead of todos.

**Seed data should include:**

- Sample garments with images (jeans, shirts, etc.)
- Categories and brands
- Price information and retail URLs

### 2.4 Verify Prisma Client

The Prisma client singleton at `src/lib/prisma.ts` is already configured and can be reused.

---

## Phase 3: Backend Implementation

### 3.1 Create tRPC Routers

Create these routers in `src/trpc/routers/`:

**Reference:** See `docs/stylish-app.md` section "API Surface" for complete router definitions.

| Router   | File                           | Procedures                                                  |
| -------- | ------------------------------ | ----------------------------------------------------------- |
| Profile  | `src/trpc/routers/profile.ts`  | list, get, create, update, delete, setDefault, getUploadUrl |
| Garment  | `src/trpc/routers/garment.ts`  | list, get, categories, search                               |
| TryOn    | `src/trpc/routers/tryOn.ts`    | create, get, list, toggleFavorite, delete                   |
| Lookbook | `src/trpc/routers/lookbook.ts` | list, get, getBySlug, create, addItem, generateShareLink    |

Update `src/trpc/router.ts` to include new routers:

```typescript
import { profileRouter } from "./routers/profile";
import { garmentRouter } from "./routers/garment";
import { tryOnRouter } from "./routers/tryOn";
import { lookbookRouter } from "./routers/lookbook";

export const trpcRouter = router({
  auth: authRouter,
  profile: profileRouter,
  garment: garmentRouter,
  tryOn: tryOnRouter,
  lookbook: lookbookRouter,
});
```

### 3.2 Create Validators

Create Zod schemas in `src/validators/`:

| File                         | Schemas                                     |
| ---------------------------- | ------------------------------------------- |
| `src/validators/profile.ts`  | CreateProfileSchema, UpdateProfileSchema    |
| `src/validators/garment.ts`  | GarmentFiltersSchema                        |
| `src/validators/tryOn.ts`    | CreateTryOnSchema, TryOnFiltersSchema       |
| `src/validators/lookbook.ts` | CreateLookbookSchema, AddLookbookItemSchema |

### 3.3 Create S3 Service

Create `src/services/s3.ts` for S3 operations:

**Functionality:**

- Generate presigned upload URLs for body photos
- Generate presigned upload URLs for try-on results
- Delete objects from S3

### 3.4 Create Queue Service

Create `src/services/queue.ts` for SQS operations:

**Functionality:**

- Send try-on job to queue
- Message format for worker

### 3.5 Create Try-On Worker

Create `src/workers/try-on.ts` for AI processing.

**Reference:** See `docs/stylish-app.md` section "Worker Implementation" for complete Lambda handler including:

- Fetch input images
- Call Google Gemini Nano Banana model
- Upload result to S3
- Update database status

### 3.6 Create AI Service

Create `src/services/nano-banana.ts` for Gemini integration:

**Reference:** See `docs/stylish-app.md` section "AI Pipeline" for Vercel AI SDK integration.

---

## Phase 4: Frontend Pages

### 4.1 File Structure

Create these route files following TanStack Router conventions:

```
src/routes/
├── index.tsx                 # Landing page (update existing)
├── catalog/
│   ├── index.tsx             # Browse garments
│   └── $garmentId.tsx        # Garment detail
├── profile/
│   ├── index.tsx             # Body profiles list
│   └── new.tsx               # Create profile
├── try-on/
│   ├── index.tsx             # Try-on interface
│   └── $tryOnId.tsx          # Result view
├── lookbooks/
│   ├── index.tsx             # My lookbooks
│   └── $lookbookId.tsx       # View/edit lookbook
└── share/
    └── $slug.tsx             # Public lookbook view
```

### 4.2 Create Components

Create these component directories:

```
src/components/
├── catalog/
│   ├── garment-card.tsx
│   ├── garment-grid.tsx
│   └── garment-filters.tsx
├── profile/
│   ├── profile-form.tsx
│   ├── photo-upload.tsx
│   └── profile-card.tsx
├── try-on/
│   ├── try-on-button.tsx
│   ├── progress-indicator.tsx
│   ├── result-view.tsx
│   └── before-after-slider.tsx
└── lookbook/
    ├── lookbook-card.tsx
    ├── lookbook-grid.tsx
    └── share-dialog.tsx
```

### 4.3 Landing Page

Update `src/routes/index.tsx`:

- Hero section with demo try-on
- Feature highlights
- Call-to-action to try first look
- Sample results showcase

### 4.4 Catalog Pages

**Browse (`src/routes/catalog/index.tsx`):**

- Grid of garment cards
- Filter sidebar (category, brand, price, color)
- Search functionality
- Pagination or infinite scroll

**Detail (`src/routes/catalog/$garmentId.tsx`):**

- Large garment images
- Product details
- "Try On" button
- Add to wishlist

### 4.5 Profile Management

**List (`src/routes/profile/index.tsx`):**

- Grid of body profiles
- Default profile indicator
- Create new profile button

**Create (`src/routes/profile/new.tsx`):**

- Photo upload with guidelines
- Camera capture option
- Measurements form (optional)
- Fit preference selection

### 4.6 Try-On Interface

**Main (`src/routes/try-on/index.tsx`):**

- Profile selector
- Garment selector
- Try-on button with progress streaming
- Recent results

**Result (`src/routes/try-on/$tryOnId.tsx`):**

- Full-screen result image
- Before/after comparison slider
- Zoom and pan
- Save to lookbook
- Share options
- Try another garment

### 4.7 Lookbooks

**List (`src/routes/lookbooks/index.tsx`):**

- Grid of user's lookbooks
- Create new lookbook button

**Detail (`src/routes/lookbooks/$lookbookId.tsx`):**

- Lookbook items in order
- Drag to reorder
- Add notes
- Share settings
- Generate share link

### 4.8 Public Sharing

**View (`src/routes/share/$slug.tsx`):**

- Public lookbook display
- No authentication required
- Social sharing meta tags

---

## Phase 5: Polish & Deploy

### 5.1 Mobile Optimization

- Responsive grid layouts
- Touch-friendly interactions
- Mobile camera integration
- Optimized image loading

### 5.2 Error Handling

Create error utilities in `src/trpc/errors.ts`:

- `profileNotFound`
- `garmentNotFound`
- `tryOnFailed`
- `lookbookNotFound`
- `unauthorized`

### 5.3 Loading States

Use TanStack Query loading states:

- Skeleton loaders for lists
- Progress indicators for try-on
- Optimistic updates for favorites

### 5.4 Performance

- Image optimization (WebP, lazy loading)
- Query caching and prefetching
- Code splitting by route

### 5.5 Deployment

```bash
# Deploy to development
sst deploy

# Deploy to production
sst deploy --stage production
```

**Checklist:**

- [ ] Railway PostgreSQL database created
- [ ] Environment variables set in SST
- [ ] Google Gemini API key configured
- [ ] S3 bucket CORS configured
- [ ] Domain configured (optional)

---

## Quick Reference

### Commands

```bash
# Development
bun dev                    # Start dev server
bun typecheck              # Type check

# Database
bunx prisma studio         # Open Prisma Studio
bunx prisma migrate dev    # Run migrations
bunx prisma db seed        # Seed data

# Deploy
sst deploy                 # Deploy to AWS
sst dev                    # SST development mode
```

### Key Files

| Purpose       | Path                    |
| ------------- | ----------------------- |
| Prisma Schema | `prisma/schema.prisma`  |
| Prisma Client | `src/lib/prisma.ts`     |
| tRPC Router   | `src/trpc/router.ts`    |
| SST Config    | `sst.config.ts`         |
| Try-On Worker | `src/workers/try-on.ts` |

### Environment Variables

| Variable                       | Description                  |
| ------------------------------ | ---------------------------- |
| `DATABASE_URL`                 | PostgreSQL connection string |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API key               |
| `BETTER_AUTH_SECRET`           | Auth secret                  |
| `VITE_PUBLIC_URL`              | Public URL for client        |

---

**Specification Reference:** `docs/stylish-app.md`
**Hackathon:** Prisma Hackathon 2025
