import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import type { TryOnStage } from "@/lib/pubsub";
import { useTRPC } from "@/trpc/react";
import type { TryOnListProcedure } from "@/trpc/routers/tryOn";

type TryOnEvent = {
  type: "progress" | "connected";
  tryOnId?: string;
  stage?: TryOnStage;
  timestamp?: number;
  error?: string;
  resultUrl?: string;
};

function mapStageToStatus(stage?: TryOnStage): string {
  if (stage === "complete") return "completed";
  if (stage === "failed") return "failed";
  return "processing";
}

export function useTryOnSSE() {
  const client = useQueryClient();
  const trpc = useTRPC();
  const source = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const connect = () => {
      source.current = new EventSource("/api/sse/tryon", {
        withCredentials: true,
      });

      source.current.onmessage = (event) => {
        const data = JSON.parse(event.data) as TryOnEvent;

        if (data.type === "connected") return;
        if (!data.tryOnId) return;

        const status = mapStageToStatus(data.stage);

        // Update React Query cache optimistically
        client.setQueryData(
          trpc.tryOn.list.queryKey({}),
          (old: TryOnListProcedure | undefined) => {
            if (!old) return old;
            return old.map((item) =>
              item.id === data.tryOnId
                ? { ...item, status, stage: data.stage }
                : item
            );
          }
        );

        // Invalidate individual query to refetch
        client.invalidateQueries({
          queryKey: trpc.tryOn.byId.queryKey({ id: data.tryOnId }),
        });

        // On complete/failed, also invalidate list to refetch full data
        if (data.stage === "complete" || data.stage === "failed") {
          client.invalidateQueries({ queryKey: trpc.tryOn.list.queryKey() });
        }
      };

      source.current.onerror = () => {
        source.current?.close();
        // Reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      source.current?.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [client, trpc]);
}
