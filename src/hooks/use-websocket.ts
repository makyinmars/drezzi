import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { authClient } from "@/auth/client";
import { clientEnv } from "@/env/client";
import { useTRPC } from "@/trpc/react";
import type { TryOnListProcedure } from "@/trpc/routers/tryOn";

type TryOnStage =
  | "queued"
  | "fetching_images"
  | "generating"
  | "uploading"
  | "complete"
  | "failed";

type TryOnEvent = {
  type: "tryon_progress";
  tryOnId: string;
  stage: TryOnStage;
  timestamp: number;
  error?: string;
};

type UpscaleEvent = {
  type: "upscale_progress";
  entityType: "profile" | "garment" | "tryon";
  entityId: string;
  stage: string;
  timestamp: number;
  error?: string;
};

type WebSocketMessage = TryOnEvent | UpscaleEvent | { type: "pong" };

function mapStageToStatus(stage?: TryOnStage): string {
  if (stage === "complete") return "completed";
  if (stage === "failed") return "failed";
  return "processing";
}

function getStageMessage(stage: TryOnStage): string {
  switch (stage) {
    case "queued":
      return "Queued - waiting to start...";
    case "fetching_images":
      return "Fetching your images...";
    case "generating":
      return "Generating your try-on...";
    case "uploading":
      return "Uploading result...";
    case "complete":
      return "Try-on complete!";
    case "failed":
      return "Try-on failed";
    default:
      return "Processing...";
  }
}

const MAX_RECONNECT_ATTEMPTS = 5;

export function useRealtimeUpdates() {
  const client = useQueryClient();
  const trpc = useTRPC();
  const socket = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = JSON.parse(event.data as string) as WebSocketMessage;

      if (data.type === "pong") return;

      if (data.type === "tryon_progress") {
        const { tryOnId, stage, error } = data;
        const status = mapStageToStatus(stage);

        // Update toast based on stage
        if (stage === "complete") {
          toast.success("Try-on complete!", { id: tryOnId });
        } else if (stage === "failed") {
          toast.error(error ?? "Try-on failed", { id: tryOnId });
        } else {
          toast.loading(getStageMessage(stage), { id: tryOnId });
        }

        // Update React Query cache optimistically
        client.setQueryData(
          trpc.tryOn.list.queryKey({}),
          (old: TryOnListProcedure | undefined) => {
            if (!old) return old;
            return old.map((item) =>
              item.id === tryOnId ? { ...item, status, stage } : item
            );
          }
        );

        // Invalidate individual query
        client.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: tryOnId }),
        });

        // On complete/failed, refetch list for full data
        if (stage === "complete" || stage === "failed") {
          client.invalidateQueries({ queryKey: trpc.tryOn.list.queryKey() });
        }
      }

      if (data.type === "upscale_progress") {
        // Handle upscale events - invalidate relevant queries
        if (data.entityType === "profile") {
          client.invalidateQueries({ queryKey: trpc.profile.list.queryKey() });
        }
        if (data.stage === "complete" || data.stage === "failed") {
          client.invalidateQueries({ queryKey: trpc.profile.list.queryKey() });
        }
      }
    },
    [client, trpc]
  );

  useEffect(() => {
    const wsUrl = clientEnv.VITE_WEBSOCKET_URL;
    if (!wsUrl) {
      console.warn("VITE_WEBSOCKET_URL not configured");
      return;
    }

    const connect = async () => {
      // Get session token for WebSocket auth
      const session = await authClient.getSession();
      const token = session.data?.session?.token;

      if (!token) {
        console.log("No session token, skipping WebSocket connection");
        // Retry after delay in case user logs in
        reconnectTimeout.current = setTimeout(connect, 5000);
        return;
      }

      socket.current = new WebSocket(`${wsUrl}?token=${token}`);

      socket.current.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0; // Reset on successful connection

        // Send ping every 5 minutes to keep connection alive
        pingInterval.current = setInterval(() => {
          if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 300000);
      };

      socket.current.onmessage = handleMessage;

      socket.current.onclose = () => {
        if (pingInterval.current) clearInterval(pingInterval.current);

        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(3000 * 2 ** reconnectAttempts.current, 30000);
          reconnectAttempts.current++;
          console.log(
            `WebSocket disconnected, reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`
          );
          reconnectTimeout.current = setTimeout(connect, delay);
        } else {
          console.warn(
            "WebSocket: Max reconnection attempts reached. Refresh page to retry."
          );
        }
      };

      socket.current.onerror = () => {
        // Error details are not exposed for security reasons, just close and let onclose handle retry
        socket.current?.close();
      };
    };

    connect();

    return () => {
      socket.current?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, [handleMessage]);
}
