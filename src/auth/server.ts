import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { APP_NAME } from "@/constants/app";
import { account, session, user, verification } from "@/db/schema";
import { PasswordResetOTPEmail } from "@/emails/password-reset-otp";
import { sendEmail, sendWelcomeEmail } from "@/emails/send-email";
import { serverEnv } from "@/env/server";
import { db } from "@/lib/db";
import { getOrCreateWallet } from "@/services/credits/wallet";

export const auth = betterAuth({
  baseURL: serverEnv.PUBLIC_URL,
  trustedOrigins: [serverEnv.PUBLIC_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: serverEnv.GOOGLE_CLIENT_ID,
      clientSecret: serverEnv.GOOGLE_CLIENT_SECRET,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  rateLimit: {
    enabled: true,
    window: 60, // 1 minute default window
    max: 10, // 10 requests per window
    storage: "memory",
    customRules: {
      "/forget-password/*": {
        window: 300, // 5 minutes
        max: 3, // Max 3 OTP requests per 5 minutes
      },
      "/email-otp/reset-password": {
        window: 60,
        max: 5, // Max 5 reset attempts per minute
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      allowedAttempts: 3, // 3 wrong attempts = OTP invalidated
      async sendVerificationOTP({
        email,
        otp,
        type,
      }: {
        email: string;
        otp: string;
        type: string;
      }) {
        if (type === "forget-password") {
          const html = await render(PasswordResetOTPEmail({ otp }));
          await sendEmail(email, `Reset your ${APP_NAME} password`, html);
        }
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Grant 3 free credits to new users (non-blocking)
          getOrCreateWallet(db, user.id).catch(console.error);
          // Send welcome email (non-blocking)
          sendWelcomeEmail(user.email, user.name ?? "there").catch(
            console.error
          );
        },
      },
    },
  },
});
