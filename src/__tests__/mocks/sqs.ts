import { mock } from "bun:test";

export function createMockSqs() {
  return {
    send: mock(() =>
      Promise.resolve({
        MessageId: `msg-${crypto.randomUUID()}`,
        MD5OfMessageBody: "d41d8cd98f00b204e9800998ecf8427e",
      })
    ),
  };
}
