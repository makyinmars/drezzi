# Drezzi Monorepo Migration Overview

## Executive Summary

This document provides a high-level roadmap for migrating the **Drezzi** application from its current Prisma-based single-app architecture to the s-stories monorepo pattern. The migration transitions the codebase to Drizzle ORM with Effect-based services, significantly improving type safety, error handling, and observability.

**Key Motivations:**
- **Modularity**: Monorepo structure enables clear package boundaries and code reuse
- **Type Safety**: End-to-end TypeScript with Drizzle type inference
- **Error Handling**: Explicit error channels with Effect's tagged errors
- **Observability**: Effect spans for distributed tracing and DevTools integration

For detailed implementation guidance, see the comprehensive [monorepo-migration-phases.md](./monorepo-migration-phases.md) guide.

---

## Architecture Comparison

### Current Architecture (drezzi)

The current implementation follows a single TanStack Start application pattern:

- **Single Application**: Monolithic codebase in `src/` directory
- **ORM**: Prisma with schema definition in `prisma/schema.prisma`
- **Services**: Plain async/await functions in `src/services/`
- **Infrastructure**: Single SST configuration file
- **API**: tRPC with direct Prisma client access in context
- **Validation**: Zod schemas integrated with Prisma
- **Database**: PostgreSQL with 15 models

**Structure:**
```
drezzi/
├── src/
│   ├── routes/           # File-based routing
│   ├── trpc/             # tRPC routers
│   ├── services/         # Business logic
│   └── components/       # React components
├── prisma/
│   └── schema.prisma    # Schema definition
└── sst.config.ts        # Infrastructure
```

### Target Architecture (Monorepo Pattern)

The target follows the s-stories monorepo structure with clear separation of concerns:

- **Multi-Package Structure**: Four distinct packages with clear boundaries
  - `packages/core` - Database, services, API, shared types
  - `packages/functions` - Lambda workers and background jobs
  - `packages/web` - Frontend application
  - `packages/ui` - Shared UI components
- **ORM**: Drizzle with TypeScript schema files
- **Services**: Effect-based services with `Effect.Service` pattern
- **Infrastructure**: Modular infrastructure in `infra/` directory
- **API**: tRPC with Effect context via `ctx.runEffect()`
- **Runtime**: ManagedRuntime with layer composition
- **Database**: PostgreSQL with same data model

**Structure:**
```
sst-mono-repo/
├── packages/
│   ├── core/
│   │   ├── src/db/schema/    # Drizzle schemas
│   │   ├── src/services/     # Effect services
│   │   └── src/trpc/         # API routers
│   ├── functions/
│   │   └── src/workers/      # Lambda handlers
│   ├── web/
│   │   └── src/              # Frontend
│   └── ui/
│       └── src/              # Shared components
├── infra/                    # Modular infrastructure
│   ├── queues.ts
│   ├── websocket.ts
│   └── workers.ts
└── sst.config.ts
```

### Comparison Table

| Aspect | Current (drezzi) | Target (Monorepo) |
|--------|------------------|-------------------|
| Structure | Single app directory | Multi-package monorepo |
| ORM | Prisma (.prisma files) | Drizzle (TypeScript files) |
| Services | async/await functions | Effect services with tagged errors |
| Error Handling | try/catch blocks | Explicit error channels |
| API Context | Direct `ctx.prisma` access | `ctx.runEffect()` pattern |
| Infrastructure | Single SST config | Modular `infra/*.ts` files |
| Type Safety | Good (Prisma) | Excellent (Drizzle + Effect) |
| Observability | Limited logging | Effect spans + tracing |
| Testability | Requires mocks | Effect layers enable easy injection |

---

## Key Technology Migrations

### Prisma → Drizzle ORM

The database layer transitions from Prisma's DSL to Drizzle's TypeScript-first approach.

**Schema Definition Changes:**

```typescript
// Before (Prisma - prisma/schema.prisma)
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}

// After (Drizzle - packages/core/src/db/schema/auth.ts)
export const user = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});
```

**Query Pattern Transformations:**

```typescript
// Before (Prisma)
const users = await prisma.user.findMany({
  where: { email: "user@example.com" }
});

// After (Drizzle)
const users = await db
  .select()
  .from(user)
  .where(eq(user.email, "user@example.com"));
```

**Type Export Patterns:**

```typescript
// Zod schema integration
export const userInsert = createInsertSchema(user);
export type User = typeof user.$inferSelect;
export type UserInsert = typeof user.$inferInsert;
```

### Async/Await → Effect

Service logic transitions from plain async functions to Effect-based services.

**Service Class Pattern:**

```typescript
export class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      return {
        myMethod: (input) =>
          Effect.tryPromise({
            try: () => db.select().from(table).where(eq(table.field, input)),
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

**Tagged Error Definitions:**

```typescript
export class MyServiceError extends Data.TaggedError("MyServiceError")<{
  cause: unknown;
}> {}
```

**Effect Operators:**
- `tryPromise`: Convert Promise to Effect
- `withSpan`: Add distributed tracing
- `pipe`: Compose operations
- `gen`: Generator-based async operations

### tRPC Context Changes

API layer transitions from direct Prisma access to Effect execution.

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

**Error Mapping to TRPCError:**
Effect errors are automatically mapped to tRPC errors in the context layer.

### Infrastructure Modularization

Infrastructure moves from monolithic SST config to modular files.

```typescript
// Before (single sst.config.ts)
const queue = new sst.aws.Queue("Queue");

// After (infra/queues.ts)
export const tryOnQueue = new sst.aws.Queue("TryOnQueue");
export const upscaleQueue = new sst.aws.Queue("UpscaleQueue");
```

**Resource Linking Patterns:**
```typescript
// infra/workers.ts
import { tryOnQueue } from "./queues";
tryOnQueue.subscribe("packages/functions/src/workers/try-on.handler");
```

---

## Migration Phases Overview

The migration follows a 6-phase approach over approximately 17 days.

| Phase | Duration | Focus | Key Deliverables |
|-------|----------|-------|------------------|
| 1 | 3 days | Database Schema Conversion | All Drizzle schemas, migration scripts |
| 2 | 4 days | Effect-based Services | 8+ Effect services with tagged errors |
| 3 | 3 days | tRPC Router Migration | All tRPC routers using Effect context |
| 4 | 2 days | Workers/Functions | Lambda workers, SQS handlers |
| 5 | 3 days | Web Package | UI components, routes, updated imports |
| 6 | 2 days | Infrastructure | Modular SST config, deployment |

**Total Timeline: ~17 days**

**Dependencies:**
- Phase 2 depends on Phase 1 completion (schema must exist first)
- Phase 3 depends on Phase 2 completion (services must be implemented)
- Phases 4, 5, and 6 can proceed in parallel after Phase 3

For detailed implementation steps for each phase, see [monorepo-migration-phases.md](./monorepo-migration-phases.md).

---

## Data Model Overview

The migration covers 12 Prisma models to be converted to Drizzle schemas.

### P0 - Critical Path (Must Migrate First)

| Models | Target File | Priority |
|--------|-------------|----------|
| User, Session, Account, Verification | `auth.ts` (extend existing) | P0 |
| File | `file.ts` (new) | P0 |

These models form the foundation:
- **Auth models** - Authentication, sessions, OAuth (already exists, extend)
- **File** - S3 file tracking, presigned URLs

### P1 - Core Features (Business Logic)

| Models | Target File | Priority |
|--------|-------------|----------|
| BodyProfile | `body-profile.ts` (new) | P1 |
| Garment | `garment.ts` (new) | P1 |
| TryOn | `try-on.ts` (new) | P1 |

These models support primary app features:
- **BodyProfile** - User measurements and photos
- **Garment** - Clothing catalog with metadata
- **TryOn** - AI try-on results and processing status

### P2 - Secondary Features (Nice-to-Have)

| Models | Target File | Priority |
|--------|-------------|----------|
| Lookbook, LookbookItem | `lookbook.ts` (new) | P2 |
| StyleTip | `style-tip.ts` (new) | P2 |
| CreditWallet, Payment, CreditTransaction | `credits.ts` (new) | P2 |

These models support enhanced functionality:
- **Lookbook** - Collection management and sharing
- **StyleTip** - AI-generated styling advice
- **Credits** - Stripe payments, credit system

### Existing Model (Keep Unchanged)

| Model | Target File | Priority |
|--------|-------------|----------|
| Todo | `todo.ts` (keep) | N/A |

The Todo model already exists in the target monorepo pattern - no changes needed.

---

## Benefits

### Type Safety

- **End-to-end TypeScript**: Drizzle infers types directly from schema definitions
- **Compile-time validation**: Zod schemas derived from Drizzle types
- **No runtime type errors**: Type propagation from database to frontend

### Error Handling

- **Explicit error channels**: Effect separates success and error paths
- **Tagged errors**: Structured error types for predictable error handling
- **Composable error recovery**: Effect operators for error handling and retries

### Observability

- **Effect spans**: Automatic distributed tracing for service calls
- **DevTools integration**: Real-time Effect execution visualization
- **Structured logging**: Consistent logging across all services

### Modularity

- **Clear package boundaries**: Core, functions, web, UI separation
- **Shared code reuse**: Core package used by functions and web
- **Scalable architecture**: Easy to add mobile app as new package

### Testability

- **Effect layers**: Dependency injection for easy mocking
- **Deterministic execution**: Effect provides predictable test behavior
- **Service isolation**: Each service independently testable

### Developer Experience

- **Better IDE support**: TypeScript completion for database queries
- **Faster iteration**: Modular structure enables faster builds
- **Team collaboration**: Clear ownership of packages

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Database migration failures** | High | Test migrations on copy of production data; keep rollback scripts |
| **Learning curve for Effect** | Medium | Incremental adoption; pair programming; extensive documentation |
| **Service logic bugs during conversion** | High | Maintain test coverage; run existing tests after each service migration |
| **Performance regression with Drizzle** | Medium | Profile Drizzle queries; optimize indexes; benchmark against Prisma |
| **Extended downtime during cutover** | High | Phased rollout; keep drezzi functional until migration complete; blue-green deployment |
| **Data inconsistencies between systems** | High | Use same PostgreSQL database; validate data integrity post-migration |

**Rollback Strategy:**
- Git branches for each phase enable easy reversion
- Keep drezzi functional throughout migration
- Database migrations are reversible with Drizzle
- Feature flags enable gradual rollout of new system

---

## Prerequisites & Getting Started

### Prerequisites

Before starting the migration, ensure you have:

- **Effect Library Knowledge**: Familiarity with Effect basics (Service, tags, operators)
- **Drizzle ORM Understanding**: Review Drizzle documentation for query patterns
- **Development Database**: Access to PostgreSQL development instance
- **s-stories Reference**: Clone s-stories repo for pattern reference
- **AWS Credentials**: For SQS, S3, and other AWS services (if using SST)
- **Node.js/Bun**: Node.js 20+ or Bun 1.0+ installed

### First Steps

**1. Prepare Reference Material**
```bash
# Clone s-stories for pattern reference
git clone <s-stories-repo-url>

# Review existing Prisma schema
cat drezzi/prisma/schema.prisma

# Study target pattern structure
ls s-stories/packages/core/src/db/schema/
```

**2. Understand the Pattern**
- Review `packages/core/src/db/schema/story.ts` for schema patterns
- Study `packages/core/src/services/` for Effect service patterns
- Examine `packages/core/src/trpc/` for router patterns

**3. Start with Phase 1**
Begin with **Phase 1: Database Schema Conversion** as everything else depends on it:
1. Create `enums.ts` with shared enums
2. Convert auth models (extend existing)
3. Create new schema files for each model
4. Generate and test migration
5. Validate data integrity

### Resources

- **Detailed Implementation Guide**: [monorepo-migration-phases.md](./monorepo-migration-phases.md)
- **Effect Documentation**: [effect.website](https://effect.website)
- **Drizzle ORM Docs**: [orm.drizzle.team](https://orm.drizzle.team)
- **s-stories Codebase**: Reference implementation in repository
- **Prisma to Drizzle Guide**: Migration patterns and query comparisons

---

## Quick Reference

### Pattern Conversion Cheat Sheet

#### Query Patterns

```typescript
// Find Many
# Prisma
prisma.model.findMany({ where: { field: value } })

# Drizzle
db.select().from(table).where(eq(table.field, value))

// Find First
# Prisma
prisma.model.findFirst({ where: { field: value } })

# Drizzle
const [result] = await db.select().from(table).where(eq(table.field, value)).limit(1)

// Create
# Prisma
prisma.model.create({ data: { field: value } })

# Drizzle
db.insert(table).values({ field: value }).returning()

// Update
# Prisma
prisma.model.update({ where: { id }, data: { field: newValue } })

# Drizzle
db.update(table).set({ field: newValue }).where(eq(table.id, id)).returning()

// Delete
# Prisma
prisma.model.delete({ where: { id } })

# Drizzle
db.delete(table).where(eq(table.id, id)).returning()

// Transaction
# Prisma
prisma.$transaction(async (tx) => { ... })

# Drizzle
db.transaction(async (tx) => { ... })
```

#### Where Clause Operators

```typescript
// Equals
# Prisma: { field: value }
# Drizzle: eq(table.field, value)

// In Array
# Prisma: { field: { in: [a, b, c] } }
# Drizzle: inArray(table.field, [a, b, c])

// Contains
# Prisma: { field: { contains: "text" } }
# Drizzle: like(table.field, "%text%")

// AND
# Prisma: { AND: [{ a: 1 }, { b: 2 }] }
# Drizzle: and(eq(table.a, 1), eq(table.b, 2))

// OR
# Prisma: { OR: [{ a: 1 }, { b: 2 }] }
# Drizzle: or(eq(table.a, 1), eq(table.b, 2))
```

#### Service Pattern Template

```typescript
import { Data, Effect } from "effect";
import { eq } from "drizzle-orm";
import { DatabaseService } from "./database";
import { myTable, type MyTableInsert } from "../db/schema";

// Define tagged errors
export class MyServiceError extends Data.TaggedError("MyServiceError")<{
  cause: unknown;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  id: string;
}> {}

// Create Effect service
export class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      const { db } = yield* DatabaseService;

      return {
        // CRUD operations
        byId: (id: string) =>
          Effect.gen(function* () {
            const results = yield* Effect.tryPromise({
              try: () => db.select().from(myTable).where(eq(myTable.id, id)),
              catch: (error) => new MyServiceError({ cause: error }),
            });
            const [item] = results;
            if (!item) return yield* Effect.fail(new NotFoundError({ id }));
            return item;
          }).pipe(Effect.withSpan("MyService.byId")),

        create: (input: MyTableInsert) =>
          Effect.tryPromise({
            try: () => db.insert(myTable).values(input).returning(),
            catch: (error) => new MyServiceError({ cause: error }),
          }).pipe(
            Effect.map((results) => results[0]!),
            Effect.withSpan("MyService.create")
          ),
      };
    }),
    dependencies: [DatabaseService.Default],
  }
) {}
```

#### tRPC Router Pattern

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { MyService } from "../../services/my-service";
import { myTableInsert } from "../../db/schema";

export const myRouter = createTRPCRouter({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.runEffect(MyService.list(ctx.user.id))
  ),

  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.runEffect(MyService.byId(input.id))
    ),

  create: protectedProcedure
    .input(myTableInsert)
    .mutation(({ ctx, input }) =>
      ctx.runEffect(MyService.create(input))
    ),
});
```

---

## Next Steps

1. **Review the detailed phases** in [monorepo-migration-phases.md](./monorepo-migration-phases.md)
2. **Set up development environment** with s-stories reference
3. **Begin Phase 1** (Database Schema Conversion)
4. **Track progress** using the checklists provided in each phase
5. **Validate at each phase** before proceeding to the next

**Estimated Timeline**: 17 days total (approximately 2-3 weeks)

Good luck with your migration! 🚀
