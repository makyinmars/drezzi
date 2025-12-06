import Redis from "ioredis";

const url = process.env.REDIS_PUBLIC_URL ?? "";

export const publisher = new Redis(url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

export const subscriber = new Redis(url, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

publisher.on("error", (err) => {
  console.error("[Redis Publisher] Error:", err.message);
});

subscriber.on("error", (err) => {
  console.error("[Redis Subscriber] Error:", err.message);
});

export type TryOnStage =
  | "queued"
  | "fetching_images"
  | "generating"
  | "uploading"
  | "complete"
  | "failed";

export type TryOnEvent = {
  type: "progress";
  tryOnId: string;
  userId: string;
  stage: TryOnStage;
  timestamp: number;
  error?: string;
  resultUrl?: string;
};

export function channel(userId: string) {
  return `tryon:user:${userId}`;
}

export async function publish(event: TryOnEvent) {
  await publisher.publish(channel(event.userId), JSON.stringify(event));
}

export async function subscribe(
  userId: string,
  handler: (event: TryOnEvent) => void
): Promise<() => Promise<void>> {
  const ch = channel(userId);
  await subscriber.subscribe(ch);

  const listener = (receivedChannel: string, message: string) => {
    if (receivedChannel === ch) {
      handler(JSON.parse(message) as TryOnEvent);
    }
  };

  subscriber.on("message", listener);

  return async () => {
    subscriber.off("message", listener);
    await subscriber.unsubscribe(ch);
  };
}
