import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import type { APIGatewayProxyWebsocketHandlerV2 } from "aws-lambda";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const endpoint = process.env.WEBSOCKET_API_ENDPOINT;

  if (!endpoint) {
    console.error("WEBSOCKET_API_ENDPOINT not configured");
    return { statusCode: 500, body: "Configuration error" };
  }

  const body = event.body ? (JSON.parse(event.body) as { type?: string }) : {};

  // Handle ping messages for keep-alive
  if (body.type === "ping") {
    const apiClient = new ApiGatewayManagementApiClient({ endpoint });
    await apiClient.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify({ type: "pong", timestamp: Date.now() }),
      })
    );
  }

  return { statusCode: 200, body: "OK" };
};
