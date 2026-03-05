import { Raindrop } from "raindrop-ai";

const writeKey = process.env.RAINDROP_WRITE_KEY;

export const raindrop = writeKey
  ? new Raindrop({
      writeKey,
      debugLogs: process.env.NODE_ENV !== "production",
      redactPii: true,
    })
  : null;
