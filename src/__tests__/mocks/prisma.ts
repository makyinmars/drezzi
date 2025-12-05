import { mock } from "bun:test";

export function createMockPrisma() {
  return {
    tryOn: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: unknown) =>
        Promise.resolve({ id: "tryon-1", ...(args as { data: object }).data })
      ),
      update: mock((args: unknown) =>
        Promise.resolve({ id: "tryon-1", ...(args as { data: object }).data })
      ),
      delete: mock(() => Promise.resolve({ id: "tryon-1" })),
    },
    lookbook: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: unknown) =>
        Promise.resolve({
          id: "lookbook-1",
          ...(args as { data: object }).data,
        })
      ),
      update: mock((args: unknown) =>
        Promise.resolve({
          id: "lookbook-1",
          ...(args as { data: object }).data,
        })
      ),
      delete: mock(() => Promise.resolve({ id: "lookbook-1" })),
    },
    lookbookItem: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: unknown) =>
        Promise.resolve({ id: "item-1", ...(args as { data: object }).data })
      ),
      update: mock((args: unknown) =>
        Promise.resolve({ id: "item-1", ...(args as { data: object }).data })
      ),
      delete: mock(() => Promise.resolve({ id: "item-1" })),
    },
    styleTip: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: unknown) =>
        Promise.resolve({ id: "tip-1", ...(args as { data: object }).data })
      ),
      createMany: mock(() => Promise.resolve({ count: 6 })),
      update: mock((args: unknown) =>
        Promise.resolve({ id: "tip-1", ...(args as { data: object }).data })
      ),
      delete: mock(() => Promise.resolve({ id: "tip-1" })),
      deleteMany: mock(() => Promise.resolve({ count: 6 })),
    },
    bodyProfile: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: unknown) =>
        Promise.resolve({ id: "profile-1", ...(args as { data: object }).data })
      ),
      update: mock((args: unknown) =>
        Promise.resolve({ id: "profile-1", ...(args as { data: object }).data })
      ),
      updateMany: mock(() => Promise.resolve({ count: 1 })),
      delete: mock(() => Promise.resolve({ id: "profile-1" })),
    },
    garment: {
      findMany: mock(() => Promise.resolve([])),
      findFirst: mock(() => Promise.resolve(null)),
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: unknown) =>
        Promise.resolve({ id: "garment-1", ...(args as { data: object }).data })
      ),
      update: mock((args: unknown) =>
        Promise.resolve({ id: "garment-1", ...(args as { data: object }).data })
      ),
      delete: mock(() => Promise.resolve({ id: "garment-1" })),
    },
    $transaction: mock((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
