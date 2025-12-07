import { SendEmailCommand } from "@aws-sdk/client-sesv2";
// import { render } from "@react-email/components";
import { Resource } from "sst";
import { APP_NAME } from "@/constants/app";
import { EmailClient } from "@/services/email";
// import { PasswordResetOTPEmail } from "./password-reset-otp";
// import { WelcomeEmail } from "./welcome-email";

export async function sendEmail(
  email: string,
  subject: string,
  emailHtml: string
) {
  try {
    const command = new SendEmailCommand({
      FromEmailAddress: `${APP_NAME} <noreply@${Resource.MyEmail.sender}>`,
      Destination: {
        ToAddresses: [email],
      },
      Content: {
        Simple: {
          Subject: {
            Data: subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: emailHtml,
              Charset: "UTF-8",
            },
          },
        },
      },
    });

    await EmailClient.send(command);
  } catch (e) {
    if (e instanceof Error) {
      throw new Error("Failed to send email", { cause: e.message });
    }
    throw new Error("Failed to send email");
  }
}

// export async function sendWelcomeEmail(email: string, name: string) {
//   const emailHtml = await render(WelcomeEmail({ name }));
//   await sendEmail(email, `Welcome to ${APP_NAME}!`, emailHtml);
// }
//
// export async function sendPasswordResetOTP(email: string, otp: string) {
//   const emailHtml = await render(PasswordResetOTPEmail({ otp }));
//   await sendEmail(email, `Reset your ${APP_NAME} password`, emailHtml);
// }
