import { mock } from "bun:test";

// Mock SST Resource module globally
mock.module("sst", () => ({
  Resource: {
    MediaBucket: { name: "test-media-bucket" },
    TryOnQueue: {
      url: "https://sqs.us-east-2.amazonaws.com/123456789/test-queue",
    },
  },
}));

// Setup test environment
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
