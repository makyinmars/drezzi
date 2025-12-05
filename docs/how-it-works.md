# How Drezzi Works

A technical overview of the Drezzi virtual try-on application, explaining how AI-powered clothing visualization is achieved using Google Gemini 3 Pro.

---

## Overview

Drezzi lets users see how clothing looks on their body before purchasing. The app combines:

1. **Body Profile** - User's reference photo stored securely
2. **Garment Catalog** - Clothing items available for try-on
3. **AI Processing** - Gemini 3 Pro fuses images into realistic composites
4. **Style Intelligence** - AI-generated outfit recommendations

---

## The Try-On Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. SELECT       2. QUEUE        3. PROCESS       4. DISPLAY        │
│                                                                      │
│  Profile +   →   SQS Job    →   Gemini 3 Pro  →   Result Image      │
│  Garment         Created        Generates         Shown to User     │
└──────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step

| Step | Action | Time |
|------|--------|------|
| 1 | User selects body profile + garment | instant |
| 2 | Try-on job queued to SQS | ~1-2s |
| 3 | Lambda worker fetches both images | ~500ms |
| 4 | Gemini 3 Pro generates composite | ~5-10s |
| 5 | Result uploaded to S3 | ~500ms |
| 6 | User sees the result | instant |

**Total processing time: ~7-13 seconds**

---

## AI Model: Gemini 3 Pro Image Preview

Drezzi uses Google's latest image generation model for virtual try-on.

### Model Specifications

| Property | Value |
|----------|-------|
| **Model ID** | `gemini-3-pro-image-preview` |
| **Multi-image fusion** | Up to 14 reference images |
| **Human images** | Up to 5 people for consistency |
| **Object images** | Up to 6 objects (garments) |
| **Resolution** | 1K, 2K, or 4K output |
| **Thinking mode** | Reasons through complex prompts |
| **Watermark** | SynthID (invisible, built-in) |

### Why Gemini 3 Pro?

1. **Multi-image fusion** - Combines body photo + garment into one coherent image
2. **Thinking capability** - Reasons about pose, lighting, fabric physics before generating
3. **High fidelity** - 4K output for detailed results
4. **Character consistency** - Maintains the user's appearance across try-ons

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Profile    │  │   Catalog    │  │   Try-On     │                  │
│  │   Upload     │  │   Browse     │  │   Results    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ tRPC (type-safe)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            API LAYER                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Profile    │  │   Garment    │  │   TryOn      │                  │
│  │   Router     │  │   Router     │  │   Router     │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PostgreSQL │    │      S3      │    │     SQS      │
│   (Railway)  │    │    Bucket    │    │    Queue     │
└──────────────┘    └──────────────┘    └──────┬───────┘
                           ▲                    │
                           │                    ▼
                           │           ┌──────────────┐
                           │           │  Try-On      │
                           └───────────│  Worker      │
                                       │  (Lambda)    │
                                       └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  Gemini 3    │
                                       │  Pro API     │
                                       └──────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Client | React + TanStack Start | User interface |
| API | tRPC + Lambda | Type-safe endpoints |
| Database | PostgreSQL (Railway) | User data, try-on records |
| Storage | AWS S3 | Images (body, garment, results) |
| Queue | AWS SQS | Async job processing |
| Worker | AWS Lambda | AI processing orchestration |
| AI | Gemini 3 Pro | Image generation |

---

## Processing Pipeline Detail

### 1. Request Creation

```typescript
// User initiates try-on
const tryOn = await trpc.tryOn.create({
  bodyProfileId: "profile_123",
  garmentId: "garment_456"
})
// Status: "pending"
```

### 2. Queue Processing

```typescript
// Job sent to SQS
await sqs.send({
  tryOnId: tryOn.id,
  bodyImageUrl: profile.photoUrl,
  garmentImageUrl: garment.imageUrl
})
```

### 3. Worker Execution

```typescript
// Lambda worker receives job
// Status: "processing"

// Fetch images
const [bodyImage, garmentImage] = await Promise.all([
  fetch(bodyImageUrl),
  fetch(garmentImageUrl)
])

// Call Gemini 3 Pro
const result = await generateImage({
  model: google.image("gemini-3-pro-image-preview"),
  prompt: "Virtual try-on: Place the garment onto the person...",
  providerOptions: {
    google: {
      responseModalities: ["IMAGE"],
      inlineData: [bodyImageBase64, garmentImageBase64]
    }
  }
})
```

### 4. Result Storage

```typescript
// Upload to S3
await s3.putObject({
  Bucket: "media-bucket",
  Key: `try-ons/${tryOnId}/result.png`,
  Body: resultImage
})

// Update database
// Status: "completed"
```

---

## Pricing

### Gemini 3 Pro Image Generation

| Resolution | Cost per Image | 100 Try-ons | 1,000 Try-ons |
|------------|----------------|-------------|---------------|
| 1K/2K | $0.134 | $13.40 | $134.00 |
| 4K | $0.240 | $24.00 | $240.00 |

### Style Tips (Gemini 2.5 Flash)

After each try-on, the app generates style recommendations:

| Feature | Cost | Description |
|---------|------|-------------|
| Style Analysis | ~$0.039 | Fit assessment, color tips |

### Monthly Cost Estimates

| Usage Level | Try-ons/Month | Image Cost | Tips Cost | Total |
|-------------|---------------|------------|-----------|-------|
| Light | 100 | $13.40 | $3.90 | ~$17 |
| Medium | 500 | $67.00 | $19.50 | ~$87 |
| Heavy | 1,000 | $134.00 | $39.00 | ~$173 |

### Hackathon Budget

With $50-100 budget:
- **~400-750 try-ons** at 1K/2K resolution
- **~200-400 try-ons** at 4K resolution

---

## Style Intelligence

After generating a try-on, Drezzi provides AI-powered style tips using Gemini 2.5 Flash:

### Categories

| Category | Description |
|----------|-------------|
| **Fit** | How well the garment suits the body type |
| **Color** | Color palette suggestions and harmony |
| **Style** | Complementary items to complete the look |
| **Occasion** | Events/settings where the outfit works |

### Streaming UX

Style tips stream in real-time as they're generated:

```typescript
const result = streamText({
  model: google("gemini-2.5-flash"),
  messages: [{
    role: "user",
    content: [
      { type: "image", image: resultUrl },
      { type: "text", text: "Analyze this try-on result..." }
    ]
  }]
})
```

---

## Performance Targets

| Metric | Target | Stretch Goal |
|--------|--------|--------------|
| Queue to start | < 2s | < 500ms |
| AI inference | < 10s | < 5s |
| Total latency | < 13s | < 8s |
| Error rate | < 2% | < 1% |

---

## Security & Privacy

| Measure | Implementation |
|---------|----------------|
| Image storage | Presigned S3 URLs (time-limited) |
| User isolation | All data scoped to userId |
| Watermarking | SynthID on all AI-generated images |
| Data deletion | Cascade delete on account removal |

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Framework | TanStack Start |
| Frontend | React 19, Tailwind CSS v4, Shadcn/ui |
| API | tRPC |
| Database | PostgreSQL + Prisma ORM |
| AI | Google Gemini 3 Pro + Vercel AI SDK |
| Infrastructure | SST v3 (AWS Lambda, S3, SQS) |
| Auth | Better Auth |

---

**Document Version:** 1.0
**Model:** Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`)
**Last Updated:** December 2025
