# Prisma Transactions Implementation Guide

This document analyzes all tRPC procedures in `/src/trpc/routers/` and identifies which would benefit from Prisma transactions.

## Transaction Types in Prisma

### 1. Sequential Transactions (`$transaction([])`)
Pass an array of Prisma queries executed sequentially in a single transaction.

```typescript
const [result1, result2] = await prisma.$transaction([
  prisma.user.create({ data: { name: "Alice" } }),
  prisma.post.create({ data: { title: "Hello", userId: userId } }),
]);
```

### 2. Interactive Transactions
Pass an async function for custom logic and control flow within a transaction.

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.findUnique({ where: { id } });
  if (user.balance < amount) {
    throw new Error("Insufficient funds");
  }
  await tx.user.update({ where: { id }, data: { balance: { decrement: amount } } });
});
```

## Procedure Analysis by Router

---

### `garment.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `list` | Query only | No transaction needed | - |
| `publicList` | Query only | No transaction needed | - |
| `byId` | Query only | No transaction needed | - |
| `create` | **Needs transaction** | Interactive | High |
| `update` | **Needs transaction** | Interactive | High |
| `delete` | Could benefit | Interactive | Medium |
| `togglePublic` | Could benefit | Interactive | Low |
| `getUploadUrl` | No DB writes | No transaction needed | - |
| `categories` | Query only | No transaction needed | - |

#### `garment.create` - HIGH PRIORITY
**Current flow:**
1. Upload file to S3 and create `File` record
2. Create `Garment` record

**Problem:** If step 2 fails, orphaned `File` record exists.

**Recommended implementation:**
```typescript
create: protectedProcedure
  .input(z.instanceof(FormData))
  .mutation(async ({ input, ctx }) => {
    const errors = createErrors(ctx.i18n);
    const userId = ctx.session.user.id;
    const file = input.get("file");

    if (!(file instanceof File)) {
      throw errors.invalidGarmentImage();
    }

    return await ctx.prisma.$transaction(async (tx) => {
      const uploaded = await uploadFileToS3({
        file,
        userId,
        prisma: tx, // Pass transaction client
        prefix: "garments",
        allowedMimeTypes: IMAGE_TYPE_REGEX,
      });

      const parsed = apiGarmentCreate.parse({
        name: input.get("name")?.toString(),
        // ... other fields
        imageId: uploaded.id,
      });

      const garment = await tx.garment.create({
        data: { ...parsed, userId },
      });

      return garment;
    });
  }),
```

#### `garment.update` - HIGH PRIORITY
**Current flow:**
1. Find existing garment
2. Optionally upload new file
3. Update garment record

**Problem:** If step 3 fails after uploading new file, orphaned file exists.

**Recommended implementation:**
```typescript
update: protectedProcedure
  .input(z.instanceof(FormData))
  .mutation(async ({ input, ctx }) => {
    return await ctx.prisma.$transaction(async (tx) => {
      const existing = await tx.garment.findFirst({
        where: { id, userId },
      });

      if (!existing) throw errors.garmentNotFound();

      let imageId = existing.imageId;
      if (file instanceof File) {
        const uploaded = await uploadFileToS3({
          file,
          userId,
          prisma: tx,
          prefix: "garments",
          allowedMimeTypes: IMAGE_TYPE_REGEX,
        });
        imageId = uploaded.id;
      }

      return await tx.garment.update({
        where: { id },
        data: { ...updateData, imageId },
      });
    });
  }),
```

#### `garment.delete` - MEDIUM PRIORITY
**Current flow:**
1. Find garment with image
2. Delete S3 assets
3. Delete garment record

**Problem:** If S3 delete succeeds but DB delete fails, data inconsistency.

**Note:** S3 operations are external and cannot be rolled back. Consider:
- Delete DB record first within transaction
- Queue S3 cleanup as background job on success
- Or accept eventual consistency with orphaned S3 objects

---

### `profile.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `list` | Query only | No transaction needed | - |
| `byId` | Query only | No transaction needed | - |
| `create` | **Needs transaction** | Interactive | High |
| `update` | **Needs transaction** | Interactive | High |
| `delete` | Could benefit | Interactive | Medium |
| `setDefault` | Already uses transaction | N/A (in service) | - |
| `getUploadUrl` | No DB writes | No transaction needed | - |
| `uploadPhoto` | Single operation | No transaction needed | - |

#### `profile.create` - HIGH PRIORITY
**Current flow:**
1. Upload file to S3 and create `File` record
2. If `isDefault`, update all other profiles to `isDefault: false`
3. Create new profile

**Problem:** If step 3 fails, other profiles are incorrectly marked as non-default.

**Recommended implementation:**
```typescript
create: protectedProcedure
  .input(z.instanceof(FormData))
  .mutation(async ({ input, ctx }) => {
    return await ctx.prisma.$transaction(async (tx) => {
      const uploaded = await uploadFileToS3({
        file,
        userId,
        prisma: tx,
        prefix: "profiles",
        allowedMimeTypes: IMAGE_TYPE_REGEX,
      });

      if (parsed.isDefault) {
        await tx.bodyProfile.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return await tx.bodyProfile.create({
        data: { ...parsed, userId },
      });
    });
  }),
```

#### `profile.update` - HIGH PRIORITY
**Current flow:**
1. Find existing profile
2. Optionally upload new file
3. If `isDefault`, update all other profiles
4. Update profile

**Problem:** Race condition with `isDefault` flag; partial updates possible.

**Recommended implementation:**
```typescript
update: protectedProcedure
  .input(z.instanceof(FormData))
  .mutation(async ({ input, ctx }) => {
    return await ctx.prisma.$transaction(async (tx) => {
      const existing = await tx.bodyProfile.findFirst({
        where: { id, userId },
      });

      if (!existing) throw errors.profileNotFound();

      let photoId = existing.photoId;
      if (file instanceof File) {
        const uploaded = await uploadFileToS3({
          file,
          userId,
          prisma: tx,
          prefix: "profiles",
          allowedMimeTypes: IMAGE_TYPE_REGEX,
        });
        photoId = uploaded.id;
      }

      if (parsed.isDefault) {
        await tx.bodyProfile.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return await tx.bodyProfile.update({
        where: { id },
        data: { ...updateData, photoId },
      });
    });
  }),
```

---

### `lookbook.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `list` | Query only | No transaction needed | - |
| `byId` | Query only | No transaction needed | - |
| `bySlug` | Query only | No transaction needed | - |
| `create` | Single create | Nested write sufficient | - |
| `update` | **Needs transaction** | Interactive | Medium |
| `delete` | Could benefit | Interactive | Medium |
| `addItem` | **Needs transaction** | Interactive | High |
| `removeItem` | Single operation | No transaction needed | - |
| `updateItemNote` | Single operation | No transaction needed | - |
| `reorderItems` | Already uses transaction | N/A (in service) | - |
| `generateShareLink` | **Needs transaction** | Interactive | Medium |
| `togglePublic` | Could benefit | Interactive | Low |
| `getCoverUploadUrl` | No DB writes | No transaction needed | - |
| `availableTryOns` | Query only | No transaction needed | - |

#### `lookbook.addItem` - HIGH PRIORITY
**Current flow:**
1. Find lookbook
2. Find tryOn
3. Check for existing item (duplicate check)
4. Get next order number
5. Create item

**Problem:** Race condition between steps 3-5 could cause duplicate items or order conflicts.

**Recommended implementation:**
```typescript
addItem: protectedProcedure
  .input(apiLookbookAddItem)
  .mutation(async ({ input, ctx }) => {
    return await ctx.prisma.$transaction(async (tx) => {
      const lookbook = await tx.lookbook.findFirst({
        where: { id: input.lookbookId, userId },
      });
      if (!lookbook) throw errors.lookbookNotFound();

      const tryOn = await tx.tryOn.findFirst({
        where: { id: input.tryOnId, userId, status: "completed" },
      });
      if (!tryOn) throw errors.tryOnNotFound();

      const existing = await tx.lookbookItem.findUnique({
        where: {
          lookbookId_tryOnId: {
            lookbookId: input.lookbookId,
            tryOnId: input.tryOnId,
          },
        },
      });
      if (existing) throw errors.lookbookItemDuplicate();

      // Get next order within transaction
      const maxItem = await tx.lookbookItem.findFirst({
        where: { lookbookId: input.lookbookId },
        orderBy: { order: "desc" },
      });
      const order = input.order ?? (maxItem ? maxItem.order + 1 : 0);

      return await tx.lookbookItem.create({
        data: {
          lookbookId: input.lookbookId,
          tryOnId: input.tryOnId,
          note: input.note,
          order,
        },
        include: { tryOn: { include: { garment: true, bodyProfile: true } } },
      });
    });
  }),
```

#### `lookbook.update` - MEDIUM PRIORITY
**Current flow:**
1. Find existing lookbook with cover
2. If cover changed, delete old cover from S3
3. Update lookbook

**Problem:** If update fails after S3 delete, cover is lost.

#### `lookbook.generateShareLink` - MEDIUM PRIORITY
**Current flow:**
1. Find lookbook
2. If already public with slug, return early
3. Generate slug (external call)
4. Update lookbook

**Problem:** Race condition could generate multiple slugs for same lookbook.

**Recommended implementation:**
```typescript
generateShareLink: protectedProcedure
  .input(apiLookbookId)
  .mutation(async ({ input, ctx }) => {
    return await ctx.prisma.$transaction(async (tx) => {
      const lookbook = await tx.lookbook.findFirst({
        where: { id: input.id, userId },
      });
      if (!lookbook) throw errors.lookbookNotFound();

      if (lookbook.shareSlug && lookbook.isPublic) {
        return { slug: lookbook.shareSlug, isPublic: true };
      }

      const slug = lookbook.shareSlug ?? (await generateShareSlug(lookbook.name));

      const updated = await tx.lookbook.update({
        where: { id: input.id },
        data: { shareSlug: slug, isPublic: true },
      });

      return { slug: updated.shareSlug, isPublic: updated.isPublic };
    });
  }),
```

---

### `tryOn.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `list` | Query only | No transaction needed | - |
| `byId` | Query only | No transaction needed | - |
| `create` | **Needs transaction** | Interactive | Critical |
| `toggleFavorite` | Could benefit | Interactive | Low |
| `delete` | Could benefit | Interactive | Medium |
| `retry` | **Needs transaction** | Interactive | High |
| `favorites` | Query only | No transaction needed | - |
| `recent` | Query only | No transaction needed | - |

#### `tryOn.create` - CRITICAL PRIORITY
**Current flow:**
1. Find body profile
2. Find garment
3. Create tryOn record with status "pending"
4. Enqueue SQS job
5. Update tryOn with jobId and status "processing"

**Problems:**
- If step 4 fails, orphaned pending tryOn exists
- If step 5 fails after successful enqueue, job runs but status is wrong

**Recommended implementation:**
```typescript
create: protectedProcedure
  .input(z.union([apiTryOnCreate, z.instanceof(FormData)]))
  .mutation(async ({ input, ctx }) => {
    return await ctx.prisma.$transaction(async (tx) => {
      const bodyProfile = await tx.bodyProfile.findFirst({
        where: { id: parsed.bodyProfileId, userId },
        include: { photo: true },
      });
      if (!bodyProfile) throw errors.profileNotFound();

      const garment = await tx.garment.findFirst({
        where: {
          id: parsed.garmentId,
          OR: [{ userId }, { isPublic: true }],
        },
        include: { image: true },
      });
      if (!garment) throw errors.garmentNotFound();

      // Create with processing status directly
      const tryOn = await tx.tryOn.create({
        data: {
          userId,
          bodyProfileId: parsed.bodyProfileId,
          garmentId: parsed.garmentId,
          status: "processing",
        },
        include: {
          bodyProfile: { include: { photo: true } },
          garment: { include: { image: true } },
        },
      });

      // Enqueue AFTER successful creation (outside transaction if needed)
      // If enqueue fails, transaction rolled back
      const jobId = await enqueueTryOnJob({
        tryOnId: tryOn.id,
        bodyImageUrl: bodyProfile.photo.key,
        garmentImageUrl: garment.image.key,
      });

      // Update with jobId
      const updated = await tx.tryOn.update({
        where: { id: tryOn.id },
        data: { jobId },
      });

      return {
        ...updated,
        resultUrl: null,
        bodyProfile: { ...tryOn.bodyProfile, photoUrl: await getProfilePhotoUrl(tryOn.bodyProfile.photo.key) },
        garment: { ...tryOn.garment, imageUrl: await getGarmentImageUrl(tryOn.garment.image.key) },
      };
    }, {
      timeout: 10000, // Extended timeout for external SQS call
    });
  }),
```

**Alternative pattern:** Use saga/outbox pattern for SQS reliability:
1. Create tryOn with status "pending" and store job payload
2. Separate worker processes pending jobs and updates status

#### `tryOn.retry` - HIGH PRIORITY
**Current flow:**
1. Find failed tryOn
2. Enqueue new SQS job
3. Update tryOn with new jobId and status

**Problem:** Similar to create - if update fails after enqueue, job runs but status incorrect.

---

### `dashboard.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `stats` | Multiple count queries | Sequential transaction | Low |
| `recentActivity` | Query only | No transaction needed | - |

#### `dashboard.stats` - LOW PRIORITY
**Current:** Uses `Promise.all` for 9 count queries.

**Consideration:** For consistent snapshot (all counts at same point in time):
```typescript
stats: protectedProcedure.query(async ({ ctx }) => {
  const userId = ctx.session.user.id;

  const [
    totalTryOns,
    completedTryOns,
    // ... other counts
  ] = await ctx.prisma.$transaction([
    ctx.prisma.tryOn.count({ where: { userId } }),
    ctx.prisma.tryOn.count({ where: { userId, status: "completed" } }),
    // ... other counts
  ]);

  return { totalTryOns, completedTryOns, /* ... */ };
});
```

---

### `style-tip.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `byTryOnId` | Query only | No transaction needed | - |
| `create` | Single operation | No transaction needed | - |
| `update` | Single operation | No transaction needed | - |
| `delete` | Single operation | No transaction needed | - |
| `regenerate` | **Needs transaction** | Interactive | Medium |

#### `styleTip.regenerate` - MEDIUM PRIORITY
**Current flow:**
1. Get tryOn data (service call)
2. Regenerate style tips (service call - likely deletes old + creates new)
3. Query new tips

**Problem:** If step 2 partially fails, inconsistent tips state.

**Note:** Check `regenerateStyleTips` service - if it handles its own transaction, this may be fine.

---

### `todo.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `list` | Query only | No transaction needed | - |
| `byId` | Query only | No transaction needed | - |
| `create` | Single operation | No transaction needed | - |
| `delete` | Single operation | No transaction needed | - |
| `update` | Single operation | No transaction needed | - |

No transactions needed - all operations are single atomic database calls.

---

### `auth.ts`

| Procedure | Current State | Recommendation | Priority |
|-----------|---------------|----------------|----------|
| `getSession` | Returns session | No transaction needed | - |

No transactions needed - no database operations.

---

## Implementation Priority Summary

### Critical Priority
1. **`tryOn.create`** - External service (SQS) coordination with DB state

### High Priority
2. **`garment.create`** - File upload + garment creation atomicity
3. **`garment.update`** - File upload + garment update atomicity
4. **`profile.create`** - isDefault flag + profile creation atomicity
5. **`profile.update`** - isDefault flag + profile update atomicity
6. **`lookbook.addItem`** - Duplicate check + order assignment race condition
7. **`tryOn.retry`** - SQS enqueue + status update coordination

### Medium Priority
8. **`lookbook.update`** - Cover deletion + update atomicity
9. **`lookbook.generateShareLink`** - Slug generation race condition
10. **`garment.delete`** - Asset cleanup consistency
11. **`profile.delete`** - Asset cleanup consistency
12. **`lookbook.delete`** - Asset cleanup consistency
13. **`tryOn.delete`** - Asset cleanup consistency
14. **`styleTip.regenerate`** - Tips regeneration atomicity

### Low Priority
15. **`garment.togglePublic`** - Read-modify-write race (low impact)
16. **`lookbook.togglePublic`** - Read-modify-write race (low impact)
17. **`tryOn.toggleFavorite`** - Read-modify-write race (low impact)
18. **`dashboard.stats`** - Consistent snapshot for counts

---

## Already Using Transactions (Services Layer)

These procedures delegate to services that already use `$transaction`:

1. **`profile.setDefault`** → `setDefaultProfile()` in `src/services/profile.ts:32`
2. **`lookbook.reorderItems`** → `reorderLookbookItems()` in `src/services/lookbook.ts:75`

---

## Transaction Best Practices

### 1. Pass Transaction Client to Services
When using interactive transactions, pass the `tx` client to service functions:

```typescript
// Service
export async function uploadFileToS3({ prisma, ...args }) {
  return await prisma.file.create({ data: {...} });
}

// Router
await ctx.prisma.$transaction(async (tx) => {
  const file = await uploadFileToS3({ prisma: tx, ...args });
});
```

### 2. Configure Timeouts for External Calls
```typescript
await ctx.prisma.$transaction(async (tx) => {
  // ... operations including external API calls
}, {
  maxWait: 5000,  // Max time to acquire transaction (default: 2000ms)
  timeout: 15000, // Max transaction duration (default: 5000ms)
});
```

### 3. Handle External Services Carefully
S3/SQS operations cannot be rolled back. Options:
- Perform external operations AFTER database transaction commits
- Use saga/outbox pattern for eventual consistency
- Accept orphaned external resources with cleanup jobs

### 4. Isolation Levels
For high-contention scenarios (like order assignment):
```typescript
await ctx.prisma.$transaction(async (tx) => {
  // ...
}, {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
});
```

### 5. Error Handling
```typescript
try {
  await ctx.prisma.$transaction(async (tx) => {
    // operations
  });
} catch (error) {
  if (error.code === 'P2034') {
    // Write conflict - retry logic
  }
  throw error;
}
```

---

## Refactoring `uploadFileToS3` for Transaction Support

The `uploadFileToS3` utility in `src/trpc/utils/file-upload.ts` should accept a transaction client:

```typescript
type PrismaClient = typeof import("@/lib/prisma").prisma;
type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function uploadFileToS3({
  file,
  userId,
  prisma,
  prefix,
  allowedMimeTypes,
}: {
  file: File;
  userId: string;
  prisma: PrismaClient | TransactionClient; // Accept both
  prefix: string;
  allowedMimeTypes: RegExp;
}) {
  // ... implementation uses `prisma` parameter for DB operations
}
```

This allows the function to work both standalone and within transactions.
