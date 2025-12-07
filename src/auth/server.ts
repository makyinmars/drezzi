import { render } from "@react-email/components";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { APP_NAME } from "@/constants/app";
import { PasswordResetOTPEmail } from "@/emails/password-reset-otp";
import { sendEmail, sendWelcomeEmail } from "@/emails/send-email";
import { serverEnv } from "@/env/server";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: serverEnv.PUBLIC_URL,
  trustedOrigins: [serverEnv.PUBLIC_URL],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
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
          // Send welcome email (non-blocking)
          sendWelcomeEmail(user.email, user.name ?? "there").catch(
            console.error
          );
        },
      },
    },
  },
});
