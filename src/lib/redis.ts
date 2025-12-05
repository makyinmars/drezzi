import Redis from "ioredis";

const url = process.env.REDIS_PUBLIC_URL ?? "";

export const redis = new Redis(url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});
