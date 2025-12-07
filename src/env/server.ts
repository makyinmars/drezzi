import { createEnv } from "@t3-oss/env-core";
import { z } from "zod/v4";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string(),
    PUBLIC_URL: z.url(),
    BETTER_AUTH_SECRET: z.string(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),
    FAL_API_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
