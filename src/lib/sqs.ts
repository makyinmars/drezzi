import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Resource } from "sst";

export const sqs = new SQSClient({});

export type TryOnJobPayload = {
  tryOnId: string;
  userId: string;
  bodyImageUrl: string;
  garmentImageUrl: string;
};

export async function enqueueTryOnJob(
  payload: TryOnJobPayload
): Promise<string> {
  const command = new SendMessageCommand({
    QueueUrl: Resource.TryOnQueue.url,
    MessageBody: JSON.stringify(payload),
  });
  const response = await sqs.send(command);
  return response.MessageId ?? "";
}
