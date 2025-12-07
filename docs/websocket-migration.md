# WebSocket Migration: SSE to API Gateway WebSocket

This document outlines migrating from Server-Sent Events (SSE) to AWS API Gateway WebSocket for real-time try-on and upscale progress updates.

## Why Migrate?

### Current SSE Architecture Problems

| Issue | Impact |
|-------|--------|
| Lambda keeps running while SSE connection is open | Continuous billing (up to 15 min per connection) |
| No streaming support (`streaming: false` in nitro config) | Events may buffer, defeating real-time purpose |
| Redis subscription per connection | Scales poorly, each Lambda holds Redis connection |
| Cold starts affect all SSE reconnections | Poor UX on network changes |

### WebSocket Benefits

| Benefit | Description |
|---------|-------------|
| Billing per message | Only pay when messages are sent, not connection duration |
| True bidirectional | Can send messages from client (ping, subscribe to specific events) |
| Connection management | API Gateway handles keep-alive, reconnections |
| Scales to millions | API Gateway WebSocket handles connection state |

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client    │◄────│  API Gateway WS  │◄────│  Lambda Workers │
│  (Browser)  │     │  $connect        │     │  TryOnWorker    │
│             │     │  $disconnect     │     │  UpscaleWorker  │
│             │     │  $default        │     │                 │
└─────────────┘     └──────────────────┘     └─────────────────┘
                            │                        │
                            ▼                        │
                    ┌───────────────┐                │
                    │   DynamoDB    │◄───────────────┘
                    │  Connections  │  (lookup userId → connectionId)
                    └───────────────┘
```

## Files to Change

### New Files

| File | Purpose |
|------|---------|
| `src/websocket/connect.ts` | $connect handler - stores connection mapping |
| `src/websocket/disconnect.ts` | $disconnect handler - removes connection |
| `src/websocket/default.ts` | $default handler - handles client messages |
| `src/lib/websocket-publisher.ts` | Utility to send messages to connected clients |
| `src/hooks/use-websocket.ts` | React hook replacing `useTryOnSSE` |

### Files to Modify

| File | Changes |
|------|---------|
| `sst.config.ts` | Add WebSocket API, DynamoDB table, update workers |
| `src/workers/try-on.ts` | Replace `publish()` with WebSocket publisher |
| `src/workers/upscale.ts` | Replace `publishUpscale()` with WebSocket publisher |
| `src/routes/(authed)/route.tsx` | Replace `useTryOnSSE` with `useWebSocket` |
| `src/lib/pubsub.ts` | Can be removed after migration |

### Files to Delete

| File | Reason |
|------|--------|
| `src/routes/api/sse/tryon.ts` | No longer needed |
| `src/hooks/use-tryon-sse.ts` | Replaced by `use-websocket.ts` |

---

## Implementation

### 1. Update `sst.config.ts`

Add the WebSocket API, DynamoDB table for connections, and update worker permissions:

```typescript
// sst.config.ts
export default $config({
  // ... existing app config ...

  async run() {
    // ... existing resources (bucket, queues, email) ...

    // ==========================================
    // WEBSOCKET - Real-time Event Delivery
    // ==========================================

    // DynamoDB table for WebSocket connection management
    const connectionsTable = new sst.aws.Dynamo("WebSocketConnections", {
      fields: {
        pk: "string",      // "USER#userId" or "CONN#connectionId"
        sk: "string",      // "CONN#connectionId" or "USER#userId"
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        byConnection: { hashKey: "sk", rangeKey: "pk" },
      },
      ttl: "expiresAt",
    });

    // WebSocket API
    const websocket = new sst.aws.ApiGatewayWebSocket("RealtimeWS", {
      ...(domain && {
        domain: {
          name: `ws.${domain}`,
          dns: sst.cloudflare.dns(),
        },
      }),
    });

    // WebSocket route handlers
    websocket.route("$connect", {
      handler: "src/websocket/connect.handler",
      link: [connectionsTable],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
      },
    });

    websocket.route("$disconnect", {
      handler: "src/websocket/disconnect.handler",
      link: [connectionsTable],
    });

    websocket.route("$default", {
      handler: "src/websocket/default.handler",
      link: [connectionsTable],
    });

    // Update TryOnWorker with WebSocket permissions
    const tryOnWorker = new sst.aws.Function("TryOnWorker", {
      handler: "src/workers/try-on.handler",
      runtime: "nodejs20.x",
      timeout: "5 minutes",
      memory: "1024 MB",
      link: [bucket, connectionsTable],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        WEBSOCKET_API_ENDPOINT: websocket.managementEndpoint,
        GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY as string,
      },
      permissions: [
        {
          actions: ["s3:GetObject", "s3:PutObject"],
          resources: [bucket.arn, $interpolate`${bucket.arn}/*`],
        },
        {
          actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:ChangeMessageVisibility", "sqs:GetQueueAttributes"],
          resources: [queue.arn],
        },
        {
          actions: ["execute-api:ManageConnections"],
          resources: [$interpolate`${websocket.nodes.api.executionArn}/*`],
        },
      ],
    });

    // Update UpscaleWorker similarly
    const upscaleWorker = new sst.aws.Function("UpscaleWorker", {
      handler: "src/workers/upscale.handler",
      runtime: "nodejs20.x",
      timeout: "3 minutes",
      memory: "1024 MB",
      link: [bucket, connectionsTable],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        WEBSOCKET_API_ENDPOINT: websocket.managementEndpoint,
        FAL_API_KEY: process.env.FAL_API_KEY as string,
      },
      permissions: [
        {
          actions: ["s3:GetObject", "s3:PutObject"],
          resources: [bucket.arn, $interpolate`${bucket.arn}/*`],
        },
        {
          actions: ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:ChangeMessageVisibility", "sqs:GetQueueAttributes"],
          resources: [upscaleQueue.arn],
        },
        {
          actions: ["execute-api:ManageConnections"],
          resources: [$interpolate`${websocket.nodes.api.executionArn}/*`],
        },
      ],
    });

    // ... rest of config ...

    // Update TanStackStart environment
    const web = new sst.aws.TanStackStart("MyWeb", {
      link: [bucket, queue, upscaleQueue, email],
      environment: {
        // ... existing env vars ...
        VITE_WEBSOCKET_URL: websocket.url,
      },
      // ...
    });

    return {
      // ... existing outputs ...
      websocket: websocket.url,
      connectionsTable: connectionsTable.name,
    };
  },
});
```

### 2. Create `src/websocket/connect.ts`

Handles WebSocket connection, authenticates user, stores connection mapping:

```typescript
// src/websocket/connect.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { Resource } from "sst";

import { auth } from "@/auth/server";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  // Extract token from query string (WebSocket doesn't support headers on connect)
  const token = event.queryStringParameters?.token;

  if (!token) {
    return { statusCode: 401, body: "Missing token" };
  }

  // Verify session token
  const session = await auth.api.getSession({
    headers: new Headers({ Authorization: `Bearer ${token}` }),
  });

  if (!session?.user) {
    return { statusCode: 401, body: "Invalid session" };
  }

  const userId = session.user.id;
  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hour TTL

  // Store bidirectional mapping: userId ↔ connectionId
  await Promise.all([
    client.send(new PutCommand({
      TableName: Resource.WebSocketConnections.name,
      Item: {
        pk: `USER#${userId}`,
        sk: `CONN#${connectionId}`,
        userId,
        connectionId,
        connectedAt: Date.now(),
        expiresAt: ttl,
      },
    })),
    client.send(new PutCommand({
      TableName: Resource.WebSocketConnections.name,
      Item: {
        pk: `CONN#${connectionId}`,
        sk: `USER#${userId}`,
        userId,
        connectionId,
        connectedAt: Date.now(),
        expiresAt: ttl,
      },
    })),
  ]);

  console.log(`WebSocket connected: user=${userId} conn=${connectionId}`);

  return { statusCode: 200, body: "Connected" };
};
```

### 3. Create `src/websocket/disconnect.ts`

Cleans up connection mapping on disconnect:

```typescript
// src/websocket/disconnect.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";
import { Resource } from "sst";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;

  // Find userId for this connection
  const result = await client.send(new QueryCommand({
    TableName: Resource.WebSocketConnections.name,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": `CONN#${connectionId}` },
  }));

  const item = result.Items?.[0];
  if (!item) {
    return { statusCode: 200, body: "OK" };
  }

  const userId = item.userId as string;

  // Delete both mappings
  await Promise.all([
    client.send(new DeleteCommand({
      TableName: Resource.WebSocketConnections.name,
      Key: { pk: `CONN#${connectionId}`, sk: `USER#${userId}` },
    })),
    client.send(new DeleteCommand({
      TableName: Resource.WebSocketConnections.name,
      Key: { pk: `USER#${userId}`, sk: `CONN#${connectionId}` },
    })),
  ]);

  console.log(`WebSocket disconnected: user=${userId} conn=${connectionId}`);

  return { statusCode: 200, body: "Disconnected" };
};
```

### 4. Create `src/websocket/default.ts`

Handles incoming messages (ping/pong, subscribe to specific entities):

```typescript
// src/websocket/default.ts
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const endpoint = `https://${event.requestContext.domainName}/${event.requestContext.stage}`;

  const apiClient = new ApiGatewayManagementApiClient({ endpoint });

  const body = event.body ? JSON.parse(event.body) : {};

  // Handle ping messages for keep-alive
  if (body.type === "ping") {
    await apiClient.send(new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: JSON.stringify({ type: "pong", timestamp: Date.now() }),
    }));
  }

  return { statusCode: 200, body: "OK" };
};
```

### 5. Create `src/lib/websocket-publisher.ts`

Utility for workers to send messages to connected users:

```typescript
// src/lib/websocket-publisher.ts
import {
  ApiGatewayManagementApiClient,
  GoneException,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { Resource } from "sst";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export type TryOnStage =
  | "queued"
  | "fetching_images"
  | "generating"
  | "uploading"
  | "complete"
  | "failed";

export type TryOnEvent = {
  type: "tryon_progress";
  tryOnId: string;
  userId: string;
  stage: TryOnStage;
  timestamp: number;
  error?: string;
  resultUrl?: string;
};

export type UpscaleStage =
  | "queued"
  | "fetching"
  | "upscaling"
  | "uploading"
  | "complete"
  | "failed";

export type UpscaleEvent = {
  type: "upscale_progress";
  entityType: "profile" | "garment" | "tryon";
  entityId: string;
  userId: string;
  stage: UpscaleStage;
  timestamp: number;
  error?: string;
};

export type WebSocketEvent = TryOnEvent | UpscaleEvent;

async function getConnectionsForUser(userId: string): Promise<string[]> {
  const result = await dynamo.send(new QueryCommand({
    TableName: Resource.WebSocketConnections.name,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": `USER#${userId}` },
  }));

  return (result.Items ?? []).map((item) => item.connectionId as string);
}

async function removeStaleConnection(userId: string, connectionId: string) {
  await Promise.all([
    dynamo.send(new DeleteCommand({
      TableName: Resource.WebSocketConnections.name,
      Key: { pk: `USER#${userId}`, sk: `CONN#${connectionId}` },
    })),
    dynamo.send(new DeleteCommand({
      TableName: Resource.WebSocketConnections.name,
      Key: { pk: `CONN#${connectionId}`, sk: `USER#${userId}` },
    })),
  ]);
}

export async function publishToUser(userId: string, event: WebSocketEvent) {
  const endpoint = process.env.WEBSOCKET_API_ENDPOINT;
  if (!endpoint) {
    console.warn("WEBSOCKET_API_ENDPOINT not configured");
    return;
  }

  const apiClient = new ApiGatewayManagementApiClient({ endpoint });
  const connections = await getConnectionsForUser(userId);
  const payload = JSON.stringify(event);

  await Promise.all(
    connections.map(async (connectionId) => {
      try {
        await apiClient.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: payload,
        }));
      } catch (err) {
        // Connection is stale, remove it
        if (err instanceof GoneException) {
          await removeStaleConnection(userId, connectionId);
        } else {
          console.error(`Failed to send to ${connectionId}:`, err);
        }
      }
    })
  );
}

// Convenience functions matching old API
export async function publish(event: Omit<TryOnEvent, "type"> & { type?: "progress" }) {
  await publishToUser(event.userId, {
    ...event,
    type: "tryon_progress",
  });
}

export async function publishUpscale(event: Omit<UpscaleEvent, "type"> & { type?: "upscale_progress" }) {
  await publishToUser(event.userId, {
    ...event,
    type: "upscale_progress",
  });
}
```

### 6. Create `src/hooks/use-websocket.ts`

React hook for WebSocket connection:

```typescript
// src/hooks/use-websocket.ts
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";

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

export function useRealtimeUpdates(token: string | undefined) {
  const client = useQueryClient();
  const trpc = useTRPC();
  const socket = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data) as WebSocketMessage;

    if (data.type === "pong") return;

    if (data.type === "tryon_progress") {
      const { tryOnId, stage } = data;
      const status = mapStageToStatus(stage);

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
      // Add other entity types as needed
    }
  }, [client, trpc]);

  useEffect(() => {
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
    if (!wsUrl) {
      console.warn("VITE_WEBSOCKET_URL not configured");
      return;
    }

    const connect = () => {
      socket.current = new WebSocket(`${wsUrl}?token=${token}`);

      socket.current.onopen = () => {
        console.log("WebSocket connected");

        // Send ping every 5 minutes to keep connection alive
        pingInterval.current = setInterval(() => {
          if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 300000);
      };

      socket.current.onmessage = handleMessage;

      socket.current.onclose = () => {
        console.log("WebSocket disconnected, reconnecting...");
        if (pingInterval.current) clearInterval(pingInterval.current);
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      socket.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket.current?.close();
      };
    };

    connect();

    return () => {
      socket.current?.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (pingInterval.current) clearInterval(pingInterval.current);
    };
  }, [token, handleMessage]);
}
```

### 7. Update `src/workers/try-on.ts`

Replace Redis publish with WebSocket publisher:

```diff
- import { publish } from "@/lib/pubsub";
+ import { publish } from "@/lib/websocket-publisher";

// No other changes needed - the publish function signature is the same
```

### 8. Update `src/workers/upscale.ts`

Replace Redis publish with WebSocket publisher:

```diff
- import { publishUpscale } from "@/lib/pubsub";
+ import { publishUpscale } from "@/lib/websocket-publisher";

// No other changes needed - the publishUpscale function signature is the same
```

### 9. Update `src/routes/(authed)/route.tsx`

Replace SSE hook with WebSocket hook:

```diff
- import { useTryOnSSE } from "@/hooks/use-tryon-sse";
+ import { useRealtimeUpdates } from "@/hooks/use-websocket";
+ import { authClient } from "@/auth/client";

export const Route = createFileRoute("/(authed)")({
  component: AuthedLayout,
});

function AuthedLayout() {
- useTryOnSSE();
+ const { data: session } = authClient.useSession();
+ useRealtimeUpdates(session?.session?.token);

  return <Outlet />;
}
```

### 10. Update `src/env/server.ts`

Add new environment variables:

```diff
export const serverEnv = createEnv({
  server: {
    // ... existing vars ...
+   WEBSOCKET_API_ENDPOINT: z.string().optional(),
  },
  // ...
});
```

### 11. Update `src/env/client.ts`

Add client-side WebSocket URL:

```diff
export const clientEnv = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_PUBLIC_URL: z.string().url(),
+   VITE_WEBSOCKET_URL: z.string().url().optional(),
  },
  // ...
});
```

---

## Deployment Steps

1. **Deploy infrastructure first** (creates DynamoDB table and WebSocket API):
   ```bash
   bun sst deploy
   ```

2. **Verify WebSocket endpoint**:
   ```bash
   bun sst outputs
   # Should show: websocket: wss://xxxxx.execute-api.us-east-2.amazonaws.com/production
   ```

3. **Test connection**:
   ```bash
   wscat -c "wss://xxxxx.execute-api.us-east-2.amazonaws.com/production?token=YOUR_TOKEN"
   ```

4. **Delete old SSE route** after confirming WebSocket works:
   ```bash
   rm src/routes/api/sse/tryon.ts
   rm src/hooks/use-tryon-sse.ts
   ```

5. **Remove Redis dependencies** (if no longer needed):
   ```bash
   bun remove ioredis
   rm src/lib/pubsub.ts
   ```

---

## Cost Comparison

### SSE on Lambda (Current)

| Metric | Cost |
|--------|------|
| 100 users × 15 min avg connection | 25,000 GB-seconds/day |
| At $0.0000166667/GB-sec | ~$12.50/day = $375/month |

### WebSocket (New)

| Metric | Cost |
|--------|------|
| Connection minutes | $0.25 per million |
| Messages (32KB) | $1.00 per million |
| 100 users × 100 messages/day | ~$0.01/day |
| DynamoDB | ~$1-5/month (on-demand) |

**Estimated savings: 99%+**

---

## Monitoring

### CloudWatch Metrics

- `AWS/ApiGateway` → `ConnectCount`, `MessageCount`, `IntegrationError`
- Set alarms for `IntegrationError > 10` per minute

### Logs

Each Lambda writes to its own log group:
- `/aws/lambda/drezzi-{stage}-RealtimeWS-connect`
- `/aws/lambda/drezzi-{stage}-RealtimeWS-disconnect`
- `/aws/lambda/drezzi-{stage}-RealtimeWS-default`

---

## Rollback Plan

If issues arise:

1. Revert `src/routes/(authed)/route.tsx` to use `useTryOnSSE`
2. Revert workers to use `src/lib/pubsub.ts`
3. Keep WebSocket infrastructure (no cost if unused)
4. Debug WebSocket issues in staging

---

## Future Enhancements

1. **Subscription filtering**: Let clients subscribe to specific tryOnIds
2. **Presence**: Track which users are online
3. **Broadcast**: Admin notifications to all users
4. **Message history**: Replay missed messages on reconnect
