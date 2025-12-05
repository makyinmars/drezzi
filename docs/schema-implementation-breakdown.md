# Drezzi Schema Implementation Breakdown

## Progress Tracker

| Step | Task | Status |
|------|------|--------|
| 1 | Prisma schema (User relations + 6 models) | ✅ Complete |
| 2 | Infrastructure (SST bucket, queue, worker) | ✅ Complete |
| 3 | Validators & tRPC routers | ✅ Complete (BodyProfile ✅, Garment ✅, TryOn ✅, Lookbook ✅, StyleTip ✅) |
| 4 | Services (S3, queue, style-tip, lookbook) | ✅ Complete (BodyProfile ✅, Garment ✅, TryOn ✅, Lookbook ✅, StyleTip ✅) |
| 5 | Components & Routes | ✅ Complete (BodyProfile ✅, Garment ✅, TryOn ✅, Lookbook ✅, StyleTip ✅) |
| 6 | Remove Todo references | ⬜ Pending |

### Step 2 Completed Items

- [x] `TryOnQueue` SQS queue in `sst.config.ts`
- [x] `TryOnWorker` Lambda with explicit `sst.aws.Function` pattern
- [x] IAM permissions for S3 (`GetObject`, `PutObject`) and SQS
- [x] Worker implementation with Gemini 3 Pro (`gemini-3-pro-image-preview`)
- [x] SQS utility at `src/lib/sqs.ts` with `enqueueTryOnJob()`
- [x] Environment variables in `src/env/server.ts` (`GOOGLE_GENERATIVE_AI_API_KEY`, `AI_GATEWAY_API_KEY`)
- [x] Dependencies: `ai@5.0.106`, `@ai-sdk/google@2.0.44`, `@aws-sdk/client-sqs@3.943.0`
- [x] TanStackStart app linked to bucket + queue

### Step 4 Partial Progress

- [x] `src/lib/sqs.ts` - SQS client and `enqueueTryOnJob()` utility
- [x] `src/services/profile.ts` - S3 upload utilities, setDefault, deleteAssets, getPhotoUrl ✅
- [x] `src/validators/profile.ts` - All validators complete ✅
- [x] `src/trpc/routers/profile.ts` - All 7 endpoints (list, byId, create, update, delete, setDefault, getUploadUrl) ✅
- [x] `src/components/profile/*` - form, card, delete, photo-upload ✅
- [x] `src/screens/profile/*` - index, new, profile-id ✅
- [x] `src/routes/(authed)/profile/*` - All 3 routes ✅
- [x] `src/services/try-on.ts` - updateTryOnResult(), getTryOnResultUrl(), deleteTryOnAssets() ✅
- [x] `src/validators/try-on.ts` - All validators complete ✅
- [x] `src/trpc/routers/tryOn.ts` - All 8 endpoints (list, byId, create, toggleFavorite, delete, retry, favorites, recent) ✅
- [x] `src/components/try-on/*` - form, card, delete, progress ✅
- [x] `src/screens/try-on/*` - index, try-on-id ✅
- [x] `src/routes/(authed)/try-on/*` - All 2 routes ✅
- [x] `src/services/garment.ts` - garment upload/delete/getUrl helpers ✅
- [x] `src/validators/garment.ts` - All validators complete ✅
- [x] `src/trpc/routers/garment.ts` - All 9 endpoints (list, publicList, byId, create, update, delete, togglePublic, getUploadUrl, categories) ✅
- [x] `src/components/garment/*` - form, card, delete, image-upload ✅
- [x] `src/screens/garment/*` - index, new, garment-id ✅
- [x] `src/routes/(authed)/garment/*` - All 3 routes ✅
- [x] `src/config/navigation.tsx` - "My Wardrobe" nav item with sub-items ✅
- [x] `src/services/lookbook.ts` - share slug, S3 cover upload, reorder helpers ✅
- [x] `src/validators/lookbook.ts` - All validators complete ✅
- [x] `src/trpc/routers/lookbook.ts` - All 14 endpoints (list, byId, bySlug, create, update, delete, addItem, removeItem, updateItemNote, reorderItems, generateShareLink, togglePublic, getCoverUploadUrl, availableTryOns) ✅
- [x] `src/components/lookbook/*` - form, card, delete, item, share-dialog, add-tryon-dialog ✅
- [x] `src/screens/lookbooks/*` - index, lookbook-id ✅
- [x] `src/screens/share/share-slug.tsx` - public lookbook view ✅
- [x] `src/routes/(authed)/lookbooks/*` - All 2 routes ✅
- [x] `src/routes/shared/lookbook/$slug.tsx` - Public share route ✅
- [x] `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` - Drag-and-drop dependencies ✅
- [x] `src/services/style-tip.ts` - AI style tip generation with Gemini 2.5 Flash ✅
- [x] `src/validators/style-tip.ts` - All validators complete ✅
- [x] `src/trpc/routers/style-tip.ts` - All 5 endpoints (byTryOnId, create, update, delete, regenerate) ✅
- [x] `src/components/style-tip/*` - card, form, delete ✅
- [x] `src/workers/try-on.ts` - Auto-generates style tips after try-on completion ✅

---

## Overview

Replacing the template Todo stack with the Stylish AI virtual try-on domain introduces six new Prisma models plus updated `User` relations. This document maps each model to its Prisma definition, tRPC router shape, validation, services, UI components, TanStack Router pages, and i18n-aware error handlers so implementation can follow the established Todo patterns (`src/trpc/routers/todo.ts`, `src/validators/todo.ts`, `src/components/todo/*`).

## Screen File Pattern

- Follow the dashboard convention: screens live in `src/screens/...` and routes import them via `lazyRouteComponent` (e.g., `src/routes/(authed)/dashboard/index.tsx` → `src/screens/dashboard/index.tsx`).
- Name detail screens with `*-id.tsx` under a folder matching the domain. Example: garment detail at `src/screens/garment/garment-id.tsx` imported by `src/routes/(authed)/catalog/garment/$garmentId.tsx`.
- Keep list/create/detail screens colocated per domain to simplify lazy loading and testing.

## Infrastructure Requirements ✅ COMPLETE

All infrastructure has been implemented in `sst.config.ts`:

| Resource | Type | Status |
|----------|------|--------|
| `MediaBucket` | `sst.aws.Bucket` | ✅ Pre-existing (CORS, versioning, lifecycle) |
| `TryOnQueue` | `sst.aws.Queue` | ✅ Added (5min visibility timeout) |
| `TryOnWorker` | `sst.aws.Function` | ✅ Added (nodejs20.x, 5min timeout, 1024MB) |

### Worker Configuration

```typescript
// sst.config.ts - TryOnWorker
new sst.aws.Function("TryOnWorker", {
  handler: "src/workers/try-on.handler",
  runtime: "nodejs20.x",
  timeout: "5 minutes",
  memory: "1024 MB",
  link: [bucket],
  environment: {
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
  permissions: [
    { actions: ["s3:GetObject", "s3:PutObject"], resources: [bucket.arn, ...] },
    { actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", ...], resources: [queue.arn] },
  ],
});
queue.subscribe(tryOnWorker.arn);
```

### Worker Implementation (`src/workers/try-on.ts`)

- Processes SQS messages with `{ tryOnId, bodyImageUrl, garmentImageUrl }`
- Fetches images from S3 or URLs, converts to base64
- Calls `gemini-3-pro-image-preview` via Vercel AI SDK
- Uploads result to `try-ons/{tryOnId}/result.png`
- TODO: Database update after completion

### Environment Variables Added

- `GOOGLE_GENERATIVE_AI_API_KEY` (optional) - for Gemini API
- `AI_GATEWAY_API_KEY` (optional) - for AI Gateway routing

## Model 1: BodyProfile

### Prisma Schema

```prisma
model BodyProfile {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  name          String   @default("Default")
  photoUrl      String   @map("photo_url")
  photoKey      String   @map("photo_key")
  height        Float?                         // cm
  waist         Float?                         // cm
  hip           Float?                         // cm
  inseam        Float?                         // cm
  chest         Float?                         // cm
  fitPreference String   @default("regular") @map("fit_preference")
  isDefault     Boolean  @default(false) @map("is_default")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tryOns TryOn[]

  @@index([userId])
  @@map("body_profile")
}
```

### tRPC Router (`src/trpc/routers/profile.ts`)

- `list` (protected): return current user's profiles ordered by `createdAt desc`.
- `get`: fetch by `id` with user scoping.
- `create`: create profile for `ctx.session.user.id`.
- `update`: patch allowed fields; ensure ownership.
- `delete`: delete by id (and optionally cascade S3 cleanup via service).
- `setDefault`: clear other `isDefault` for user then set target.
- `getUploadUrl`: return presigned S3 URL + key for `photoKey`.

### Validators (`src/validators/profile.ts`)

- `apiBodyProfileId` (`id: z.string().cuid()`).
- `apiBodyProfileCreate`: name, photoUrl/key, optional measurements, `fitPreference`, `isDefault`.
- `apiBodyProfileUpdate`: `id` + partials for measurements/fit/default/photo.
- `apiBodyProfileCreateAndUpdate`: form schema for RHF with defaults.
- `apiProfileUploadRequest`: optional file metadata (mime/size) if needed for S3 service.

### Services (`src/services/profile.ts`)

- `getProfileUploadUrl(userId)`: call S3 presigner and return `{ url, fields, key }`.
- `setDefaultProfile(userId, profileId)`: transactional update clearing previous default.
- Optional `deleteProfileAssets(photoKey)` to purge S3 on delete.

### Components

- `src/components/profile/profile-form.tsx`: RHF + `zodResolver`, create/update, optimistic `trpc.profile.list` updates.
- `src/components/profile/profile-card.tsx`: displays photo/measurements, default badge, actions.
- `src/components/profile/photo-upload.tsx`: handles presigned upload, preview, validation.
- `src/components/profile/profile-delete.tsx`: AlertDialog wrapper mirroring Todo delete pattern.

### Screens

- `src/screens/profile/index.tsx`: list + create CTA.
- `src/screens/profile/new.tsx`: create flow with guidelines.
- `src/screens/profile/profile-id.tsx`: detail/edit, set default, delete.

### Routes

- `src/routes/profile/index.tsx`: list + create CTA; use `profile-form`.
- `src/routes/profile/new.tsx`: dedicated create flow with guidelines overlay.
- `src/routes/profile/$profileId.tsx`: detail/edit, set default, delete.

### Errors to Add

- `profileNotFound`, `profileForbidden`, `profileCreateFailed`, `profileUpdateFailed`, `profileDeleteFailed`, `profileUploadFailed`, `invalidProfileImage`.

## Model 2: Garment

### Prisma Schema

```prisma
model Garment {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String
  subcategory String?
  brand       String?
  price       Float?
  currency    String   @default("USD")
  imageUrl    String   @map("image_url")
  imageKey    String   @map("image_key")
  maskUrl     String?  @map("mask_url")
  retailUrl   String?  @map("retail_url")
  colors      String[] @default([])
  sizes       String[] @default([])
  tags        String[] @default([])
  metadata    Json?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tryOns TryOn[]

  @@index([category])
  @@index([brand])
  @@map("garment")
}
```

### tRPC Router (`src/trpc/routers/garment.ts`)

- `list` (public): filters for `category`, `brand`, `tags`, `colors`, `sizes`, `price range`, pagination.
- `get` (public): fetch by `id`.
- `categories` (public): grouped counts by category.
- `search` (public): text search on `name`/`tags`.
- Admin-only (if needed): `create`, `update`, `delete`, `getUploadUrl` for image/mask keys via `protectedProcedure`.

### Validators (`src/validators/garment.ts`)

- `apiGarmentId`: `id: z.string().cuid()`.
- `apiGarmentFilters`: pagination + optional filters (arrays for tags/colors/sizes, numeric price bounds).
- `apiGarmentCreate`: required `name/category/imageUrl/imageKey`, optional `description/subcategory/brand/price/currency/maskUrl/retailUrl/colors/sizes/tags/metadata/isActive`.
- `apiGarmentUpdate`: `id` + partials.

### Services (`src/services/garment.ts`)

- `getGarmentUploadUrl(kind: "image" | "mask")` using S3 presigner.
- `searchGarments(filters)` encapsulating Prisma queries.
- Optional `seedGarments()` used by seed script.

### Components

- `src/components/garment/garment-form.tsx`: admin create/update with RHF + presigned upload.
- `src/components/garment/garment-card.tsx`: grid card with tags, price, CTA.
- `src/components/garment/garment-list.tsx`: list/grid wrapper with filters + skeletons.
- `src/components/garment/garment-detail.tsx`: media gallery, metadata, try-on CTA.
- `src/components/garment/garment-delete.tsx`: delete dialog for admin.

### Screens

- `src/screens/catalog/index.tsx` or `src/screens/garment/index.tsx`: browse/filter grid (match chosen folder naming).
- `src/screens/garment/garment-id.tsx`: garment detail used by `src/routes/(authed)/catalog/garment/$garmentId.tsx`.

### Routes

- `src/routes/catalog/index.tsx`: browse/filter garments.
- `src/routes/catalog/$garmentId.tsx`: garment detail, try-on CTA.
- `src/routes/catalog/new.tsx` (optional admin).

### Errors to Add

- `garmentNotFound`, `garmentCreateFailed`, `garmentUpdateFailed`, `garmentDeleteFailed`, `garmentUploadFailed`, `invalidGarmentFilter`.

## Model 3: TryOn

### Prisma Schema

```prisma
model TryOn {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  bodyProfileId   String    @map("body_profile_id")
  garmentId       String    @map("garment_id")
  status          String    @default("pending")
  resultUrl       String?   @map("result_url")
  resultKey       String?   @map("result_key")
  jobId           String?   @map("job_id") // external/queue job id
  processingMs    Int?      @map("processing_ms")
  confidenceScore Float?    @map("confidence_score")
  errorMessage    String?   @map("error_message")
  isFavorite      Boolean   @default(false) @map("is_favorite")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  completedAt     DateTime? @map("completed_at")

  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  bodyProfile   BodyProfile    @relation(fields: [bodyProfileId], references: [id])
  garment       Garment        @relation(fields: [garmentId], references: [id])
  lookbookItems LookbookItem[]
  styleTips     StyleTip[]

  @@index([userId])
  @@index([status])
  @@map("try_on")
}
```

### tRPC Router (`src/trpc/routers/tryOn.ts`)

- `create` (protected): validate ownership of `bodyProfileId`, enqueue SQS job via service, return pending try-on.
- `get` (protected): fetch by id scoped to user, include garment/profile/styleTips.
- `list` (protected): filter by `status`, `isFavorite`, date range, garment category; paginate.
- `toggleFavorite` (protected): flip `isFavorite`.
- `delete` (protected): delete try-on and optionally purge S3 `resultKey`.
- `retry` (protected, optional): re-enqueue failed try-on with same payload.
- Worker-facing helper (internal) can reuse validators/services to mark `processing/completed/failed`.

### Validators (`src/validators/try-on.ts`)

- `apiTryOnId`: `id: z.string().cuid()`.
- `apiTryOnCreate`: `bodyProfileId`, `garmentId`, optional `sizePreference`, optional source URLs if needed by worker.
- `apiTryOnFilters`: pagination + `status`, `isFavorite`, `dateFrom/dateTo`, `garmentCategory`.
- `apiTryOnStatusUpdate` (optional internal): `id`, `status`, `resultUrl`, `resultKey`, `processingMs`, `confidenceScore`, `errorMessage`.

### Services (`src/services/try-on.ts`)

- `enqueueTryOn({ tryOnId, bodyImageUrl, garmentImageUrl })`: publish to `TryOnQueue`.
- `updateTryOnResult(tryOnId, payload)`: used by worker for success/failure.
- `streamTryOnAnalysis(resultUrl)`: wrapper around `src/services/try-on-stream.ts`.

### Components

- `src/components/try-on/try-on-form.tsx`: select profile + garment, submit mutation with optimistic placeholder card.
- `src/components/try-on/try-on-card.tsx`: displays status, progress, favorite toggle.
- `src/components/try-on/try-on-detail.tsx`: result viewer with before/after slider, tips panel.
- `src/components/try-on/try-on-delete.tsx`: delete dialog mirroring Todo pattern.
- `src/components/try-on/progress-indicator.tsx`: streaming status updates.

### Screens

- `src/screens/try-on/index.tsx`: main flow with selectors and recent results.
- `src/screens/try-on/try-on-id.tsx`: detail/result view with slider, tips, share/favorite.

### Routes

- `src/routes/try-on/index.tsx`: main try-on flow, recent results grid.
- `src/routes/try-on/$tryOnId.tsx`: detail view with share/save/favorite/tips.

### Errors to Add

- `tryOnNotFound`, `tryOnCreateFailed`, `tryOnForbidden`, `tryOnDeleteFailed`, `tryOnEnqueueFailed`, `tryOnStatusInvalid`.

## Model 4: Lookbook

### Prisma Schema

```prisma
model Lookbook {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  name        String
  description String?
  coverUrl    String?  @map("cover_url")
  isPublic    Boolean  @default(false) @map("is_public")
  shareSlug   String?  @unique @map("share_slug")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items LookbookItem[]

  @@index([userId])
  @@index([shareSlug])
  @@map("lookbook")
}
```

### tRPC Router (`src/trpc/routers/lookbook.ts`)

- `list` (protected): list user's lookbooks with item counts.
- `get` (protected): fetch by id with ordered items + nested tryOn/garment for editing.
- `getBySlug` (public): fetch public view by `shareSlug` with `isPublic` guard.
- `create` (protected): create lookbook.
- `update` (protected): rename/update description/cover/isPublic.
- `delete` (protected): delete lookbook and cascade items.
- `addItem` (protected): add `tryOnId` with optional note/order; prevents duplicates.
- `removeItem` (protected): delete item by id.
- `reorderItems` (protected): batch update `order`.
- `generateShareLink` (protected): generate unique slug and mark `isPublic=true`.

### Validators (`src/validators/lookbook.ts`)

- `apiLookbookId`: `id: z.string().cuid()`.
- `apiLookbookCreate`: `name`, optional `description/coverUrl/isPublic`.
- `apiLookbookUpdate`: `id` + optional fields above.
- `apiLookbookItemCreate`: `lookbookId`, `tryOnId`, optional `note`, optional `order`.
- `apiLookbookItemReorder`: array of `{ id: cuid, order: int }`.
- `apiLookbookSlug`: `slug: z.string().min(1)`.

### Services (`src/services/lookbook.ts`)

- `generateShareSlug(name)`: slugify + ensure uniqueness.
- `reorderLookbookItems` (transactional).
- `removeLookbookAssets(coverKey?)` if cover stored in S3.

### Components

- `src/components/lookbook/lookbook-form.tsx`: create/edit with cover upload + privacy toggle.
- `src/components/lookbook/lookbook-card.tsx`: summary card with item count.
- `src/components/lookbook/lookbook-detail.tsx`: draggable list using `LookbookItem` components.
- `src/components/lookbook/lookbook-delete.tsx`: delete dialog.
- `src/components/lookbook/share-dialog.tsx`: copy link, toggle public.
- `src/components/lookbook/lookbook-item.tsx`: renders an item with note edit + remove.

### Screens

- `src/screens/lookbooks/index.tsx`: list/create.
- `src/screens/lookbooks/lookbook-id.tsx`: manage items, reorder, share.
- `src/screens/share/share-slug.tsx`: public view.

### Routes

- `src/routes/lookbooks/index.tsx`: list + create.
- `src/routes/lookbooks/$lookbookId.tsx`: manage items, reorder, share.
- `src/routes/share/$slug.tsx`: public, read-only view.

### Errors to Add

- `lookbookNotFound`, `lookbookForbidden`, `lookbookCreateFailed`, `lookbookUpdateFailed`, `lookbookDeleteFailed`, `lookbookShareFailed`, `lookbookItemExists`.

## Model 5: LookbookItem

### Prisma Schema

```prisma
model LookbookItem {
  id         String   @id @default(cuid())
  lookbookId String   @map("lookbook_id")
  tryOnId    String   @map("try_on_id")
  order      Int      @default(0)
  note       String?
  createdAt  DateTime @default(now()) @map("created_at")

  lookbook Lookbook @relation(fields: [lookbookId], references: [id], onDelete: Cascade)
  tryOn    TryOn    @relation(fields: [tryOnId], references: [id], onDelete: Cascade)

  @@unique([lookbookId, tryOnId])
  @@map("lookbook_item")
}
```

### tRPC Router (`src/trpc/routers/lookbook-item.ts` or within `lookbook.ts`)

- `add` (protected): create item (likely implemented as `lookbook.addItem`).
- `updateNote` (protected): update `note` or `order`.
- `remove` (protected): delete by id.
- `reorder` (protected): batch order update (can reuse lookbook route).

### Validators (`src/validators/lookbook-item.ts`)

- `apiLookbookItemId`: `id: z.string().cuid()`.
- `apiLookbookItemCreate`: `lookbookId`, `tryOnId`, optional `note`, optional `order`.
- `apiLookbookItemUpdate`: `id` + partial `note/order`.

### Services (`src/services/lookbook-item.ts`)

- `ensureUniqueItem(lookbookId, tryOnId)`.
- `batchReorder(items: { id; order }[])`.

### Components

- `src/components/lookbook/lookbook-item-card.tsx`: renders try-on thumbnail + note + remove.
- `src/components/lookbook/lookbook-item-delete.tsx`: delete dialog for item.
- `src/components/lookbook/lookbook-item-note-form.tsx`: inline note editor.

### Screens

- Managed via lookbook screens: `src/screens/lookbooks/lookbook-id.tsx` renders and manipulates items (no standalone screen).

### Routes

- Managed inside `lookbooks/$lookbookId.tsx` (no standalone page).

### Errors to Add

- `lookbookItemNotFound`, `lookbookItemDuplicate`, `lookbookItemUpdateFailed`, `lookbookItemDeleteFailed`.

## Model 6: StyleTip

### Prisma Schema

```prisma
model StyleTip {
  id        String   @id @default(cuid())
  tryOnId   String   @map("try_on_id")
  category  String
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  tryOn TryOn @relation(fields: [tryOnId], references: [id], onDelete: Cascade)

  @@map("style_tip")
}
```

### tRPC Router (`src/trpc/routers/style-tip.ts`)

- `listByTryOn` (protected): fetch tips for a try-on (scoped to user via tryOn.userId).
- `create` (protected/internal): add AI-generated tip rows for a completed try-on.
- `regenerate` (protected): replace existing tips by calling AI service.
- `delete` (protected): remove a tip.

### Validators (`src/validators/style-tip.ts`)

- `apiStyleTipId`: `id: z.string().cuid()`.
- `apiStyleTipCreate`: `tryOnId`, `category` (enum: `fit | color | style | occasion`), `content`.
- `apiStyleTipList`: `tryOnId`.

### Services (`src/services/style-tip.ts`)

- `generateStyleTips(tryOnId, resultUrl)`: call `streamTryOnAnalysis` and persist tips.
- `replaceStyleTips(tryOnId, tips[])`: transactionally delete/create tips.

### Components

- `src/components/style-tip/style-tip-panel.tsx`: list tips for a try-on detail view.
- `src/components/style-tip/style-tip-card.tsx`: individual tip display with category chip.
- `src/components/style-tip/style-tip-actions.tsx`: regenerate/delete controls.

### Screens

- Displayed within `src/screens/try-on/try-on-id.tsx` (no dedicated screen).

### Routes

- Consumed inside `src/routes/try-on/$tryOnId.tsx` (no standalone list).

### Errors to Add

- `styleTipNotFound`, `styleTipCreateFailed`, `styleTipDeleteFailed`, `styleTipForbidden`, `styleTipGenerateFailed`.

## Cleanup: Remove Todo

- Prisma: delete `TodoStatus` enum and `Todo` model; add new relations to `User` as shown in `docs/schema-migration.md`.
- Delete/replace files: `src/trpc/routers/todo.ts`, `src/validators/todo.ts`, `src/components/todo/*`, `src/routes/todo/*`.
- Update router aggregation `src/trpc/router.ts` to register new routers (`profile`, `garment`, `tryOn`, `lookbook`, `styleTip`).
- Remove Todo translation strings and any Todo-specific UI references.

## Implementation Order

1. ✅ **Prisma Schema** - All 6 models complete (BodyProfile, Garment, TryOn, Lookbook, LookbookItem, StyleTip) + User relations.
2. ✅ **Infrastructure** - Add infrastructure to `sst.config.ts` (bucket, queue, worker) and implement `src/workers/try-on.ts`.
   - Completed: `TryOnQueue`, `TryOnWorker` with Gemini 3 Pro, `src/lib/sqs.ts`, env vars
3. ✅ **Validators & Routers** - Build validators and tRPC routers; wire into `src/trpc/router.ts`.
   - ✅ Complete: BodyProfile, Garment, TryOn, Lookbook, StyleTip
4. ✅ **Services** - Add services for S3 uploads, queue enqueue, style-tip generation, and lookbook slug/order helpers.
   - ✅ Complete: `src/lib/sqs.ts`, `src/services/profile.ts`, `src/services/garment.ts`, `src/services/try-on.ts`, `src/services/lookbook.ts`, `src/services/style-tip.ts`
5. ✅ **Components & Routes** - Implement components/routes in the same order, reusing Todo patterns.
   - ✅ Complete: BodyProfile (4 components, 3 screens, 3 routes), Garment (4 components, 3 screens, 3 routes), TryOn (4 components, 2 screens, 2 routes), Lookbook (6 components, 3 screens, 3 routes), StyleTip (3 components, embedded in TryOn detail)
6. ⬜ **Cleanup** - Remove Todo UI/route references and verify with `bun typecheck`.

## Next Steps

1. ~~**Garment**~~ ✅ Complete
   - Validators, tRPC router, services, components, screens, and routes

2. ~~**TryOn**~~ ✅ Complete
   - Validators, tRPC router, services (including `updateTryOnResult()`), components, screens, and routes
   - Worker callback service for `src/workers/try-on.ts`

3. ~~**Lookbook + LookbookItem**~~ ✅ Complete
   - Validators, tRPC router, services, components, screens, and routes
   - Drag-and-drop reordering with @dnd-kit
   - Public share functionality via unique slugs

4. ~~**StyleTip**~~ ✅ Complete
   - Validators, tRPC router, services (Gemini 2.5 Flash), components (card, form, delete)
   - Auto-generates tips in Lambda worker after try-on completion
   - Full CRUD operations (view, edit, delete, add, regenerate)
   - Embedded in TryOn detail screen

5. **Cleanup** - Remove Todo references and verify with `bun typecheck`
