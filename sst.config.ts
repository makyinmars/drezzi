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
      cloudflare: "6.2.0",
    };
  },
  async run() {


    const rootDomain = "getdrezzi.app";
    const isLocalDev = $app.stage === "franklin";

    // Determine domain name based on stage
    // Uses root domain for 'production', 'dev.' prefix for 'dev',
    // undefined for 'franklin' (local dev), and 'stage.' prefix otherwise
    const domain = isLocalDev
      ? undefined
      : ({
          production: rootDomain,
          dev: `dev.${rootDomain}`,
        }[$app.stage] || `${$app.stage}.dev.${rootDomain}`);

    // Public URL for the app - localhost for local dev, https domain otherwise
    const publicUrl = isLocalDev
      ? "http://localhost:3000"
      : `https://${domain}`;


    const bucket = new sst.aws.Bucket("MediaBucket", {
      versioning: true,
      cors: {
        allowOrigins: [
          "http://localhost:3000",
          "https://localhost:3000",
          ...(domain ? [`https://${domain}`] : []),
          ...($app.stage === "production" && domain ? [`https://www.${domain}`] : []),
        ],
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
      fifo: false,
    });

    const tryOnWorker = new sst.aws.Function("TryOnWorker", {
      handler: "src/workers/try-on.handler",
      runtime: "nodejs20.x",
      timeout: "5 minutes",
      memory: "1024 MB",
      link: [bucket],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        REDIS_PUBLIC_URL: process.env.REDIS_PUBLIC_URL as string,
        GOOGLE_GENERATIVE_AI_API_KEY:
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY as string,
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


    const web = new sst.aws.TanStackStart("MyWeb", {
      link: [bucket, queue],
      environment: {
        DATABASE_URL: process.env.DATABASE_URL as string,
        REDIS_PUBLIC_URL: process.env.REDIS_PUBLIC_URL as string,
        VITE_PUBLIC_URL: publicUrl,
        PUBLIC_URL: publicUrl,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID as string,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET as string,
        GOOGLE_GENERATIVE_AI_API_KEY:
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
        AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY as string,
      },
      ...(domain && {
        domain: {
          name: domain,
          ...($app.stage === "production" && {
            redirects: [`www.${domain}`],
          }),
          dns: sst.cloudflare.dns(),
        },
      }),
    });

    return {
      app: $app.stage === "production" ? web.url : publicUrl,
      bucket: bucket.name,
      queue: queue.url,
    };
  },
});
