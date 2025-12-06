# File Table Migration Guide

This document outlines the schema changes made to centralize file management and the required codebase updates.

---

## Progress Tracker

### Schema Changes
- [x] Add `File` model
- [x] Update `BodyProfile` - remove `photoUrl`/`photoKey`, add `photoId`
- [x] Update `Garment` - remove `imageUrl`/`imageKey`/`maskUrl`, add `imageId`/`maskId`
- [x] Update `TryOn` - remove `resultUrl`/`resultKey`, add `frontPhotoId`/`backPhotoId`/`resultId`
- [x] Update `Lookbook` - remove `coverUrl`/`coverKey`, add `coverId`
- [x] Regenerate Prisma client

### Services
- [ ] `src/services/profile.ts` - Update upload flow to create File records
- [ ] `src/services/garment.ts` - Update upload flow to create File records
- [ ] `src/services/lookbook.ts` - Update upload flow to create File records
- [ ] `src/services/try-on.ts` - Update result storage to use File records

### tRPC Routers
- [ ] `src/trpc/routers/profile.ts` - Replace legacy fields, include photo relation
- [ ] `src/trpc/routers/garment.ts` - Replace legacy fields, include image/mask relations
- [ ] `src/trpc/routers/lookbook.ts` - Replace legacy fields, include cover relation
- [ ] `src/trpc/routers/tryOn.ts` - Replace legacy fields, include file relations
- [ ] `src/trpc/routers/dashboard.ts` - Update queries to include file relations

### Components
- [x] `src/components/profile/profile-form.tsx` - Update form and optimistic updates
- [x] `src/components/garment/garment-form.tsx` - Update form and optimistic updates
- [x] `src/components/garment/garment-card.tsx` - Access image via relation
- [x] `src/components/lookbook/lookbook-form.tsx` - Update form and optimistic updates
- [x] `src/components/try-on/*` - Update to use new file relations
- [x] `src/components/profile/profile-card.tsx` - Access photo via relation
- [x] `src/screens/garment/new.tsx` - Update to use fileId
- [x] `src/screens/profile/new.tsx` - Update to use fileId

### Validators
- [ ] `src/validators/profile.ts` - Replace `photoUrl`/`photoKey` with `photoId`
- [ ] `src/validators/garment.ts` - Replace `imageUrl`/`imageKey` with `imageId`
- [ ] `src/validators/lookbook.ts` - Replace `coverUrl`/`coverKey` with `coverId`

### Workers
- [ ] `src/workers/try-on.ts` - Use `photo.key` and `image.key` via relations

### Seed File
- [ ] `prisma/seed.ts` - Create File records, reference by ID

---

## Schema Changes

### New `File` Model

A centralized `File` table now manages all file references:

```prisma
model File {
  id         String   @id @default(cuid())
  key        String   @unique        // S3 object key
  bucket     String   @default("media")
  filename   String?                 // Original filename
  mimeType   String?  @map("mime_type")
  size       Int?                    // Size in bytes
  uploadedBy String?  @map("uploaded_by")
  createdAt  DateTime @default(now()) @map("created_at")
}
```

### Model Changes

| Model | Removed Fields | New Fields | Notes |
|-------|---------------|------------|-------|
| `BodyProfile` | `photoUrl`, `photoKey` | `photoId` (required), `photo` relation | Profile must have a photo |
| `Garment` | `imageUrl`, `imageKey`, `maskUrl` | `imageId` (required), `maskId` (optional), `image`/`mask` relations | Garment must have an image |
| `TryOn` | `resultUrl`, `resultKey` | `frontPhotoId`, `backPhotoId`, `resultId` (all optional) | New: front/back body photos |
| `Lookbook` | `coverUrl`, `coverKey` | `coverId` (optional), `cover` relation | Cover remains optional |

---

## Files Requiring Updates

### Services

| File | Changes Needed |
|------|----------------|
| `src/services/profile.ts` | Update `getProfileUploadUrl` to create File record, update queries to include `photo` relation |
| `src/services/garment.ts` | Update `getGarmentUploadUrl` to create File record, update queries to include `image`/`mask` relations |
| `src/services/lookbook.ts` | Update `getLookbookCoverUploadUrl` to create File record, update queries to include `cover` relation |
| `src/services/try-on.ts` | Update `updateTryOnResult` to create File record for result |

### tRPC Routers

| File | Changes Needed |
|------|----------------|
| `src/trpc/routers/profile.ts` | Replace `photoUrl`/`photoKey` with `photoId`, include `photo` in queries, use `photo.key` for presigned URLs |
| `src/trpc/routers/garment.ts` | Replace `imageUrl`/`imageKey` with `imageId`, include `image` in queries, use `image.key` for presigned URLs |
| `src/trpc/routers/lookbook.ts` | Replace `coverUrl`/`coverKey` with `coverId`, include `cover` in queries |
| `src/trpc/routers/tryOn.ts` | Replace `resultUrl`/`resultKey` with `resultId`, include `result`/`frontPhoto`/`backPhoto` in queries |
| `src/trpc/routers/dashboard.ts` | Update queries to include file relations |

### Components

| File | Changes Needed |
|------|----------------|
| `src/components/profile/profile-form.tsx` | Update form to work with `photoId`, remove `photoUrl`/`photoKey` from optimistic updates |
| `src/components/garment/garment-form.tsx` | Update form to work with `imageId`, remove legacy fields from optimistic updates |
| `src/components/garment/garment-card.tsx` | Access image URL via `image.key` + presigned URL helper |
| `src/components/lookbook/lookbook-form.tsx` | Update form to work with `coverId`, remove legacy fields |
| `src/components/try-on/*` | Update to use new file relations |

### Validators

| File | Changes Needed |
|------|----------------|
| `src/validators/profile.ts` | Replace `photoUrl`/`photoKey` with `photoId` |
| `src/validators/garment.ts` | Replace `imageUrl`/`imageKey` with `imageId` |
| `src/validators/lookbook.ts` | Replace `coverUrl`/`coverKey` with `coverId` |

### Workers

| File | Changes Needed |
|------|----------------|
| `src/workers/try-on.ts` | Update to use `photo.key` and `image.key` instead of direct fields |

### Seed File

| File | Changes Needed |
|------|----------------|
| `prisma/seed.ts` | Create File records first, then reference by `photoId`/`imageId` instead of `photoUrl`/`imageUrl` |

---

## Migration Pattern

### Before (Legacy)

```typescript
// Creating a garment
const garment = await prisma.garment.create({
  data: {
    name: "T-Shirt",
    imageUrl: "https://s3.../garments/123.jpg",
    imageKey: "garments/123.jpg",
    // ...
  }
});

// Getting image URL
const url = await getCachedPresignedUrl(garment.imageKey);
```

### After (New)

```typescript
// Creating a garment (two steps)
const file = await prisma.file.create({
  data: {
    key: "garments/123.jpg",
    filename: "tshirt.jpg",
    mimeType: "image/jpeg",
  }
});

const garment = await prisma.garment.create({
  data: {
    name: "T-Shirt",
    imageId: file.id,
    // ...
  }
});

// Getting image URL (include relation in query)
const garment = await prisma.garment.findUnique({
  where: { id },
  include: { image: true }
});
const url = await getCachedPresignedUrl(garment.image.key);
```

---

## New TryOn Photo Fields

TryOn now supports optional front and back body photos:

```typescript
// Creating a try-on with custom photos
const tryOn = await prisma.tryOn.create({
  data: {
    userId,
    bodyProfileId,
    garmentId,
    frontPhotoId: frontFile?.id,  // Optional
    backPhotoId: backFile?.id,    // Optional
  }
});
```

These are separate from the BodyProfile photo - users can upload specific photos per try-on session.

---

## Helper Function Updates

### `getCachedPresignedUrl`

No changes needed - still accepts a `key` string.

### New: Include patterns

Add these include patterns to queries:

```typescript
// Profile queries
include: { photo: true }

// Garment queries
include: { image: true, mask: true }

// TryOn queries
include: {
  frontPhoto: true,
  backPhoto: true,
  result: true,
  bodyProfile: { include: { photo: true } },
  garment: { include: { image: true } }
}

// Lookbook queries
include: { cover: true }
```

---

## Database Migration

Run after updating the codebase:

```bash
bun --env-file=.env.franklin prisma migrate dev --name add-file-table
```

For production with existing data, a data migration script will be needed to:
1. Create File records from existing `*Key` values
2. Update foreign keys to reference new File records
3. Drop legacy columns
