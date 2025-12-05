// import "dotenv/config";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";

import { prisma } from "@/lib/prisma";

const s3 = new S3Client({
  region: "us-east-2",
  credentials: fromIni({ profile: "developer-dev" }),
});
const BUCKET = process.env.S3_BUCKET_NAME ?? "";
console.log("BUCKET", BUCKET);

function generateId() {
  return crypto.randomUUID();
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToS3(key: string, body: Buffer): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/jpeg",
    })
  );
  return `https://${BUCKET}.s3.us-east-2.amazonaws.com/${key}`;
}

async function seedImage(
  category: string,
  filename: string
): Promise<{ key: string; url: string }> {
  const key = `${category}/seed/${filename}.jpg`;
  const picsumUrl = `https://picsum.photos/seed/drezzi-${filename}/400/600`;

  console.log(`  Downloading ${picsumUrl}...`);
  const image = await downloadImage(picsumUrl);

  console.log(`  Uploading to S3 as ${key}...`);
  const url = await uploadToS3(key, image);

  return { key, url };
}

const USER_EMAIL = "fjaradev@gmail.com";
const USER_NAME = "Franklin";

// ============================================================================
// BODY PROFILES DATA
// ============================================================================
const bodyProfilesData = [
  {
    name: "Default Profile",
    photoUrl: "https://picsum.photos/seed/drezzi-profile1/400/600",
    photoKey: "profiles/seed/profile1.jpg",
    height: 175,
    waist: 81,
    hip: 97,
    inseam: 81,
    chest: 97,
    fitPreference: "regular",
    isDefault: true,
  },
  {
    name: "Athletic Fit",
    photoUrl: "https://picsum.photos/seed/drezzi-profile2/400/600",
    photoKey: "profiles/seed/profile2.jpg",
    height: 175,
    waist: 76,
    hip: 94,
    inseam: 81,
    chest: 102,
    fitPreference: "slim",
    isDefault: false,
  },
];

// ============================================================================
// GARMENTS DATA
// ============================================================================
const garmentsData = [
  {
    name: "Classic White Oxford Shirt",
    description:
      "Crisp cotton oxford shirt perfect for business casual settings",
    category: "tops",
    subcategory: "shirts",
    brand: "Uniqlo",
    price: 39.9,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment1/400/600",
    imageKey: "garments/seed/garment1.jpg",
    colors: ["white"],
    sizes: ["S", "M", "L", "XL"],
    tags: ["business", "casual", "classic", "essential"],
    isActive: true,
    isPublic: false,
  },
  {
    name: "Navy Blue Blazer",
    description:
      "Tailored navy blazer with gold buttons for a sophisticated look",
    category: "outerwear",
    subcategory: "blazers",
    brand: "Zara",
    price: 129.0,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment2/400/600",
    imageKey: "garments/seed/garment2.jpg",
    colors: ["navy"],
    sizes: ["S", "M", "L"],
    tags: ["formal", "business", "classic"],
    isActive: true,
    isPublic: false,
  },
  {
    name: "Slim Fit Chinos - Khaki",
    description: "Versatile slim fit chinos in a neutral khaki tone",
    category: "bottoms",
    subcategory: "pants",
    brand: "Gap",
    price: 59.95,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment3/400/600",
    imageKey: "garments/seed/garment3.jpg",
    colors: ["khaki", "beige"],
    sizes: ["28", "30", "32", "34", "36"],
    tags: ["casual", "business-casual", "versatile"],
    isActive: true,
    isPublic: false,
  },
  {
    name: "Black Skinny Jeans",
    description: "Classic black skinny jeans with stretch for comfort",
    category: "bottoms",
    subcategory: "jeans",
    brand: "Levi's",
    price: 79.5,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment4/400/600",
    imageKey: "garments/seed/garment4.jpg",
    colors: ["black"],
    sizes: ["28", "30", "32", "34"],
    tags: ["casual", "everyday", "versatile"],
    isActive: true,
    isPublic: false,
  },
  {
    name: "Floral Summer Dress",
    description: "Light and breezy floral midi dress perfect for summer",
    category: "dresses",
    subcategory: "midi",
    brand: "H&M",
    price: 49.99,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment5/400/600",
    imageKey: "garments/seed/garment5.jpg",
    colors: ["pink", "green", "white"],
    sizes: ["XS", "S", "M", "L"],
    tags: ["summer", "casual", "feminine", "floral"],
    isActive: true,
    isPublic: false,
  },
  {
    name: "Striped Polo Shirt",
    description: "Cotton polo with classic horizontal stripes",
    category: "tops",
    subcategory: "polos",
    brand: "Ralph Lauren",
    price: 89.0,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment6/400/600",
    imageKey: "garments/seed/garment6.jpg",
    colors: ["navy", "white"],
    sizes: ["S", "M", "L", "XL"],
    tags: ["casual", "preppy", "weekend"],
    isActive: true,
    isPublic: false,
  },
  {
    name: "Cashmere Crewneck Sweater",
    description: "Luxuriously soft cashmere sweater in charcoal gray",
    category: "tops",
    subcategory: "sweaters",
    brand: "Everlane",
    price: 145.0,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment7/400/600",
    imageKey: "garments/seed/garment7.jpg",
    colors: ["gray", "charcoal"],
    sizes: ["S", "M", "L"],
    tags: ["luxury", "cozy", "winter", "classic"],
    isActive: true,
    isPublic: false,
  },
  {
    name: "Denim Jacket - Medium Wash",
    description: "Classic denim jacket with a modern relaxed fit",
    category: "outerwear",
    subcategory: "jackets",
    brand: "Madewell",
    price: 118.0,
    currency: "USD",
    imageUrl: "https://picsum.photos/seed/drezzi-garment8/400/600",
    imageKey: "garments/seed/garment8.jpg",
    colors: ["blue", "denim"],
    sizes: ["XS", "S", "M", "L", "XL"],
    tags: ["casual", "layering", "classic", "versatile"],
    isActive: true,
    isPublic: false,
  },
];

// ============================================================================
// STYLE TIPS TEMPLATES (per garment type)
// ============================================================================
function generateStyleTips(garmentName: string, garmentCategory: string) {
  const tips: Record<string, Record<string, string>> = {
    tops: {
      fit: `The ${garmentName} fits well through the shoulders and chest. Consider your preferred sleeve length for the perfect fit.`,
      color:
        "This top pairs beautifully with navy, khaki, or dark denim. For a bold look, try contrasting with burgundy or forest green.",
      style:
        "Tuck it in for a polished appearance, or leave it untucked for a relaxed weekend vibe. Roll the sleeves for added casual flair.",
      occasion:
        "Perfect for business casual environments, weekend brunches, or smart-casual dinner dates.",
      accessories:
        "Complete the look with a classic leather belt, minimalist watch, and loafers or clean white sneakers.",
      "fabric-care":
        "Machine wash cold on gentle cycle. Hang dry or tumble dry low. Iron on medium heat if needed.",
    },
    bottoms: {
      fit: "These bottoms sit comfortably at the waist with a flattering leg line. The length works well with both sneakers and dress shoes.",
      color:
        "The neutral tone makes these incredibly versatile. Pair with white, navy, or earth tones for a cohesive look.",
      style:
        "Cuff the hem slightly for a modern touch, or let them fall naturally for a classic silhouette.",
      occasion:
        "Great for office wear, casual Fridays, weekend outings, or date nights depending on how you style them.",
      accessories:
        "A quality leather belt is essential. Consider matching your watch strap and shoes for a polished appearance.",
      "fabric-care": `Wash inside out in cold water to preserve color. Avoid over-drying to maintain the fabric's integrity.`,
    },
    dresses: {
      fit: "The silhouette flatters your figure beautifully. The waist hits at the right point for an elongating effect.",
      color:
        "The pattern and colors complement many skin tones. Layer with neutral accessories to let the dress shine.",
      style:
        "Style up with heels and statement jewelry, or dress down with sandals and a denim jacket for daytime.",
      occasion:
        "Ideal for garden parties, summer weddings, beach vacations, or any occasion calling for effortless elegance.",
      accessories:
        "Add delicate gold jewelry, a woven bag, and strappy sandals. A wide-brim hat completes the summer look.",
      "fabric-care":
        "Hand wash or use delicate cycle in cold water. Lay flat to dry to maintain shape. Steam to remove wrinkles.",
    },
    outerwear: {
      fit: `The shoulder seams align perfectly and there's enough room for layering underneath without feeling bulky.`,
      color: `This versatile piece works with virtually everything in your wardrobe. It's a true wardrobe staple.`,
      style:
        "Layer over casual tees for weekend looks, or pair with button-downs for a more refined appearance.",
      occasion:
        "From casual coffee runs to smart-casual dinners, this piece transitions seamlessly between occasions.",
      accessories:
        "Pair with a quality scarf in cooler weather, or add sunglasses and a crossbody bag for a complete look.",
      "fabric-care":
        "Spot clean when possible. For full washing, follow care label instructions. Store on a proper hanger.",
    },
  };

  const categoryTips = tips[garmentCategory] ?? tips.tops;
  return Object.entries(categoryTips).map(([category, content]) => ({
    category,
    content,
  }));
}

// ============================================================================
// TRY-ONS DATA (references by index)
// ============================================================================
const tryOnsConfig = [
  { profileIndex: 0, garmentIndex: 0, isFavorite: true },
  { profileIndex: 0, garmentIndex: 1, isFavorite: true },
  { profileIndex: 0, garmentIndex: 2, isFavorite: false },
  { profileIndex: 0, garmentIndex: 4, isFavorite: true },
  { profileIndex: 1, garmentIndex: 5, isFavorite: false },
  { profileIndex: 1, garmentIndex: 7, isFavorite: true },
];

// ============================================================================
// LOOKBOOKS DATA
// ============================================================================
const lookbooksData = [
  {
    name: "Summer Collection",
    description: "Light and breezy looks perfect for warm weather adventures",
    isPublic: true,
    shareSlug: "summer-2024",
    itemIndexes: [3, 4, 5],
    notes: [
      "Perfect for beach vacations",
      "My go-to summer dress",
      "Great for weekend brunches",
    ],
  },
  {
    name: "Work Wardrobe",
    description: "Professional yet stylish outfits for the office",
    isPublic: false,
    shareSlug: "work-essentials",
    itemIndexes: [0, 1],
    notes: ["Classic business casual", "For important meetings"],
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function main() {
  console.log("Starting database seeding for", USER_EMAIL);

  // 1. Upsert user
  console.log("Upserting user...");
  const user = await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {},
    create: {
      id: generateId(),
      name: USER_NAME,
      email: USER_EMAIL,
      emailVerified: true,
    },
  });
  console.log(`  User: ${user.name} (${user.id})`);

  // 2. Clear existing data for user (in correct order for foreign key constraints)
  console.log("Clearing existing data...");
  await prisma.lookbook.deleteMany({ where: { userId: user.id } });
  await prisma.tryOn.deleteMany({ where: { userId: user.id } });
  await prisma.garment.deleteMany({ where: { userId: user.id } });
  await prisma.bodyProfile.deleteMany({ where: { userId: user.id } });
  console.log("  Cleared lookbooks, try-ons, garments, and body profiles");

  // 3. Upload and create BodyProfiles
  console.log("Uploading profile images and creating body profiles...");
  const profiles: Awaited<ReturnType<typeof prisma.bodyProfile.create>>[] = [];
  for (const [idx, p] of bodyProfilesData.entries()) {
    const { key, url } = await seedImage("profiles", `profile${idx + 1}`);
    const profile = await prisma.bodyProfile.create({
      data: {
        name: p.name,
        photoUrl: url,
        photoKey: key,
        height: p.height,
        waist: p.waist,
        hip: p.hip,
        inseam: p.inseam,
        chest: p.chest,
        fitPreference: p.fitPreference,
        isDefault: p.isDefault,
        userId: user.id,
      },
    });
    profiles.push(profile);
  }
  console.log(`  Created ${profiles.length} body profiles with S3 images`);

  // 4. Upload and create Garments
  console.log("Uploading garment images and creating garments...");
  const garments: Awaited<ReturnType<typeof prisma.garment.create>>[] = [];
  for (const [idx, g] of garmentsData.entries()) {
    const { key, url } = await seedImage("garments", `garment${idx + 1}`);
    const garment = await prisma.garment.create({
      data: {
        name: g.name,
        description: g.description,
        category: g.category,
        subcategory: g.subcategory,
        brand: g.brand,
        price: g.price,
        currency: g.currency,
        imageUrl: url,
        imageKey: key,
        colors: g.colors,
        sizes: g.sizes,
        tags: g.tags,
        isActive: g.isActive,
        isPublic: g.isPublic,
        userId: user.id,
      },
    });
    garments.push(garment);
  }
  console.log(`  Created ${garments.length} garments with S3 images`);

  // 5. Upload and create TryOns with StyleTips
  console.log(
    "Uploading try-on results and creating try-ons with style tips..."
  );
  const tryOns: Awaited<ReturnType<typeof prisma.tryOn.create>>[] = [];
  for (const [idx, config] of tryOnsConfig.entries()) {
    const garment = garments[config.garmentIndex];
    const styleTips = generateStyleTips(garment.name, garment.category);
    const { key, url } = await seedImage("try-ons", `tryon${idx + 1}`);

    const tryOn = await prisma.tryOn.create({
      data: {
        userId: user.id,
        bodyProfileId: profiles[config.profileIndex].id,
        garmentId: garment.id,
        status: "completed",
        resultUrl: url,
        resultKey: key,
        processingMs: 7000 + Math.floor(Math.random() * 4000),
        confidenceScore: 0.85 + Math.random() * 0.14,
        isFavorite: config.isFavorite,
        completedAt: new Date(
          Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)
        ),
        styleTips: {
          create: styleTips,
        },
      },
    });
    tryOns.push(tryOn);
  }
  console.log(
    `  Created ${tryOns.length} try-ons with ${tryOns.length * 6} style tips and S3 images`
  );

  // 6. Create Lookbooks with Items
  console.log("Creating lookbooks...");
  const lookbooks = await Promise.all(
    lookbooksData.map((lb) =>
      prisma.lookbook.create({
        data: {
          userId: user.id,
          name: lb.name,
          description: lb.description,
          isPublic: lb.isPublic,
          shareSlug: lb.shareSlug,
          items: {
            create: lb.itemIndexes.map((tryOnIdx, order) => ({
              tryOnId: tryOns[tryOnIdx].id,
              order,
              note: lb.notes?.[order],
            })),
          },
        },
      })
    )
  );
  console.log(`  Created ${lookbooks.length} lookbooks`);

  // Summary
  console.log("\nSeeding completed successfully!");
  console.log("Summary:");
  console.log(`  - User: ${user.email}`);
  console.log(`  - Body Profiles: ${profiles.length}`);
  console.log(`  - Garments: ${garments.length}`);
  console.log(`  - Try-Ons: ${tryOns.length}`);
  console.log(`  - Style Tips: ${tryOns.length * 6}`);
  console.log(`  - Lookbooks: ${lookbooks.length}`);
  console.log(
    `  - Images uploaded to S3: ${profiles.length + garments.length + tryOns.length}`
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
