import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import {
  APP_LOGO_URL,
  APP_NAME,
  APP_URL,
  DREZZI_SUPPORT_EMAIL,
} from "@/constants/app";

type WelcomeEmailProps = {
  name: string;
};

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => {
  const previewText = `Welcome to ${APP_NAME}!`;

  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                primary: "#D4A456",
                "primary-light": "#E8C078",
                "primary-dark": "#C08030",
                background: "#FDFBF7",
                foreground: "#444444",
              },
            },
          },
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>{previewText}</Preview>
          <Container className="mx-auto my-[40px] max-w-[500px] border border-[#e8e5e0] border-solid bg-white">
            {/* Header with gradient */}
            <Section
              className="px-[40px] py-[32px] text-center"
              style={{
                background: "linear-gradient(135deg, #E8C078 0%, #D4A456 100%)",
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

            {/* Body content */}
            <Section className="px-[40px] py-[32px]">
              <Text className="m-0 mb-[24px] text-[16px] text-foreground leading-[24px]">
                Hi {name},
              </Text>

              <Text className="m-0 mb-[16px] text-[16px] text-foreground leading-[24px]">
                Welcome to{" "}
                <Link
                  className="font-semibold text-primary no-underline"
                  href={APP_URL}
                >
                  {APP_NAME}
                </Link>
                ! I'm excited to have you join us.
              </Text>

              <Text className="m-0 mb-[16px] text-[16px] text-foreground leading-[24px]">
                {APP_NAME} lets you see how any garment looks on you before you
                buy. Powered by AI for photorealistic results in seconds.
              </Text>

              <Text className="m-0 mb-[16px] text-[16px] text-foreground leading-[24px]">
                Here's what you can do:
              </Text>

              <table
                cellPadding="0"
                cellSpacing="0"
                style={{ marginBottom: "16px" }}
              >
                <tr>
                  <td style={{ paddingBottom: "8px" }}>
                    <Text className="m-0 text-[14px] text-foreground leading-[20px]">
                      <strong>Body Profiles</strong> — Upload your photo to see
                      how any garment fits
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px" }}>
                    <Text className="m-0 text-[14px] text-foreground leading-[20px]">
                      <strong>Garment Catalog</strong> — Browse curated
                      collections or upload your own items
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px" }}>
                    <Text className="m-0 text-[14px] text-foreground leading-[20px]">
                      <strong>AI Try-On</strong> — Get photorealistic results in
                      seconds with advanced AI
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px" }}>
                    <Text className="m-0 text-[14px] text-foreground leading-[20px]">
                      <strong>Lookbooks</strong> — Save and share your favorite
                      outfit combinations
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px" }}>
                    <Text className="m-0 text-[14px] text-foreground leading-[20px]">
                      <strong>Style Tips</strong> — Receive AI-powered fashion
                      recommendations
                    </Text>
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px" }}>
                    <Text className="m-0 text-[14px] text-foreground leading-[20px]">
                      <strong>4K Quality</strong> — Crystal clear,
                      photorealistic results every time
                    </Text>
                  </td>
                </tr>
              </table>

              <Text className="m-0 mb-[16px] text-[16px] text-foreground leading-[24px]">
                Your feedback is invaluable. I'd love to hear your{" "}
                <strong>thoughts, ideas, and suggestions</strong>.
              </Text>

              <Text className="m-0 mb-[32px] text-[16px] text-foreground leading-[24px]">
                Simply <strong>reach out at</strong>{" "}
                <Link
                  className="text-primary no-underline"
                  href={`mailto:${DREZZI_SUPPORT_EMAIL}`}
                >
                  {DREZZI_SUPPORT_EMAIL}
                </Link>{" "}
                — I read every response.
              </Text>

              {/* CTA Button */}
              <Section className="mb-[32px] text-center">
                <Button
                  className="bg-primary px-[24px] py-[12px] font-semibold text-[14px] text-white no-underline"
                  href={`${APP_URL}/dashboard`}
                >
                  Get Started
                </Button>
              </Section>

              {/* Signature */}
              <Text className="m-0 text-[16px] text-foreground leading-[24px]">
                Best,
              </Text>
              <Text className="m-0 text-[16px] text-foreground leading-[24px]">
                The {APP_NAME} Team
              </Text>
            </Section>

            {/* Footer */}
            <Hr className="mx-[40px] my-0 border border-[#e8e5e0] border-solid" />
            <Section className="px-[40px] py-[24px]">
              <Text className="m-0 text-center text-[#666666] text-[12px] leading-[20px]">
                Questions? Contact us at{" "}
                <Link
                  className="text-primary no-underline"
                  href={`mailto:${DREZZI_SUPPORT_EMAIL}`}
                >
                  {DREZZI_SUPPORT_EMAIL}
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  name: "Climber",
} as WelcomeEmailProps;

export default WelcomeEmail;
