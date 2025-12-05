import { mock } from "bun:test";

// Mock for generateImage (Gemini 3 Pro virtual try-on)
export const mockGenerateImage = mock(() =>
  Promise.resolve({
    image: {
      base64:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
    },
  })
);

// Mock for generateObject (Gemini 2.5 Flash style tips)
export const mockGenerateObject = mock(() =>
  Promise.resolve({
    object: {
      tips: [
        {
          category: "fit",
          content:
            "This garment fits well with your regular fit preference. Consider sizing down for a slimmer look.",
        },
        {
          category: "color",
          content:
            "The navy blue pairs excellently with khaki, white, and light gray bottoms.",
        },
        {
          category: "style",
          content:
            "Perfect for smart casual occasions. Dress it up with chinos or down with jeans.",
        },
        {
          category: "occasion",
          content:
            "Ideal for casual Fridays at the office or weekend brunch with friends.",
        },
        {
          category: "accessories",
          content:
            "A leather watch and brown belt would complement this piece nicely.",
        },
        {
          category: "fabric-care",
          content:
            "Machine wash cold, tumble dry low. Iron on medium heat if needed.",
        },
      ],
    },
    finishReason: "stop",
    usage: { promptTokens: 500, completionTokens: 200, totalTokens: 700 },
  })
);
