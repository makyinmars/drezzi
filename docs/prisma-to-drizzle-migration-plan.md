# Prisma to Drizzle Migration Plan (Drezzi)

Last updated: March 5, 2026

## Objective

Migrate this codebase from Prisma to Drizzle with:

- no data loss
- no schema drift between environments
- no API contract breakage for tRPC consumers
- incremental, reversible rollout

This plan focuses on the current single-repo TanStack Start app (not the older monorepo+Effect rewrite plan).

## Source References

- Drizzle guide: https://orm.drizzle.team/docs/migrate/migrate-from-prisma
- Drizzle Kit commands: https://orm.drizzle.team/kit-docs/commands
- Drizzle Kit `pull`: https://orm.drizzle.team/docs/drizzle-kit-pull
- Better Auth Drizzle adapter: https://www.better-auth.com/docs/adapters/drizzle

Notes:

- The Prisma-to-Drizzle migration guide still shows `drizzle-kit introspect`.
- Current Drizzle Kit docs use `drizzle-kit pull` for introspection. Use `pull` going forward.

## Current-State Inventory (This Repo)

### Schema Surface

- Prisma models: 15
  - `User`, `Session`, `Account`, `Verification`
  - `Todo`
  - `File`, `BodyProfile`, `Garment`, `TryOn`
  - `Lookbook`, `LookbookItem`, `StyleTip`
  - `CreditWallet`, `Payment`, `CreditTransaction`
- Prisma enums: 5
  - `UserRole`, `TodoStatus`, `EnhancementStatus`, `CreditTransactionType`, `PaymentStatus`

### Prisma Coupling

- Runtime Prisma coupling removed from app code.
- Better Auth now uses `drizzleAdapter` in [`src/auth/server.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/auth/server.ts).
- Frontend/validators now use local shared Drizzle enums/types from:
  - [`src/db/enums.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/db/enums.ts)
  - [`src/db/types.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/db/types.ts)
- Remaining Prisma mentions are historical docs and legacy test fixtures only.

### Query Patterns That Need Explicit Drizzle Equivalents

- `findMany/findFirst/findUnique`
- `include/select` relation loading
- callback + array `$transaction(...)`
- `createMany`, `updateMany`, `deleteMany`
- `groupBy` (`garment.categories`)
- `upsert` in seed
- cursor pagination (`credits` history)
- array filters (`hasSome` on `colors`/`tags`)
- nested writes (`styleTips: { create: ... }` in seed)

### Migration-Drift Risk

- [`prisma/migrations/20251204151407_init/migration.sql`](/Users/franklin/Development/WebDev/SST/drezzi/prisma/migrations/20251204151407_init/migration.sql) only covers early auth/todo tables.
- Current `schema.prisma` contains significantly more tables.
- Conclusion: use live DB introspection as baseline source of truth, not Prisma migration history.

## Migration Strategy

Use a staged strangler strategy:

1. Introduce Drizzle in parallel.
2. Migrate query layers domain-by-domain.
3. Keep Prisma only where still needed (temporarily).
4. Cut auth adapter last (or near-last), then remove Prisma entirely.

Why not a big-bang swap:

- too many Prisma touchpoints across routers/services/workers/auth/frontend types
- high transaction and idempotency risk in payments/credits and try-on flows
- easier rollback with incremental cutover

## Phase Plan

Checkboxes below indicate phase-level completion (all exit criteria met).

### Phase Status

- [ ] Phase 0: Preflight and Safety Rails
- [x] Phase 1: Bootstrap Drizzle from Real Database
- [x] Phase 2: DB Runtime and Compatibility Layer
- [x] Phase 3: Schema Normalization and Shared Types
- [x] Phase 4: Incremental Query Migration (Domain Order)
- [x] Phase 5: Better Auth Adapter Cutover
- [x] Phase 6: Prisma Decommission
- [ ] Phase 7: Post-Cutover Validation

## Phase 0: Preflight and Safety Rails

- [ ] Phase complete

Duration: 0.5-1 day

Tasks:

- Freeze schema changes during migration window.
- Capture schema snapshots for each environment (`dev`, `staging`, `prod`):
  - `pg_dump --schema-only ...`
- Record runtime baseline:
  - key endpoint latencies
  - error rates for auth, try-on, credits, webhook
- Add migration tracking doc/checklist in PR template for parity checks.

Exit criteria:

- Verified schema snapshot per env
- Migration branch strategy agreed
- Rollback owner assigned

## Phase 1: Bootstrap Drizzle from Real Database

- [x] Phase complete

Duration: 1 day

Tasks:

- Add dependencies:
  - runtime: `drizzle-orm`
  - dev: `drizzle-kit`, `drizzle-zod`
- Add `drizzle.config.ts` (Postgres, `DATABASE_URL`, schema path, migrations folder).
- Run initial introspection from live schema:
  - `bunx drizzle-kit pull`
- Commit generated schema baseline.
- Keep `_prisma_migrations` table in introspected schema initially; decide later whether to filter it out.

Suggested scripts to add:

- `db:pull`: `drizzle-kit pull`
- `db:generate`: `drizzle-kit generate`
- `db:migrate`: `drizzle-kit migrate`
- `db:push`: `drizzle-kit push`
- `db:check`: `drizzle-kit check`
- `db:studio`: `drizzle-kit studio`

Exit criteria:

- Drizzle can connect and introspect DB successfully
- Generated Drizzle schema reflects all existing tables/enums/indexes
- No application runtime change yet

## Phase 2: DB Runtime and Compatibility Layer

- [x] Phase complete

Duration: 1-2 days

Tasks:

- Add Drizzle DB runtime module (e.g. `src/lib/db.ts`) using existing `pg` pool.
- Add exported types:
  - `Db` (root client)
  - `DbTx` (transaction client)
- Add `db` to tRPC context while keeping `prisma` in parallel.
- Add repository/helper layer for common patterns:
  - pagination helpers
  - `updatedAt` auto-touch helpers for update paths
  - common ownership checks

Important parity detail:

- Prisma `@updatedAt` is automatic.
- Drizzle requires explicit `updatedAt = new Date()` in update code (unless DB triggers are added).

Exit criteria:

- App boots with both clients available in context
- No behavior change
- Typecheck passes

## Phase 3: Schema Normalization and Shared Types

- [x] Phase complete

Duration: 1-2 days

Tasks:

- Refactor pulled schema into domain files (auth, todo, media, try-on, lookbook, credits).
- Add relations for Drizzle relational queries.
- Add shared enum/type exports to replace `generated/prisma/*` usage in frontend and validators.
- Replace Prisma-generated imports in UI/validators with local shared types.

Priority replacements:

- `TodoStatus` (validator and todo components)
- `StyleTip`, `Lookbook`, `Garment`, `BodyProfile`, `TryOn` UI types
- `EnhancementStatus` in services

Exit criteria:

- No frontend/validator imports from `generated/prisma/*`
- tRPC output types still stable
- Typecheck passes

## Phase 4: Incremental Query Migration (Domain Order)

- [x] Phase complete

Duration: 5-8 days total

Rule for each domain:

1. Migrate queries to Drizzle
2. Keep API contracts unchanged
3. Run focused tests/smoke checks
4. Deploy behind small blast radius

Recommended order:

1. `todo` (smallest surface, quick confidence)
2. `styleTip` + simple reads
3. `dashboard` + `user` read-heavy flows
4. `profile` + `garment` + file metadata writes
5. `tryOn` + `lookbook` (multi-join and transaction-heavy)
6. `credits/payment` + Stripe webhook (idempotency-critical)
7. workers (`try-on`, `upscale`) and websocket session checks

High-risk endpoints to gate carefully:

- [`src/trpc/routers/tryOn.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/trpc/routers/tryOn.ts)
- [`src/trpc/routers/lookbook.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/trpc/routers/lookbook.ts)
- [`src/services/credits/wallet.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/services/credits/wallet.ts)
- [`src/lib/payments/checkout.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/lib/payments/checkout.ts)
- [`src/workers/stripe-webhook.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/workers/stripe-webhook.ts)

Exit criteria per migrated domain:

- Functional parity confirmed
- Transaction semantics verified
- Error handling mapped correctly
- No Prisma calls remain in migrated domain

## Phase 5: Better Auth Adapter Cutover

- [x] Phase complete

Duration: 1-2 days

Tasks:

- Switch [`src/auth/server.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/auth/server.ts) from `prismaAdapter` to `drizzleAdapter`.
- Configure provider as `pg`.
- Pass explicit schema map if table names/field names differ from Better Auth defaults.
- Validate Better Auth schema requirements via CLI generation docs:
  - `npx @better-auth/cli@latest generate`
- Re-test:
  - sign up/login/logout
  - OAuth (Google)
  - session lookup (websocket connect path)
  - email OTP flow

Exit criteria:

- Auth fully functional on Drizzle adapter
- No Prisma dependency in auth path

## Phase 6: Prisma Decommission

- [x] Phase complete

Duration: 0.5-1 day

Tasks:

- Remove Prisma runtime and generated client usage:
  - delete [`src/lib/prisma.ts`](/Users/franklin/Development/WebDev/SST/drezzi/src/lib/prisma.ts)
  - remove remaining imports of `generated/prisma/*`
- Remove Prisma packages and scripts from `package.json`.
- Remove stale `prisma/` artifacts only after final verification (or archive intentionally).
- Update docs (`README`, `CLAUDE.md`) to reflect Drizzle commands only.

Exit criteria:

- `rg "prisma|generated/prisma|@prisma" src package.json` returns no runtime usage in application code
- CI/build/typecheck green

## Phase 7: Post-Cutover Validation

- [ ] Phase complete

Duration: 1 day

Current status:

- [x] `bun typecheck`
- [x] `bun check`
- [ ] `bun test` (currently failing in legacy Prisma-mocked service tests and validator fixtures)
- [ ] Manual smoke validation across auth/profile/garment/try-on/lookbook/credits

Tasks:

- Run full checks:
  - `bun typecheck`
  - `bun check`
  - `bun test` (where available)
- Perform manual smoke flows:
  - auth lifecycle
  - profile create/update/upscale
  - garment create/import/update/delete
  - try-on create/retry/delete and websocket progress
  - lookbook create/share/reorder/delete
  - credit purchase/session sync/refund paths

Observability checks:

- Compare query error rates and p95 latency vs baseline
- Review Stripe webhook idempotency behavior

## Prisma-to-Drizzle Query Mapping (Repo-Specific)

| Prisma Pattern | Drizzle Pattern | Used In |
|---|---|---|
| `findFirst/findUnique` | `db.select().from(...).where(...).limit(1)` or `db.query.table.findFirst` | most routers/services |
| `findMany + include` | join/select projection or `db.query.*` with relations | try-on/lookbook/dashboard |
| `$transaction(async tx => ...)` | `db.transaction(async (tx) => { ... })` | garment/profile/tryOn/lookbook/credits |
| `$transaction([q1, q2])` | `db.transaction(async tx => { await ...; await ...; })` | profile service, lookbook reorder |
| `createMany` | `db.insert(table).values([...])` | style tips |
| `updateMany/deleteMany` | `db.update(...).where(...)` / `db.delete(...).where(...)` | credits/webhook/profile |
| `groupBy` | `select({ ..., count: sql\`count(*)\` }).groupBy(...)` | garment categories |
| `upsert` | `insert(...).onConflictDoUpdate(...)` | seed |
| array `hasSome` | Postgres array overlap operator via Drizzle helpers/sql | garment filters |

## Risk Register

1. `updatedAt` regressions
- Risk: stale timestamps after updates.
- Mitigation: enforce update helper or DB trigger strategy.

2. Transaction behavior differences
- Risk: partial writes in multi-step flows.
- Mitigation: wrap all multi-step mutations in `db.transaction`; add focused tests for credits/try-on/lookbook.

3. Auth adapter mismatch
- Risk: Better Auth expects different table mapping.
- Mitigation: explicit schema map in `drizzleAdapter`; verify with Better Auth CLI schema generation docs.

4. Schema drift across envs
- Risk: generated Drizzle schema not matching production.
- Mitigation: introspect each env before migration; do not trust stale Prisma migrations as source-of-truth.

5. Frontend type breakage
- Risk: removal of `generated/prisma/*` breaks UI type imports.
- Mitigation: replace with shared local type exports before removing Prisma.

## Rollback Plan

Rollback level 1 (domain rollback):

- Keep Prisma code path for not-yet-finalized domains.
- Revert domain PR if parity fails.

Rollback level 2 (release rollback):

- Keep previous deploy artifact available.
- Re-deploy prior version if cutover release fails.

Rollback level 3 (schema rollback):

- Prefer no destructive DDL during migration window.
- If DDL is needed later, ship additive-first changes and maintain reversible SQL migrations.

## Definition of Done

- Zero runtime Prisma usage
- Zero imports from `generated/prisma/*`
- Better Auth running via Drizzle adapter
- Drizzle schema + migrations are sole DB source-of-truth
- All critical user journeys validated
- Updated docs/scripts for Drizzle-first workflow

## Suggested Execution Cadence

- Day 1: Phases 0-1
- Day 2-3: Phases 2-3
- Day 4-8: Phase 4 incremental domains
- Day 9: Phase 5 auth cutover
- Day 10: Phases 6-7 and final cleanup

If you want less risk, extend Phase 4 over two weekly releases and cut auth in a separate release.
