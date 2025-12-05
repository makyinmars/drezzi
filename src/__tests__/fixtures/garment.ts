type GarmentFixtureOverrides = {
  id?: string;
  userId?: string;
  name?: string;
  description?: string | null;
  category?: string;
  subcategory?: string | null;
  brand?: string | null;
  price?: number | null;
  currency?: string;
  imageUrl?: string;
  imageKey?: string;
  maskUrl?: string | null;
  retailUrl?: string | null;
  colors?: string[];
  sizes?: string[];
  tags?: string[];
  metadata?: object | null;
  isActive?: boolean;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export function createGarmentFixture(overrides: GarmentFixtureOverrides = {}) {
  const id = overrides.id ?? "clxyz123garmentid";
  const userId = overrides.userId ?? "test-user-id";
  return {
    id,
    userId,
    name: overrides.name ?? "Blue Oxford Shirt",
    description:
      overrides.description ??
      "Classic cotton oxford button-down shirt in navy blue",
    category: overrides.category ?? "tops",
    subcategory: overrides.subcategory ?? "shirts",
    brand: overrides.brand ?? "J.Crew",
    price: overrides.price ?? 89.99,
    currency: overrides.currency ?? "USD",
    imageUrl:
      overrides.imageUrl ??
      `https://test-media-bucket.s3.us-east-2.amazonaws.com/garments/${userId}/${id}.jpg`,
    imageKey: overrides.imageKey ?? `garments/${userId}/${id}.jpg`,
    maskUrl: overrides.maskUrl ?? null,
    retailUrl: overrides.retailUrl ?? "https://jcrew.com/shirts/oxford",
    colors: overrides.colors ?? ["navy", "blue"],
    sizes: overrides.sizes ?? ["S", "M", "L", "XL"],
    tags: overrides.tags ?? ["casual", "office", "oxford"],
    metadata: overrides.metadata ?? null,
    isActive: overrides.isActive ?? true,
    isPublic: overrides.isPublic ?? false,
    createdAt: overrides.createdAt ?? new Date("2024-01-05T00:00:00Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-05T00:00:00Z"),
  };
}

export function createPublicGarment(overrides: GarmentFixtureOverrides = {}) {
  return createGarmentFixture({
    ...overrides,
    isPublic: true,
    userId: overrides.userId ?? "public-catalog-user",
  });
}
