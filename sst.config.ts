/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "drezzi",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "us-east-2",
          profile:
            input.stage === "production"
              ? "developer-production"
              : "developer-dev",
        },
      },
    };
  },
  async run() {
    const bucket = new sst.aws.Bucket("MediaBucket", {
      versioning: true,
      cors: {
        allowOrigins: ["http://localhost:3000", "https://localhost:3000"],
        allowMethods: ["GET", "PUT", "POST", "DELETE"],
        allowHeaders: ["*"],
        exposeHeaders: ["ETag"],
      },
      transform: {
        bucket: {
          lifecycleRules: [
            {
              id: "archive-old-files",
              enabled: true,
              transitions: [
                {
                  days: 30,
                  storageClass: "STANDARD_IA",
                },
                {
                  days: 90,
                  storageClass: "GLACIER",
                },
              ],
            },
          ],
        },
      },
    });

    const queue = new sst.aws.Queue("TryOnQueue", {
      visibilityTimeout: "5 minutes",
    });

    const tryOnWorker = new sst.aws.Function("TryOnWorker", {
      handler: "src/workers/try-on.handler",
      runtime: "nodejs20.x",
      timeout: "5 minutes",
      memory: "1024 MB",
      link: [bucket],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        GOOGLE_GENERATIVE_AI_API_KEY:
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
      },
      permissions: [
        {
          actions: ["s3:GetObject", "s3:PutObject"],
          resources: [bucket.arn, $interpolate`${bucket.arn}/*`],
        },
        {
          actions: [
            "sqs:ReceiveMessage",
            "sqs:DeleteMessage",
            "sqs:ChangeMessageVisibility",
            "sqs:GetQueueAttributes",
          ],
          resources: [queue.arn],
        },
      ],
    });

    queue.subscribe(tryOnWorker.arn);

    const publicUrl = process.env.PUBLIC_URL ?? "http://localhost:3000";

    const web = new sst.aws.TanStackStart("MyWeb", {
      link: [bucket, queue],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        REDIS_PUBLIC_URL: process.env.REDIS_PUBLIC_URL as string,
        VITE_PUBLIC_URL: process.env.VITE_PUBLIC_URL as string,
        PUBLIC_URL: process.env.PUBLIC_URL as string,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
        GOOGLE_GENERATIVE_AI_API_KEY:
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
      },
    });

    return {
      app: $app.stage === "production" ? web.url : publicUrl,
      bucket: bucket.name,
      queue: queue.url,
    };
  },
});
