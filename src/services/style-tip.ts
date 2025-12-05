import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  STYLE_TIP_CATEGORIES,
  type StyleTipCategory,
} from "@/validators/style-tip";

const styleTipSchema = z.object({
  tips: z.array(
    z.object({
      category: z.enum(STYLE_TIP_CATEGORIES),
      content: z.string().min(1).max(500),
    })
  ),
});

type GenerateStyleTipsInput = {
  tryOnId: string;
  garmentName: string;
  garmentCategory: string;
  garmentDescription: string | null;
  garmentColors: string[];
  bodyProfileFitPreference: string;
};

export async function generateStyleTips(input: GenerateStyleTipsInput) {
  const prompt = buildStyleTipPrompt(input);

  const result = await generateObject({
    model: google("gemini-2.5-flash-preview-05-20"),
    schema: styleTipSchema,
    prompt,
  });

  const tips = await prisma.styleTip.createMany({
    data: result.object.tips.map((tip) => ({
      tryOnId: input.tryOnId,
      category: tip.category,
      content: tip.content,
    })),
  });

  return tips;
}

export async function regenerateStyleTips(input: GenerateStyleTipsInput) {
  await prisma.styleTip.deleteMany({
    where: { tryOnId: input.tryOnId },
  });

  return generateStyleTips(input);
}

export async function getTryOnForTipGeneration(tryOnId: string) {
  return prisma.tryOn.findUnique({
    where: { id: tryOnId },
    include: {
      garment: {
        select: {
          name: true,
          category: true,
          description: true,
          colors: true,
        },
      },
      bodyProfile: {
        select: {
          fitPreference: true,
        },
      },
    },
  });
}

function buildStyleTipPrompt(input: GenerateStyleTipsInput): string {
  const colorInfo =
    input.garmentColors.length > 0
      ? `Colors: ${input.garmentColors.join(", ")}`
      : "Colors: Not specified";

  const descInfo = input.garmentDescription
    ? `Description: ${input.garmentDescription}`
    : "";

  return `You are a professional fashion stylist providing personalized style advice.

Analyze this virtual try-on and provide exactly 6 style tips, one for each category.

GARMENT DETAILS:
- Name: ${input.garmentName}
- Category: ${input.garmentCategory}
- ${colorInfo}
${descInfo}

USER PREFERENCES:
- Fit preference: ${input.bodyProfileFitPreference}

Provide one actionable, specific tip for each category:

1. FIT: How the garment should fit on the body. Consider the user's fit preference (${input.bodyProfileFitPreference}). Include specific adjustments like "try sizing down" or "looks perfect as-is".

2. COLOR: Color coordination advice. Suggest complementary colors for pants/accessories. Mention colors to avoid if relevant.

3. STYLE: Overall styling approach. Is this casual, business, formal? Suggest how to style it up or down.

4. OCCASION: When and where to wear this. Be specific (e.g., "perfect for casual Friday at the office" or "ideal for weekend brunch").

5. ACCESSORIES: Specific accessory recommendations. Mention watches, belts, jewelry, bags, hats that would complement this garment.

6. FABRIC-CARE: Care instructions and maintenance tips. Include washing temperature, ironing needs, storage recommendations.

Keep each tip concise (1-2 sentences), actionable, and specific to this garment.`;
}

export const CATEGORY_LABELS: Record<StyleTipCategory, string> = {
  fit: "Fit",
  color: "Color",
  style: "Style",
  occasion: "Occasion",
  accessories: "Accessories",
  "fabric-care": "Fabric Care",
};

export const CATEGORY_ICONS: Record<StyleTipCategory, string> = {
  fit: "Ruler",
  color: "Palette",
  style: "Sparkles",
  occasion: "Calendar",
  accessories: "Watch",
  "fabric-care": "Shirt",
};
