type LookbookFixtureOverrides = {
  id?: string;
  userId?: string;
  name?: string;
  description?: string | null;
  coverUrl?: string | null;
  coverKey?: string | null;
  isPublic?: boolean;
  shareSlug?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export function createLookbookFixture(
  overrides: LookbookFixtureOverrides = {}
) {
  const id = overrides.id ?? "clxyz123lookbookid";
  return {
    id,
    userId: overrides.userId ?? "test-user-id",
    name: overrides.name ?? "Summer Collection 2024",
    description: overrides.description ?? "My favorite summer outfits",
    coverUrl: overrides.coverUrl ?? null,
    coverKey: overrides.coverKey ?? null,
    isPublic: overrides.isPublic ?? false,
    shareSlug: overrides.shareSlug ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-10T00:00:00Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-10T00:00:00Z"),
  };
}

export function createPublicLookbook(overrides: LookbookFixtureOverrides = {}) {
  return createLookbookFixture({
    ...overrides,
    isPublic: true,
    shareSlug: overrides.shareSlug ?? "summer-collection-2024-abc123-xyz9",
  });
}

type LookbookItemFixtureOverrides = {
  id?: string;
  lookbookId?: string;
  tryOnId?: string;
  order?: number;
  note?: string | null;
  createdAt?: Date;
};

export function createLookbookItemFixture(
  overrides: LookbookItemFixtureOverrides = {}
) {
  return {
    id: overrides.id ?? "clxyz123itemid",
    lookbookId: overrides.lookbookId ?? "clxyz123lookbookid",
    tryOnId: overrides.tryOnId ?? "clxyz123tryonid",
    order: overrides.order ?? 0,
    note: overrides.note ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-10T00:00:00Z"),
  };
}
