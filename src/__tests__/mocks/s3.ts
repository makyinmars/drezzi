import { mock } from "bun:test";

export function createMockS3() {
  return {
    send: mock(() =>
      Promise.resolve({
        Body: {
          transformToByteArray: () =>
            Promise.resolve(new Uint8Array([137, 80, 78, 71])), // PNG header
        },
      })
    ),
  };
}

export const mockGetSignedUrl = mock(() =>
  Promise.resolve(
    "https://test-media-bucket.s3.us-east-2.amazonaws.com/signed-url?token=abc123"
  )
);

export const mockGetPresignedUrl = mock(() =>
  Promise.resolve(
    "https://test-media-bucket.s3.us-east-2.amazonaws.com/presigned?token=xyz789"
  )
);
