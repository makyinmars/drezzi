# Effect 4 Beta Implementation Guide

This guide maps the Effect usage in `/Users/franklin/Development/OpenSource/opencode/packages/opencode` onto Drezzi. It is intentionally an implementation plan, not an application code change.

## Source Baseline

The reference package pins Effect 4 beta:

- `effect`: `4.0.0-beta.46`
- `@effect/platform-node`: `4.0.0-beta.46`
- Reference package: `/Users/franklin/Development/OpenSource/opencode/packages/opencode`

Drezzi currently does not have `effect` as a direct dependency. The installed `node_modules/effect` in this project is transitive and is `3.18.4`, pulled by another dependency. Do not build against that transitive package.

If Drezzi follows the opencode implementation, add a direct dependency on the same Effect 4 beta version first. If choosing a newer Effect 4 beta instead, validate the service API against the current Effect source before writing application code, because the beta surface is still moving.

## What Opencode Is Doing

Opencode uses Effect as a server-side runtime and dependency boundary. It does not use Effect for UI state.

The main patterns are:

- Service modules expose an `Interface`, a `Service` tag, a `layer`, and often a `defaultLayer`.
- Service methods return `Effect.Effect` instead of raw promises.
- Public non-Effect callers use runtime adapters such as `runPromise`, `runSync`, `runFork`, and `runCallback`.
- `Layer.mergeAll` builds the full application graph.
- `ManagedRuntime.make` creates a shared runtime from that layer graph.
- `Layer.makeMemoMapUnsafe` is shared so separately created runtimes can reuse layer memoization.
- `Effect.fn("Name.method")` names service operations for tracing and debugging.
- `Schema.TaggedErrorClass` is used for typed domain errors.
- `Effect.tryPromise`, `Effect.promise`, `Effect.all`, `Effect.forEach`, `Effect.timeout`, `Effect.retry`, `Effect.scoped`, `Effect.acquireRelease`, `Effect.onInterrupt`, and `Effect.ensuring` are used around external calls, concurrency, cleanup, and lifecycle behavior.

Key reference files:

- Runtime composition: `/Users/franklin/Development/OpenSource/opencode/packages/opencode/src/effect/app-runtime.ts`
- Per-service runtime adapter: `/Users/franklin/Development/OpenSource/opencode/packages/opencode/src/effect/run-service.ts`
- Logger integration: `/Users/franklin/Development/OpenSource/opencode/packages/opencode/src/effect/logger.ts`
- Service example with events and streams: `/Users/franklin/Development/OpenSource/opencode/packages/opencode/src/bus/index.ts`
- Service example with storage, typed errors, and migration work: `/Users/franklin/Development/OpenSource/opencode/packages/opencode/src/storage/storage.ts`
- Fiber/concurrency helper: `/Users/franklin/Development/OpenSource/opencode/packages/opencode/src/effect/runner.ts`
- Schema branding example: `/Users/franklin/Development/OpenSource/opencode/packages/opencode/src/session/schema.ts`

## Important Difference For Drezzi

Opencode is a long-running local server/CLI process with workspace-specific in-memory state. Drezzi is a TanStack Start app deployed around server handlers, tRPC procedures, AWS clients, SQS workers, Postgres, Redis, and WebSocket infrastructure.

That means Drezzi should copy the runtime and service-boundary pattern, but should not copy opencode's workspace state model wholesale.

Use:

- Service/layer/runtime structure.
- Named Effect operations.
- Typed domain errors.
- Promise boundary adapters for tRPC and workers.
- Effect concurrency around independent IO.
- Effect cleanup and timeout behavior around external services.

Avoid initially:

- `InstanceState`, `InstanceRef`, and workspace-scoped caches.
- In-process `PubSub` as the source of truth for user-facing events.
- Long-lived runner state unless Drezzi adds a long-running process outside Lambda.
- Moving React components, forms, hooks, or TanStack Query code into Effect.

Drezzi should keep distributed state in Postgres, Redis, SQS, S3, DynamoDB, and API Gateway. Effect should orchestrate these systems, not replace them.

## Recommended Drezzi Module Shape

Add Effect in a small server-only area first:

- `src/effect/runtime.ts`
  - Own the shared `Layer` graph and `ManagedRuntime`.
  - Provide helper functions equivalent to opencode's `makeRuntime`.
  - Keep all runtime helpers server-only.

- `src/effect/logger.ts`
  - Wrap `Effect.log*` into the current console/logging style.
  - Add structured annotations for service, user ID, try-on ID, job ID, queue record ID, and provider.

- `src/effect/errors.ts`
  - Define typed domain errors with `Schema.TaggedErrorClass`.
  - Provide mapping from typed Effect errors to `TRPCError` and worker failure logs.

- `src/effect/services/db.ts`
  - Expose Drizzle as an Effect service.
  - Keep Drizzle query code explicit.
  - Provide transaction helpers so workflows can require a database or transaction context.

- `src/effect/services/s3.ts`
  - Wrap `S3Client.send`.
  - Provide operations for get object bytes, put object, delete object, and presigned URLs.
  - Convert AWS failures into typed storage errors.

- `src/effect/services/sqs.ts`
  - Wrap `SendMessageCommand`.
  - Return typed job IDs.
  - Convert enqueue failures into typed queue errors.

- `src/effect/services/websocket.ts`
  - Wrap the current DynamoDB lookup, stale connection cleanup, and API Gateway post calls.
  - Use bounded `Effect.forEach` concurrency when publishing to many connections.
  - Keep DynamoDB as the source of connection state.

- `src/effect/services/ai.ts`
  - Wrap AI Gateway, Gemini image generation, and FAL upscale.
  - Add timeout and retry policy per provider.
  - Keep provider-specific result validation close to the provider call.

- `src/effect/workflows/try-on.ts`
  - Move the try-on orchestration here after the foundation exists.
  - Model the workflow as fetch images, generate image, upload result, update DB, charge credits, generate tips, publish progress.

- `src/effect/workflows/upscale.ts`
  - Move upscale orchestration here after shared AWS and AI services exist.
  - Model resize, presign, generate, upload, update DB, and publish progress as named Effect steps.

- `src/trpc/effect.ts`
  - Provide one adapter for tRPC procedures to run effects and map typed errors.
  - Keep the router surface compatible with current clients.

## Service Pattern To Use

Match opencode's service module shape, but keep the first implementation small.

Each service should define:

- An `Interface` type with operations returning `Effect.Effect`.
- A service tag.
- A `layer` that builds the live implementation.
- A `defaultLayer` if the service needs dependencies.
- Optional public adapter functions when non-Effect code must call it.

Opencode beta.46 uses `Context.Service` for service tags. Current Effect 4 guidance has been moving toward `ServiceMap.Service` as the primary service API. For Drezzi, make one explicit version decision before coding:

- If pinning exactly to opencode's `4.0.0-beta.46`, use the same `Context.Service` style so copied patterns typecheck consistently.
- If using a newer Effect 4 beta, prefer the current `ServiceMap.Service` style and adjust the runtime helper accordingly.

Do not use old `Context.Tag` or `Context.GenericTag` examples for new code.

## Runtime Pattern To Use

Use one shared server runtime for normal server-side code and narrow service-specific adapters where needed.

The runtime module should provide:

- A shared memo map, equivalent to opencode's `memoMap`.
- An `AppLayer` composed with `Layer.mergeAll`.
- An `AppRuntime` built with `ManagedRuntime.make`.
- A `makeServiceRuntime` helper for modules that expose standalone public functions.
- A small `runEffect` helper for tRPC and worker handlers.

For Drezzi, the app layer should start with infrastructure services only:

- Database.
- S3.
- SQS.
- Redis.
- WebSocket publisher.
- AI providers.
- Logger.
- Environment/resource access.

Do not put every existing service into `AppLayer` on day one. Add services as workflows are migrated.

## tRPC Integration

Keep the current tRPC structure. The first useful integration is an adapter that lets a procedure return an Effect workflow while preserving the same inputs and outputs.

Recommended behavior:

- Procedure validates input with existing Zod validators.
- Procedure passes `ctx.session.user.id`, `ctx.db`, and `ctx.i18n` into an Effect boundary.
- The Effect workflow performs business logic.
- Typed domain errors are mapped to current translated `TRPCError` messages.
- Unknown defects become `INTERNAL_SERVER_ERROR` with logging.

Good first tRPC candidates:

- `tryOn.create`, because it spans DB, validation, SQS, and failure mapping.
- `tryOn.delete`, because it spans DB and S3 cleanup.
- `upscale` procedures, because they span SQS and user-owned entities.

Do not migrate read-only list queries first unless they already need external IO. Plain Drizzle reads are not where Effect gives the most leverage.

## Worker Integration

The SQS workers are the best first full workflow migration because they already have sequential side effects and manual error handling.

For `src/workers/try-on.ts`, model these named steps:

- `TryOnWorker.parseRecord`
- `TryOnWorker.publishQueued`
- `TryOnWorker.fetchImages`
- `TryOnWorker.generateTryOn`
- `TryOnWorker.validateGeneratedImage`
- `TryOnWorker.uploadResult`
- `TryOnWorker.updateResult`
- `TryOnWorker.chargeCredits`
- `TryOnWorker.generateStyleTips`
- `TryOnWorker.publishComplete`
- `TryOnWorker.fail`

For `src/workers/upscale.ts`, model these named steps:

- `UpscaleWorker.parseRecord`
- `UpscaleWorker.publishQueued`
- `UpscaleWorker.fetchSource`
- `UpscaleWorker.resizeIfNeeded`
- `UpscaleWorker.generateUpscale`
- `UpscaleWorker.uploadEnhanced`
- `UpscaleWorker.updateEntity`
- `UpscaleWorker.publishComplete`
- `UpscaleWorker.fail`

Keep SQS batch processing sequential at first to preserve current behavior. Later, use `Effect.forEach` with explicit bounded concurrency if the queue and downstream providers can handle it.

## Error Model

Use typed errors for failures the app expects and can report cleanly:

- `AuthRequiredError`
- `NotFoundError`
- `ForbiddenError`
- `ValidationError`
- `DatabaseError`
- `StorageError`
- `QueueError`
- `WebSocketPublishError`
- `AiProviderError`
- `AiNoImageError`
- `CreditChargeError`
- `TelemetryError`

Map these errors at the boundary:

- tRPC maps to `TRPCError` with current i18n helpers.
- SQS workers log the typed error, update failed status where appropriate, publish failed progress, and then decide whether to rethrow for retry.
- Non-critical side effects such as style-tip generation and telemetry should be recoverable defects or typed errors that do not fail the completed try-on after the result has been saved.

Use `Effect.exit` when a workflow needs to inspect success vs failure and perform custom finalization.

## Concurrency And Cleanup

Use Effect where current code already has manual promise orchestration:

- Replace independent `Promise.all` calls with `Effect.all`.
- Replace publish-to-many `Promise.all` calls with `Effect.forEach` and bounded concurrency.
- Add timeouts around AI provider calls, HTTP fetches, and WebSocket fanout.
- Add retry schedules only around safe, idempotent operations.
- Use `Effect.ensuring` for final status publishing and telemetry completion.
- Use `Effect.acquireRelease` only for resources that truly need lifecycle cleanup.

Recommended initial timeout policy:

- Image fetch from S3 or URL: short timeout, retry only transient network failures.
- AI generation: longer timeout, limited retry only when provider error is known retryable.
- S3 upload: retry transient AWS errors.
- DB update: no blind retry unless operation is idempotent.
- Credit charge: use existing idempotency and convert failures to a recoverable typed error.

## Schema And Validation

Drezzi already uses Zod for forms, tRPC inputs, and existing validators. Keep that.

Use Effect `Schema` for:

- Branded IDs used inside Effect workflows.
- Tagged errors.
- External payload decoding where runtime safety matters, such as SQS record bodies.
- Provider response validation where the data is not controlled by Drezzi.

Do not rewrite all existing Zod validators into Effect Schema. The boundary should be incremental.

## What Not To Copy From Opencode

Do not copy these patterns directly into Drezzi without a specific need:

- `InstanceState` and `ScopedCache` for workspace state.
- `LocalContext` restoration.
- In-memory `Bus` as the durable event system.
- CLI-oriented runtime helpers.
- Process spawning services.
- Long-running `Runner` unless a new Drezzi feature needs cancellable in-process jobs.

Those patterns solve opencode's local process problem. Drezzi's equivalent problem is distributed job orchestration, so the right primitives are typed workflows, AWS service wrappers, and boundary adapters.

## Adoption Order

1. Pin direct Effect 4 beta dependencies.
2. Add `src/effect/logger.ts`, `src/effect/errors.ts`, and `src/effect/runtime.ts`.
3. Add infrastructure service wrappers for DB, S3, SQS, WebSocket, Redis, and AI.
4. Add `src/trpc/effect.ts` to run effects from procedures.
5. Migrate `enqueueTryOnJob` and WebSocket publishing first, because they are narrow.
6. Migrate `tryOn.create` after queue and error mapping are stable.
7. Migrate `src/workers/try-on.ts` as the first full workflow.
8. Migrate `src/workers/upscale.ts`.
9. Add focused tests for service wrappers and workflow failure paths.
10. Consider broader service migration only after the first worker is cleaner and easier to operate.

## Testing Strategy

Use tests around Effect services instead of testing the runtime itself.

Recommended test seams:

- Service layers can be swapped with test layers.
- Worker workflows can run with fake S3, fake AI, fake WebSocket, and a test database transaction.
- Error mapping can be tested without hitting AWS.
- SQS record decoding can be tested with malformed payloads.
- AI no-image responses can be tested as typed failures.

Keep the current Bun test setup. Do not introduce a new test framework just for Effect.

## Success Criteria

The implementation is worth keeping if it delivers these outcomes:

- tRPC procedures keep the same external API.
- Workers have fewer unstructured `catch` blocks.
- AWS, AI, DB, and WebSocket failures are typed and handled consistently.
- Progress events are reliably published on success and failure.
- Retriable and non-retriable failures are explicit.
- Tests can replace infrastructure with layers without monkey-patching module globals.
- React/UI code remains simple and unaffected.
