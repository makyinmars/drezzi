import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/env/client";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: clientEnv.VITE_PUBLIC_URL,
  plugins: [emailOTPClient()],
});

export const { signIn, signUp, useSession } = authClient;
