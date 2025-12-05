type ProfileFixtureOverrides = {
  id?: string;
  userId?: string;
  name?: string;
  photoUrl?: string;
  photoKey?: string;
  height?: number | null;
  waist?: number | null;
  hip?: number | null;
  inseam?: number | null;
  chest?: number | null;
  fitPreference?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export function createProfileFixture(overrides: ProfileFixtureOverrides = {}) {
  const id = overrides.id ?? "clxyz123profileid";
  const userId = overrides.userId ?? "test-user-id";
  return {
    id,
    userId,
    name: overrides.name ?? "Default Profile",
    photoUrl:
      overrides.photoUrl ??
      `https://test-media-bucket.s3.us-east-2.amazonaws.com/profiles/${userId}/${id}.jpg`,
    photoKey: overrides.photoKey ?? `profiles/${userId}/${id}.jpg`,
    height: overrides.height ?? 175,
    waist: overrides.waist ?? 32,
    hip: overrides.hip ?? 38,
    inseam: overrides.inseam ?? 32,
    chest: overrides.chest ?? 40,
    fitPreference: overrides.fitPreference ?? "regular",
    isDefault: overrides.isDefault ?? true,
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01T00:00:00Z"),
  };
}
