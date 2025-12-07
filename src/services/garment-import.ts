import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";

import { GARMENT_CATEGORIES } from "@/validators/garment";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

const extractedGarmentSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.enum(CURRENCIES).default("USD"),
  brand: z.string().nullable(),
  category: z.enum(GARMENT_CATEGORIES).nullable(),
  subcategory: z.string().nullable(),
  colors: z.array(z.string()),
  sizes: z.array(z.string()),
  imageUrl: z.string().url().nullable(),
});

export type ExtractedGarment = z.infer<typeof extractedGarmentSchema>;

const JSON_REGEX = /\{[\s\S]*\}/;

function normalizeImageUrl(imageUrl: string): string {
  if (imageUrl.includes("static.zara.net")) {
    const url = new URL(imageUrl);
    url.searchParams.set("w", "2560");
    return url.toString();
  }
  return imageUrl;
}

export async function importGarmentFromUrl(url: string) {
  const result = await generateText({
    model: google("gemini-2.5-flash"),
    tools: {
      url_context: google.tools.urlContext({}),
    },
    prompt: `Visit this product URL and extract garment information: ${url}

Extract the following details from the product page:
- Product name (required)
- Description (max 500 characters, summarize if longer)
- Price (numeric value only, no currency symbol)
- Currency code (USD, EUR, GBP, CAD, or AUD based on the site)
- Brand name (from the product or retailer)
- Category: must be one of [tops, bottoms, dresses, outerwear, shoes, accessories]
- Subcategory (e.g., t-shirt, jeans, sneakers, jacket)
- Primary colors as an array (e.g., ["black", "white"])
- Available sizes as an array (e.g., ["S", "M", "L", "XL"])
- Main product image URL:
  - For Zara: Find the image URL from static.zara.net/assets/public/... (NOT the old /photos/ format)
  - Get the highest quality/resolution version available
  - Return the complete, absolute URL (not relative paths or data URIs)

Return null for any field you cannot determine with confidence.
For category, use your best judgment based on the product type.

Respond ONLY with valid JSON in this exact format:
{
  "name": "string",
  "description": "string or null",
  "price": number or null,
  "currency": "USD" | "EUR" | "GBP" | "CAD" | "AUD",
  "brand": "string or null",
  "category": "tops" | "bottoms" | "dresses" | "outerwear" | "shoes" | "accessories" | null,
  "subcategory": "string or null",
  "colors": ["string"],
  "sizes": ["string"],
  "imageUrl": "string or null"
}`,
  });

  const jsonMatch = result.text.match(JSON_REGEX);
  if (!jsonMatch) {
    throw new Error("Failed to parse garment data from response");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const extracted = extractedGarmentSchema.parse(parsed);

  if (extracted.imageUrl) {
    extracted.imageUrl = normalizeImageUrl(extracted.imageUrl);
  }

  return extracted;
}

export async function downloadImage(
  imageUrl: string,
  sourceUrl?: string
): Promise<Blob | null> {
  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
  };

  if (sourceUrl) {
    headers.Referer = new URL(sourceUrl).origin;
  }

  const response = await fetch(imageUrl, { headers });

  if (!response.ok) return null;

  return response.blob();
}
