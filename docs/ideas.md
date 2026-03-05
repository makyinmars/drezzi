# Drezzi Feature Ideas

A collection of feature ideas and enhancements for the Drezzi virtual try-on platform.

---

## AI/Worker Enhancements

### 1. Profile Photo Enhancement Worker

**Problem:** Users upload profile photos of varying quality - poor lighting, busy backgrounds, awkward poses, or partial body shots. This degrades try-on quality.

**Solution:** Process uploaded profile photos through an AI worker to generate an optimized version for try-on.

**Architecture:**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Profile Upload │ ──> │  SQS Queue       │ ──> │  Enhancement    │
│  (S3 + DB)      │     │  (profile-queue) │     │  Worker         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         v
                                                 ┌─────────────────┐
                                                 │  Gemini/AI      │
                                                 │  Enhancement    │
                                                 └─────────────────┘
                                                         │
                                                         v
                                                 ┌─────────────────┐
                                                 │  S3 + DB Update │
                                                 │  (enhanced key) │
                                                 └─────────────────┘
```

**Implementation:**

1. **New Worker:** `src/workers/profile-enhance.ts`
   - Pattern: Follow `src/workers/try-on.ts` structure
   - Queue: Create `ProfileEnhanceQueue` in SST config
   - Trigger: After profile photo upload completes

2. **AI Prompt Strategy:**

   ```
   Enhance this profile photo for virtual try-on:
   - Ensure full body is visible from head to below knees
   - Standardize to neutral standing pose facing camera
   - Remove or neutralize background to solid color
   - Correct lighting for even illumination
   - Maintain exact facial features and body proportions
   - Output as high-quality fashion photography suitable for garment overlay
   ```

3. **Database Changes:**
   - Add `enhancedPhotoKey` to BodyProfile model
   - Add `enhancementStatus`: pending | processing | completed | failed
   - Try-on worker uses `enhancedPhotoKey` when available, falls back to `photoKey`

4. **Status Updates:**
   - Real-time status via WebSocket or polling
   - Show "Optimizing your photo..." in UI
   - Display before/after comparison when done

**Edge Cases:**

- Photo is already high quality → Still process for consistency
- Face not detected → Flag for manual review, don't block try-on
- Enhancement fails → Use original, log for analysis
- Multiple profiles → Queue with user-level rate limiting

**Success Metrics:**

- Try-on quality scores (A/B test enhanced vs original)
- User satisfaction ratings
- Retry/re-upload rates

---

### 2. Intelligent Background Removal

**Problem:** Profile photos with cluttered backgrounds distract from try-on results and make garment edges look unnatural.

**Solution:** AI-powered background removal that preserves shadows and creates studio-quality profile photos.

**Architecture:**

- Integrate into Profile Enhancement Worker (step in pipeline)
- Or standalone endpoint for real-time preview

**Implementation:**

1. **Approach Options:**
   - **Option A:** Gemini with specific prompt for background removal
   - **Option B:** Dedicated model (remove.bg API, rembg library)
   - **Option C:** Hybrid - detection via Gemini, removal via specialized tool

2. **Background Options:**
   - Solid colors: White, light gray, brand colors
   - Gradient: Subtle professional gradient
   - Custom: User-selected from palette

3. **Shadow Preservation:**
   - Detect and preserve natural shadows
   - Add subtle drop shadow if none exists
   - Ensure grounding so person doesn't "float"

4. **Database Changes:**
   - `backgroundType`: original | removed | custom
   - `backgroundColor`: hex value if custom

**Edge Cases:**

- Clothing blends with background → Use edge detection hints
- Complex hair/accessories → Preserve fine details
- Multiple people in photo → Isolate primary subject

---

### 3. AI Body Measurement Estimation

**Problem:** Users often don't know their exact measurements, leading to inaccurate size recommendations.

**Solution:** Estimate body measurements from profile photos using AI vision.

**Architecture:**

```
Profile Photo → AI Analysis → Estimated Measurements → Size Recommendations
```

**Implementation:**

1. **AI Analysis Pipeline:**
   - Require reference object OR height input for scale
   - Extract: shoulder width, chest, waist, hip, inseam, arm length
   - Confidence scores per measurement

2. **Prompt Strategy:**

   ```
   Analyze this full-body photo and estimate body measurements.
   Reference: Person's stated height is {height}cm.

   Provide estimates in centimeters with confidence levels:
   - Shoulder width
   - Chest circumference
   - Waist circumference
   - Hip circumference
   - Inseam length
   - Arm length

   Format: JSON with measurement and confidence (0-1)
   ```

3. **UI Flow:**
   - User inputs height (required for scale)
   - Show AI-estimated measurements with confidence indicators
   - Allow manual override for each field
   - "These look right" confirmation button

4. **Database:**
   - `measurementSource`: manual | ai_estimated | hybrid
   - Store confidence scores for analytics

**Edge Cases:**

- Loose clothing hides body shape → Request form-fitting photo OR wider confidence intervals
- Unusual poses → Guide user to standard pose
- Low confidence → Highlight fields needing manual input

---

### 4. Multi-Garment Try-On (Outfit Builder)

**Problem:** Users can only try one garment at a time, but outfits are combinations.

**Solution:** Enable trying on multiple garments simultaneously to build complete outfits.

**Architecture:**

```
┌─────────────────┐
│  Outfit Builder │
│  UI Component   │
└────────┬────────┘
         │
         v
┌─────────────────────────────────────┐
│  Layer Composition:                 │
│  1. Base: Profile photo             │
│  2. Bottom: Pants/skirt (optional)  │
│  3. Top: Shirt/blouse               │
│  4. Outer: Jacket/coat (optional)   │
│  5. Accessories (optional)          │
└────────┬────────────────────────────┘
         │
         v
┌─────────────────┐
│  Sequential or  │
│  Batch Try-On   │
└─────────────────┘
```

**Implementation:**

1. **Approach Options:**
   - **Sequential:** Try bottom first, use result as base for top, etc.
   - **Batch prompt:** Send all garments to AI in layered order
   - **Composite:** Generate each separately, AI-composite final

2. **Data Model:**

   ```typescript
   type Outfit = {
     id: string;
     name: string;
     userId: string;
     items: OutfitItem[];
     resultKey?: string;
     createdAt: Date;
   };

   type OutfitItem = {
     garmentId: string;
     layer: "bottom" | "top" | "outer" | "accessory";
     order: number;
   };
   ```

3. **Worker Enhancement:**
   - New `src/workers/outfit-try-on.ts`
   - Accepts array of garments with layer info
   - Processes in correct order
   - Single final result image

4. **UI Components:**
   - Drag-drop outfit builder
   - Layer visualization
   - Save/name outfits
   - Outfit gallery

**Edge Cases:**

- Conflicting layers (two tops) → UI prevents, or shows warning
- Complex layering (tucked shirt) → AI prompt guidance
- Accessory placement → Define anchor points

---

### 5. Try-On Quality Scoring

**Problem:** Some try-on results look better than others, but we don't systematically measure quality.

**Solution:** AI-powered quality assessment of try-on results with automatic retry for low scores.

**Implementation:**

1. **Quality Dimensions:**
   - Garment fit realism (1-10)
   - Edge blending quality (1-10)
   - Lighting consistency (1-10)
   - Pose preservation (1-10)
   - Overall composite quality (1-10)

2. **Scoring Pipeline:**

   ```typescript
   // After try-on generation, before saving
   const qualityScore = await assessTryOnQuality({
     originalProfile: bodyImage,
     garmentImage: garmentImage,
     resultImage: generatedImage,
   });

   if (qualityScore.overall < QUALITY_THRESHOLD) {
     // Retry with adjusted parameters
     // Max 2 retries
   }
   ```

3. **Database:**
   - Add `qualityScore` JSON field to TryOn model
   - Track for analytics and model improvement

4. **User Feedback Loop:**
   - "Rate this try-on" prompt
   - Compare AI score vs user rating
   - Train quality threshold over time

---

### 6. Garment Auto-Categorization

**Problem:** Users must manually select garment category when uploading.

**Solution:** AI automatically detects and suggests garment category, colors, and attributes.

**Implementation:**

1. **Detection Fields:**
   - Category: tops, bottoms, dresses, outerwear, accessories
   - Sub-category: t-shirt, blouse, jeans, skirt, etc.
   - Colors: Primary, secondary, accent
   - Pattern: solid, striped, floral, plaid, etc.
   - Style: casual, formal, sporty, bohemian, etc.

2. **Worker:** `src/workers/garment-analyze.ts`
   - Triggered on garment upload
   - Populates suggested values
   - User confirms or adjusts

3. **Prompt:**

   ```
   Analyze this garment image and provide:
   - Category (tops/bottoms/dresses/outerwear/accessories)
   - Sub-category (specific type)
   - Primary colors (hex codes)
   - Pattern type
   - Style classification
   - Suggested occasions

   Format: JSON
   ```

---

## User Experience Features

### 7. Digital Wardrobe

**Problem:** Users can try garments but have no way to organize what they own vs what they're considering.

**Solution:** Virtual wardrobe to catalog owned items and mix with new pieces.

**Architecture:**

```
┌─────────────────┐
│  Wardrobe       │
├─────────────────┤
│  - Owned Items  │
│  - Wishlist     │
│  - Try History  │
│  - Outfits      │
└─────────────────┘
```

**Implementation:**

1. **Data Model:**

   ```typescript
   type WardrobeItem = {
     id: string;
     userId: string;
     garmentId?: string; // Link to Garment if from catalog
     customImageKey?: string; // User-uploaded owned item
     name: string;
     category: string;
     colors: string[];
     status: "owned" | "wishlist" | "considering";
     purchaseDate?: Date;
     purchasePrice?: number;
     wearCount: number;
     lastWorn?: Date;
     notes?: string;
   };
   ```

2. **Features:**
   - Upload photos of owned clothing
   - Auto-categorize with AI
   - Track wear frequency
   - Cost-per-wear calculations
   - Declutter suggestions (unworn items)

3. **Integration with Try-On:**
   - Try new items with owned pieces
   - "Complete this outfit" suggestions
   - Gap analysis ("You need more neutral tops")

---

### 8. Style Profile & Recommendations

**Problem:** Generic recommendations don't account for personal style preferences.

**Solution:** Learn user's style from interactions and provide personalized recommendations.

**Implementation:**

1. **Style Learning Signals:**
   - Liked/saved try-ons
   - Frequently tried categories
   - Color preferences (from owned items)
   - Rejected suggestions
   - Explicit preferences (quiz)

2. **Style Dimensions:**

   ```typescript
   type StyleProfile = {
     userId: string;
     // Style axes (0-100 scale)
     casualFormal: number; // 0=very casual, 100=very formal
     minimalistMaximalist: number;
     classicTrendy: number;
     subtleBold: number;

     // Preferences
     preferredColors: string[];
     avoidColors: string[];
     preferredPatterns: string[];
     avoidPatterns: string[];

     // Fit
     fitPreference: "slim" | "regular" | "relaxed" | "oversized";

     // Occasions
     primaryOccasions: string[]; // work, casual, date, etc.
   };
   ```

3. **Recommendation Engine:**
   - Filter catalog by style match
   - "Because you liked X" explanations
   - "Step outside comfort zone" suggestions (opt-in)

4. **Style Quiz:**
   - Visual preference test (pick A or B)
   - 10-15 questions
   - Generates initial style profile
   - Refines over time with usage

---

### 9. Occasion-Based Outfit Planning

**Problem:** Users don't always know what to wear for specific events.

**Solution:** Event-based outfit suggestions with calendar integration.

**Implementation:**

1. **Occasion Types:**
   - Work/office
   - Casual weekend
   - Date night
   - Wedding guest
   - Job interview
   - Vacation
   - Workout
   - Custom events

2. **Features:**
   - Calendar integration (Google, Apple)
   - "What to wear to [event]" query
   - Weather-aware suggestions
   - Dress code parsing from event descriptions
   - Outfit reminders before events

3. **AI Prompt for Suggestions:**

   ```
   User has event: {eventType}
   Weather: {temperature}, {conditions}
   Dress code: {dressCode}
   User style: {styleProfile}
   Available wardrobe: {wardrobeItems}

   Suggest 3 outfit combinations with reasoning.
   ```

---

### 10. Color Analysis & Palette Matching

**Problem:** Users don't know which colors suit them best.

**Solution:** AI-powered personal color analysis based on profile photo.

**Implementation:**

1. **Color Analysis:**
   - Detect skin undertone (warm/cool/neutral)
   - Eye color analysis
   - Hair color analysis
   - Seasonal color type (Spring/Summer/Autumn/Winter)

2. **Output:**

   ```typescript
   type ColorAnalysis = {
     skinUndertone: "warm" | "cool" | "neutral";
     seasonalType: "spring" | "summer" | "autumn" | "winter";
     bestColors: string[]; // Hex codes
     avoidColors: string[];
     metalPreference: "gold" | "silver" | "both";
     contrastLevel: "low" | "medium" | "high";
   };
   ```

3. **Integration:**
   - Filter garments by flattering colors
   - Highlight "great for you" items
   - Warn on potentially unflattering colors
   - Palette visualization in profile

---

### 11. Size Recommendation Engine

**Problem:** Sizes vary wildly between brands. Users don't know what size to order.

**Solution:** Personalized size recommendations based on measurements and brand data.

**Implementation:**

1. **Data Collection:**
   - User measurements (from AI estimation + manual)
   - Brand size charts (web scraping or API)
   - User feedback on past purchases ("ran small", "perfect fit")

2. **Recommendation Logic:**

   ```typescript
   type SizeRecommendation = {
     garmentId: string;
     recommendedSize: string;
     confidence: number;
     reasoning: string;
     alternativeSize?: string;
     alternativeReason?: string;
   };
   ```

3. **Feedback Loop:**
   - "How did this fit?" after purchase
   - Adjust model per brand
   - Community data (anonymized)

---

## Social & Sharing Features

### 12. Try-On Sharing & Galleries

**Problem:** Users want feedback on potential purchases but have no easy way to share.

**Solution:** Share try-on results with friends or publicly.

**Implementation:**

1. **Sharing Options:**
   - Private link (expires in 7 days)
   - Share to friends (in-app)
   - Public gallery (opt-in)
   - Social media export (Instagram, Pinterest)

2. **Data Model:**

   ```typescript
   type SharedTryOn = {
     id: string;
     tryOnId: string;
     userId: string;
     shareType: "link" | "friends" | "public";
     allowedUsers?: string[]; // For friends sharing
     expiresAt?: Date;
     viewCount: number;
     reactions: Reaction[];
     comments: Comment[];
   };
   ```

3. **Privacy Controls:**
   - Default: private
   - Blur face option for public
   - Watermark with Drezzi logo
   - Report/takedown system

---

### 13. Friend Feedback System

**Problem:** Hard to get opinions from friends on outfit choices.

**Solution:** Request and receive feedback from connected friends.

**Implementation:**

1. **Feedback Request Flow:**
   - User creates try-on
   - "Get opinions" button
   - Select friends to ask
   - Friends receive notification
   - Friends vote/comment
   - Aggregated results shown

2. **Feedback Types:**
   - Quick reactions: love it, like it, meh, not for you
   - Detailed comments
   - Comparison polls ("A or B?")
   - Anonymous option

3. **Notifications:**
   - Push notification for feedback requests
   - Daily digest option
   - In-app notification center

---

### 14. Community Style Challenges

**Problem:** Users want inspiration and engagement beyond individual try-ons.

**Solution:** Weekly style challenges with community participation.

**Implementation:**

1. **Challenge Types:**
   - Theme-based: "Best summer look"
   - Color challenges: "Style an all-white outfit"
   - Budget challenges: "Under $100 outfit"
   - Occasion: "Job interview ready"

2. **Features:**
   - Weekly automated challenges
   - User-submitted entries (try-on results)
   - Community voting
   - Winner showcases
   - Badges/achievements

3. **Moderation:**
   - AI content moderation
   - Community reporting
   - Manual review queue

---

### 15. Style Influencer Integration

**Problem:** Users want to emulate styles of influencers they follow.

**Solution:** Connect with style influencers for curated looks.

**Implementation:**

1. **Influencer Features:**
   - Verified influencer profiles
   - Curated outfit collections
   - "Shop the look" integration
   - Try-on with influencer's picks

2. **User Features:**
   - Follow influencers
   - Get notified of new looks
   - "Try this look" one-click
   - Influencer recommendations based on style match

3. **Business Model:**
   - Affiliate commission on purchases
   - Sponsored looks (disclosed)
   - Premium influencer content

---

## Infrastructure & Analytics

### 16. A/B Testing Framework for AI Prompts

**Problem:** Hard to know which AI prompts produce best results.

**Solution:** Framework to test different prompts and measure outcomes.

**Implementation:**

1. **Test Variables:**
   - System prompts
   - Image generation parameters
   - Post-processing steps

2. **Metrics:**
   - Quality scores (AI + user)
   - Generation time
   - Error rates
   - User satisfaction

3. **Framework:**

   ```typescript
   type PromptExperiment = {
     id: string;
     name: string;
     variants: PromptVariant[];
     trafficSplit: number[];
     startDate: Date;
     endDate?: Date;
     status: "running" | "concluded";
     winningVariant?: string;
   };
   ```

---

### 17. Usage Analytics Dashboard

**Problem:** No visibility into how users engage with features.

**Solution:** Comprehensive analytics for product decisions.

**Implementation:**

1. **Tracked Events:**
   - Profile creations/updates
   - Try-on generations (count, category, success rate)
   - Time spent viewing results
   - Share actions
   - Conversion to purchase intent
   - Feature adoption rates

2. **Dashboards:**
   - Daily active users
   - Try-on funnel (upload → generate → view → share/save)
   - Popular garment categories
   - Quality score trends
   - Error rates by type

---

### 18. Import Garment from URL

**Problem:** Users manually enter garment details when the information already exists on retailer websites.

**Solution:** Paste a product URL → AI extracts all details → Prefill form → User confirms.

**Architecture:**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User pastes    │ ──> │  tRPC endpoint   │ ──> │  Fetch URL      │
│  retail URL     │     │  importFromUrl   │     │  (server-side)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                              ┌───────────────────────────┘
                              v
                      ┌─────────────────┐
                      │  Parse HTML for │
                      │  structured data│
                      │  (JSON-LD, OG)  │
                      └────────┬────────┘
                               │
                               v
                      ┌─────────────────┐
                      │  Gemini AI      │
                      │  extraction     │
                      └────────┬────────┘
                               │
                               v
                      ┌─────────────────┐
                      │  Download image │
                      │  → Upload to S3 │
                      └────────┬────────┘
                               │
                               v
                      ┌─────────────────┐
                      │  Return prefill │
                      │  data to form   │
                      └─────────────────┘
```

**Implementation:**

1. **Service:** `src/services/garment-import.ts`
   - Generic extraction using Gemini (works on any retailer URL)
   - Parse structured data (JSON-LD, OpenGraph) first
   - AI fills gaps from HTML content
   - Download product image → upload to S3

2. **AI Extraction Prompt:**

   ```
   Analyze this product page HTML and extract:
   - Product name
   - Description (max 500 chars)
   - Price (numeric) and currency
   - Brand name
   - Category: one of [tops, bottoms, dresses, outerwear, shoes, accessories]
   - Subcategory (e.g., t-shirt, jeans, sneakers)
   - Primary colors (array)
   - Available sizes (array)
   - Main product image URL

   Return as JSON. Use null for undetermined fields.
   ```

3. **tRPC Procedure:** `garment.importFromUrl`
4. **UI:** Add URL input section at top of garment form

**Edge Cases:**

- URL fetch fails → Show error, allow manual entry
- AI extraction incomplete → Prefill available fields, user completes rest
- Image download fails → User uploads manually
- Rate limiting → Queue requests, show progress

---

### 19. Vector Embeddings & Similarity Search

**Problem:** No way to find similar items or get intelligent recommendations based on visual/semantic similarity.

**Solution:** Generate embeddings for garments → Enable "More like this" and smart recommendations.

**Architecture:**

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Garment Upload │ ──> │  Embedding       │ ──> │  pgvector       │
│  (create/update)│     │  Generation      │     │  storage        │
└─────────────────┘     │  Worker (async)  │     └─────────────────┘
                        └──────────────────┘              │
                                                          v
                                                  ┌─────────────────┐
                                                  │  Similarity     │
                                                  │  Search API     │
                                                  └─────────────────┘
```

**Implementation:**

1. **Infrastructure:**
   - Enable pgvector extension in PostgreSQL
   - Add `textEmbedding` and `imageEmbedding` columns to Garment model
   - Use HNSW index for fast similarity queries

2. **Embedding Generation:**
   - Use Google Gemini embeddings (already integrated)
   - Text embedding: name + description + category + brand + colors + tags
   - Image embedding: from garment image
   - Hybrid approach: combine both for best results

3. **Database Schema:**

   ```typescript
   export const garment = pgTable("garment", {
     // ... existing fields ...
     textEmbedding: vector("text_embedding", { dimensions: 768 }),
     imageEmbedding: vector("image_embedding", { dimensions: 768 }),
     embeddingStatus: text("embedding_status").default("pending").notNull(),
   });
   ```

4. **Worker:** `src/workers/garment-embedding.ts`
   - Triggered async after garment create/update
   - Generates both embeddings
   - Updates status to "completed"

5. **Search API:**

   ```typescript
   findSimilar: protectedProcedure
     .input(
       z.object({
         garmentId: z.string().cuid(),
         limit: z.number().default(6),
         category: z.enum(GARMENT_CATEGORIES).optional(),
       }),
     )
     .query(async ({ input }) => {
       // Cosine similarity search using pgvector
     });
   ```

6. **UI Components:**
   - "More like this" button on garment cards
   - Similar items panel/modal
   - Filter by category option

**Use Cases:**

- "Find similar items" on any garment
- Visual search: upload photo, find matching items
- Outfit completion: "Items that go well with this"
- Duplicate detection on upload

---

### 20. Enhanced Auto-Categorization

**Problem:** Users manually select category, enter colors, and add tags when uploading garments.

**Solution:** AI automatically analyzes garment images and suggests all attributes.

**Implementation:**

1. **Trigger:** Async after garment upload (no latency, shows "Analyzing..." state)

2. **Worker:** `src/workers/garment-analyze.ts`

3. **AI Analysis Output:**

   ```typescript
   type GarmentAnalysis = {
     category: string;
     subcategory: string;
     colors: { name: string; hex: string }[];
     pattern:
       | "solid"
       | "striped"
       | "floral"
       | "plaid"
       | "geometric"
       | "abstract";
     style: "casual" | "formal" | "sporty" | "bohemian" | "minimalist";
     material: string; // cotton, denim, silk, etc.
     occasions: string[]; // work, casual, date, etc.
     suggestedTags: string[];
     confidence: number;
   };
   ```

4. **UI States:**
   - "Analyzing..." badge on pending garments
   - Notification when analysis complete
   - Review/accept suggestions modal
   - One-click "Accept all" or individual edits

**Integration with URL Import:**

- When importing from URL, run analysis on downloaded image
- Merge AI suggestions with extracted metadata
- Higher confidence when multiple sources agree

---

## Priority Matrix

| Idea                         | Impact | Effort | Priority |
| ---------------------------- | ------ | ------ | -------- |
| Import from URL              | High   | Medium | P0       |
| Profile Enhancement Worker   | High   | Medium | P0       |
| Vector Embeddings            | High   | Medium | P1       |
| Multi-Garment Try-On         | High   | High   | P1       |
| AI Body Measurement          | High   | Medium | P1       |
| Digital Wardrobe             | High   | High   | P1       |
| Similarity Search            | High   | Low    | P1       |
| Enhanced Auto-Categorization | Medium | Medium | P2       |
| Background Removal           | Medium | Low    | P2       |
| Try-On Sharing               | Medium | Medium | P2       |
| Color Analysis               | Medium | Medium | P2       |
| Size Recommendations         | High   | High   | P2       |
| Style Profile                | Medium | High   | P3       |
| Community Challenges         | Low    | High   | P3       |
