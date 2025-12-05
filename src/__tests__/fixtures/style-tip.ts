import type { StyleTipCategory } from "@/validators/style-tip";

type StyleTipFixtureOverrides = {
  id?: string;
  tryOnId?: string;
  category?: StyleTipCategory;
  content?: string;
  createdAt?: Date;
};

export function createStyleTipFixture(
  overrides: StyleTipFixtureOverrides = {}
) {
  return {
    id: overrides.id ?? "clxyz123tipid",
    tryOnId: overrides.tryOnId ?? "clxyz123tryonid",
    category: overrides.category ?? "fit",
    content:
      overrides.content ??
      "This garment fits well with your regular fit preference.",
    createdAt: overrides.createdAt ?? new Date("2024-01-15T10:00:06Z"),
  };
}

export function createAllStyleTipsFixture(tryOnId = "clxyz123tryonid") {
  const categories: StyleTipCategory[] = [
    "fit",
    "color",
    "style",
    "occasion",
    "accessories",
    "fabric-care",
  ];

  const contents: Record<StyleTipCategory, string> = {
    fit: "This garment fits well with your regular fit preference. Consider sizing down for a slimmer look.",
    color:
      "The navy blue pairs excellently with khaki, white, and light gray bottoms.",
    style:
      "Perfect for smart casual occasions. Dress it up with chinos or down with jeans.",
    occasion:
      "Ideal for casual Fridays at the office or weekend brunch with friends.",
    accessories:
      "A leather watch and brown belt would complement this piece nicely.",
    "fabric-care":
      "Machine wash cold, tumble dry low. Iron on medium heat if needed.",
  };

  return categories.map((category, index) =>
    createStyleTipFixture({
      id: `tip-${index + 1}`,
      tryOnId,
      category,
      content: contents[category],
      createdAt: new Date(Date.now() + index * 1000),
    })
  );
}
