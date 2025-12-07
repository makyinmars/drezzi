import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { APP_LOGO_URL, APP_NAME } from "@/constants/app";

type PasswordResetOTPEmailProps = {
  otp: string;
};

export const PasswordResetOTPEmail = ({ otp }: PasswordResetOTPEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                primary: "#3d9970",
                "primary-light": "#5fb88f",
                foreground: "#2d3b32",
              },
            },
          },
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>Your password reset code</Preview>
          <Container className="mx-auto my-[40px] max-w-[500px] border border-[#e8ebe9] border-solid bg-white">
            {/* Header */}
            <Section
              className="px-[40px] py-[32px] text-center"
              style={{
                background: "linear-gradient(135deg, #5fb88f 0%, #3d9970 100%)",
              }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                style={{ margin: "0 auto" }}
              >
                <tr>
                  <td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
                    <Img
                      alt={`${APP_NAME} logo`}
                      height="48"
                      src={APP_LOGO_URL}
                      style={{ borderRadius: "8px" }}
                      width="48"
                    />
                  </td>
                  <td style={{ verticalAlign: "middle" }}>
                    <Heading className="m-0 font-bold text-[28px] text-white">
                      {APP_NAME}
                    </Heading>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Body */}
            <Section className="px-[40px] py-[32px] text-center">
              <Text className="m-0 mb-[8px] font-semibold text-[18px] text-foreground">
                Reset Your Password
              </Text>
              <Text className="m-0 mb-[24px] text-[#666666] text-[14px] leading-[20px]">
                Use the code below to reset your password:
              </Text>

              {/* OTP Code Display */}
              <Text
                className="m-0 mb-[24px] font-bold font-mono text-[40px] tracking-[8px]"
                style={{ color: "#3d9970" }}
              >
                {otp}
              </Text>

              <Text className="m-0 mb-[8px] text-[#666666] text-[14px] leading-[20px]">
                This code expires in 5 minutes.
              </Text>

              <Text className="m-0 text-[#666666] text-[14px] leading-[20px]">
                If you didn't request a password reset, you can safely ignore
                this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

PasswordResetOTPEmail.PreviewProps = {
  otp: "123456",
} as PasswordResetOTPEmailProps;

export default PasswordResetOTPEmail;
