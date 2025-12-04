# Drezzi Schema Migration Guide

Step-by-step guide for migrating the Prisma schema from the Todo template to the Drezzi (Stylish AI) virtual try-on application.

**Reference:** `docs/stylish-app.md` (Database Schema section)

---

## Part 1: Cleanup - Remove Todo Models

Remove the template models that are no longer needed.

### 1.1 Remove TodoStatus Enum

Delete this enum:

```prisma
// DELETE THIS ENUM
enum TodoStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED

  @@map("status")
}
```

### 1.2 Remove Todo Model

Delete this model:

```prisma
// DELETE THIS MODEL
model Todo {
  id          String     @id @default(uuid())
  text        String
  description String?
  active      Boolean    @default(true)
  status      TodoStatus @default(NOT_STARTED)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @default(now()) @map("updated_at")

  @@map("todo")
}
```

---

## Part 2: Update User Model

Add new relations for the Stylish AI features while keeping existing auth relations.

```prisma
model User {
  id            String    @id
  name          String
  email         String    @unique
  emailVerified Boolean   @default(false) @map("email_verified")
  role          UserRole  @default(GUEST)
  image         String?
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @default(now()) @map("updated_at")

  // Auth relations (keep existing)
  sessions      Session[]
  accounts      Account[]

  // Stylish AI relations (add new)
  bodyProfiles  BodyProfile[]
  tryOns        TryOn[]
  lookbooks     Lookbook[]

  @@map("user")
}
```

**Changes:**
- Added `bodyProfiles BodyProfile[]` - User's body photos/measurements
- Added `tryOns TryOn[]` - User's try-on history
- Added `lookbooks Lookbook[]` - User's collections

---

## Part 3: Add BodyProfile Model

Store user body photos and optional measurements for virtual try-on.

```prisma
model BodyProfile {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  name          String   @default("Default")
  photoUrl      String   @map("photo_url")
  photoKey      String   @map("photo_key")     // S3 key
  height        Float?                          // cm
  waist         Float?                          // cm
  hip           Float?                          // cm
  inseam        Float?                          // cm
  chest         Float?                          // cm
  fitPreference String   @default("regular") @map("fit_preference") // slim, regular, relaxed
  isDefault     Boolean  @default(false) @map("is_default")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  tryOns TryOn[]

  @@index([userId])
  @@map("body_profile")
}
```

**Fields:**
- `photoUrl` / `photoKey` - S3 storage for body photo
- Measurements are optional (height, waist, hip, inseam, chest in cm)
- `fitPreference` - User's preferred fit style
- `isDefault` - Mark one profile as the default

---

## Part 4: Add Garment Model

Catalog of clothing items available for virtual try-on.

```prisma
model Garment {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String                            // jeans, shirt, dress, jacket, etc.
  subcategory String?                           // skinny, bootcut, oversized, etc.
  brand       String?
  price       Float?
  currency    String   @default("USD")
  imageUrl    String   @map("image_url")
  imageKey    String   @map("image_key")        // S3 key
  maskUrl     String?  @map("mask_url")         // segmentation mask
  retailUrl   String?  @map("retail_url")       // affiliate link
  colors      String[] @default([])
  sizes       String[] @default([])
  tags        String[] @default([])             // casual, formal, streetwear
  metadata    Json?
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  tryOns TryOn[]

  @@index([category])
  @@index([brand])
  @@map("garment")
}
```

**Fields:**
- `category` / `subcategory` - For filtering (jeans > skinny)
- `imageUrl` / `imageKey` - S3 storage for garment photo
- `maskUrl` - Optional segmentation mask for AI processing
- `retailUrl` - Affiliate/purchase link
- `colors`, `sizes`, `tags` - Arrays for filtering
- `metadata` - Flexible JSON for additional data

---

## Part 5: Add TryOn Model

Virtual try-on job records and results.

```prisma
model TryOn {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  bodyProfileId   String    @map("body_profile_id")
  garmentId       String    @map("garment_id")
  status          String    @default("pending")    // pending, processing, completed, failed
  resultUrl       String?   @map("result_url")
  resultKey       String?   @map("result_key")     // S3 key
  jobId           String?   @map("job_id")         // External job ID (Gemini/queue)
  processingMs    Int?      @map("processing_ms")
  confidenceScore Float?    @map("confidence_score")
  errorMessage    String?   @map("error_message")
  isFavorite      Boolean   @default(false) @map("is_favorite")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  completedAt     DateTime? @map("completed_at")

  // Relations
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

**Status Values:**
- `pending` - Job queued
- `processing` - AI processing in progress
- `completed` - Result ready
- `failed` - Processing failed

**Fields:**
- `resultUrl` / `resultKey` - S3 storage for generated image
- `jobId` - Track external processing job
- `processingMs` - Track processing duration
- `confidenceScore` - AI model confidence
- `isFavorite` - User can mark favorites

---

## Part 6: Add Lookbook Model

Collections of try-on results that users can curate and share.

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

  // Relations
  user  User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  items LookbookItem[]

  @@index([userId])
  @@index([shareSlug])
  @@map("lookbook")
}
```

**Fields:**
- `coverUrl` - Cover image for the lookbook
- `isPublic` - Whether the lookbook is publicly viewable
- `shareSlug` - Unique slug for public sharing URLs

---

## Part 7: Add LookbookItem Model

Junction table linking try-ons to lookbooks with ordering.

```prisma
model LookbookItem {
  id         String   @id @default(cuid())
  lookbookId String   @map("lookbook_id")
  tryOnId    String   @map("try_on_id")
  order      Int      @default(0)
  note       String?
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  lookbook Lookbook @relation(fields: [lookbookId], references: [id], onDelete: Cascade)
  tryOn    TryOn    @relation(fields: [tryOnId], references: [id], onDelete: Cascade)

  @@unique([lookbookId, tryOnId])
  @@map("lookbook_item")
}
```

**Fields:**
- `order` - Position in the lookbook (for drag-and-drop reordering)
- `note` - Optional note for this item
- Unique constraint prevents duplicate try-ons in same lookbook

---

## Part 8: Add StyleTip Model

AI-generated styling suggestions for try-on results.

```prisma
model StyleTip {
  id        String   @id @default(cuid())
  tryOnId   String   @map("try_on_id")
  category  String                          // fit, color, style, occasion
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  tryOn TryOn @relation(fields: [tryOnId], references: [id], onDelete: Cascade)

  @@map("style_tip")
}
```

**Category Values:**
- `fit` - Fit recommendations based on body type
- `color` - Color palette suggestions
- `style` - Style recommendations
- `occasion` - Occasion-based outfit suggestions

---

## Part 9: Migration Commands

After updating `prisma/schema.prisma`, run these commands:

### Generate Prisma Client

```bash
bunx prisma generate
```

### Create Migration (Development)

```bash
bunx prisma migrate dev --name stylish_ai_models
```

### Push Schema (Skip Migration Files)

```bash
bunx prisma db push
```

### Open Prisma Studio

```bash
bunx prisma studio
```

### Deploy to Production

```bash
bunx prisma migrate deploy
```

---

## Entity Relationship Diagram

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

---

## Complete Schema Reference

See `docs/stylish-app.md` section "Database Schema" for the complete schema in one block.
