import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/auth/server";
import { subscribe } from "@/lib/pubsub";

export const Route = createFileRoute("/api/sse/tryon")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        const encoder = new TextEncoder();

        let unsubscribe: (() => Promise<void>) | undefined;

        const stream = new ReadableStream({
          async start(controller) {
            // Send initial connection event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "connected" })}\n\n`
              )
            );

            // Subscribe to Redis channel for this user
            unsubscribe = await subscribe(userId, (event) => {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            });
          },
          cancel() {
            // Called automatically when stream is cancelled/aborted
            unsubscribe?.();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
