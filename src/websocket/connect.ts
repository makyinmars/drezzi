import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyWebsocketEventV2,
} from "aws-lambda";
import { Resource } from "sst";

import { prisma } from "@/lib/prisma";

// Extend WebSocket event type to include query string parameters (present at runtime for $connect)
type WebSocketConnectEvent = APIGatewayProxyWebsocketEventV2 & {
  queryStringParameters?: Record<string, string | undefined>;
};

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export async function handler(
  event: WebSocketConnectEvent
): Promise<APIGatewayProxyResultV2> {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters?.token;

  if (!token) {
    console.log("WebSocket connect rejected: missing token");
    return { statusCode: 401, body: "Missing token" };
  }

  // Verify session token against database
  const session = await prisma.session.findUnique({
    where: { token },
    select: { userId: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    console.log("WebSocket connect rejected: invalid or expired session");
    return { statusCode: 401, body: "Invalid session" };
  }

  const userId = session.userId;
  const ttl = Math.floor(Date.now() / 1000) + 86400; // 24 hour TTL

  // Store bidirectional mapping: userId <-> connectionId
  await Promise.all([
    client.send(
      new PutCommand({
        TableName: Resource.WebSocketConnections.name,
        Item: {
          pk: `USER#${userId}`,
          sk: `CONN#${connectionId}`,
          userId,
          connectionId,
          connectedAt: Date.now(),
          expiresAt: ttl,
        },
      })
    ),
    client.send(
      new PutCommand({
        TableName: Resource.WebSocketConnections.name,
        Item: {
          pk: `CONN#${connectionId}`,
          sk: `USER#${userId}`,
          userId,
          connectionId,
          connectedAt: Date.now(),
          expiresAt: ttl,
        },
      })
    ),
  ]);

  console.log(`WebSocket connected: user=${userId} conn=${connectionId}`);

  return { statusCode: 200, body: "Connected" };
}
