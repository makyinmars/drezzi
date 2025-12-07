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
  const result = await client.send(
    new QueryCommand({
      TableName: Resource.WebSocketConnections.name,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `CONN#${connectionId}` },
    })
  );

  const item = result.Items?.[0];
  if (!item) {
    return { statusCode: 200, body: "OK" };
  }

  const userId = item.userId as string;

  // Delete both mappings
  await Promise.all([
    client.send(
      new DeleteCommand({
        TableName: Resource.WebSocketConnections.name,
        Key: { pk: `CONN#${connectionId}`, sk: `USER#${userId}` },
      })
    ),
    client.send(
      new DeleteCommand({
        TableName: Resource.WebSocketConnections.name,
        Key: { pk: `USER#${userId}`, sk: `CONN#${connectionId}` },
      })
    ),
  ]);

  console.log(`WebSocket disconnected: user=${userId} conn=${connectionId}`);

  return { statusCode: 200, body: "Disconnected" };
};
