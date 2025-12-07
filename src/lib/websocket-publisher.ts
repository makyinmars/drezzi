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
  | "generating_tips"
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
  balance?: number;
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
  const result = await dynamo.send(
    new QueryCommand({
      TableName: Resource.WebSocketConnections.name,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `USER#${userId}` },
    })
  );

  return (result.Items ?? []).map((item) => item.connectionId as string);
}

async function removeStaleConnection(userId: string, connectionId: string) {
  await Promise.all([
    dynamo.send(
      new DeleteCommand({
        TableName: Resource.WebSocketConnections.name,
        Key: { pk: `USER#${userId}`, sk: `CONN#${connectionId}` },
      })
    ),
    dynamo.send(
      new DeleteCommand({
        TableName: Resource.WebSocketConnections.name,
        Key: { pk: `CONN#${connectionId}`, sk: `USER#${userId}` },
      })
    ),
  ]);
}

export async function publishToUser(userId: string, event: WebSocketEvent) {
  const endpoint = process.env.WEBSOCKET_API_ENDPOINT;
  if (!endpoint) {
    console.warn("WEBSOCKET_API_ENDPOINT not configured, skipping publish");
    return;
  }

  const apiClient = new ApiGatewayManagementApiClient({ endpoint });
  const connections = await getConnectionsForUser(userId);
  const payload = JSON.stringify(event);

  await Promise.all(
    connections.map(async (connectionId) => {
      try {
        await apiClient.send(
          new PostToConnectionCommand({
            ConnectionId: connectionId,
            Data: payload,
          })
        );
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

// Convenience function matching old publish API signature
export async function publish(event: {
  type?: "progress";
  tryOnId: string;
  userId: string;
  stage: TryOnStage;
  timestamp: number;
  error?: string;
  resultUrl?: string;
  balance?: number;
}) {
  await publishToUser(event.userId, {
    ...event,
    type: "tryon_progress",
  });
}

// Convenience function matching old publishUpscale API signature
export async function publishUpscale(event: {
  type?: "upscale_progress";
  entityType: "profile" | "garment" | "tryon";
  entityId: string;
  userId: string;
  stage: UpscaleStage;
  timestamp: number;
  error?: string;
}) {
  await publishToUser(event.userId, {
    ...event,
    type: "upscale_progress",
  });
}
