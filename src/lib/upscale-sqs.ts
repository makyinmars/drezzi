import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Resource } from "sst";

export const upscaleSqs = new SQSClient({});

export type UpscaleJobPayload = {
  type: "profile" | "garment" | "tryon";
  entityId: string;
  userId: string;
  sourceImageKey: string;
};

export async function enqueueUpscaleJob(
  payload: UpscaleJobPayload
): Promise<string> {
  const command = new SendMessageCommand({
    QueueUrl: Resource.UpscaleQueue.url,
    MessageBody: JSON.stringify(payload),
  });
  const response = await upscaleSqs.send(command);
  return response.MessageId ?? "";
}
