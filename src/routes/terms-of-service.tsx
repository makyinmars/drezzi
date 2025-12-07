import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import ContentLayout from "@/components/common/content-layout";
import PageHeader from "@/components/common/page-header";
import { DREZZI_SUPPORT_EMAIL } from "@/constants/app";

export const Route = createFileRoute("/terms-of-service")({
  component: TermsOfService,
  head: () => ({
    meta: [
      {
        title: "Terms of Service - Drezzi",
        name: "description",
        content:
          "Terms of Service for Drezzi, the AI-powered virtual try-on platform.",
      },
    ],
  }),
});

const Section = ({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) => (
  <motion.section
    className="mb-12"
    initial={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <h2 className="mb-4 font-bold text-2xl md:text-3xl">{title}</h2>
    <div className="space-y-4 text-muted-foreground leading-relaxed">
      {children}
    </div>
  </motion.section>
);

function TermsOfService() {
  return (
    <ContentLayout>
      <main className="mx-auto max-w-4xl px-6 pt-32 pb-24">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <PageHeader
            description={<Trans>Last updated: December 2025</Trans>}
            title={<Trans>Terms of Service</Trans>}
          />
        </motion.div>

        <Section title={<Trans>1. Acceptance of Terms</Trans>}>
          <p>
            <Trans>
              By accessing or using Drezzi ("the Service"), you agree to be
              bound by these Terms of Service. If you do not agree to these
              terms, you may not use the Service.
            </Trans>
          </p>
          <p>
            <Trans>
              The Service is operated by Maky Software Inc. ("we", "us", or
              "our"). We reserve the right to update these terms at any time,
              and we will notify you of any material changes.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>2. Description of Service</Trans>}>
          <p>
            <Trans>
              Drezzi is an AI-powered virtual try-on platform designed to help
              users visualize how clothing looks on them before purchasing. The
              Service includes:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>Body profile creation and management</Trans>
            </li>
            <li>
              <Trans>Garment wardrobe organization</Trans>
            </li>
            <li>
              <Trans>AI-powered virtual try-on generation</Trans>
            </li>
            <li>
              <Trans>Lookbook creation and sharing</Trans>
            </li>
            <li>
              <Trans>Style tips and recommendations</Trans>
            </li>
          </ul>
        </Section>

        <Section title={<Trans>3. User Accounts</Trans>}>
          <p>
            <Trans>
              To use certain features of the Service, you must create an
              account. You may sign up using your email address or through
              Google OAuth. You are responsible for:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                Maintaining the confidentiality of your account credentials
              </Trans>
            </li>
            <li>
              <Trans>All activities that occur under your account</Trans>
            </li>
            <li>
              <Trans>Providing accurate and complete information</Trans>
            </li>
          </ul>
          <p>
            <Trans>
              You must be at least 13 years old to create an account and use the
              Service.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>4. User Content</Trans>}>
          <p>
            <Trans>
              You retain ownership of all content you submit to the Service,
              including body profile photos, garment images, and other data
              ("User Content"). By submitting User Content, you grant us a
              non-exclusive, worldwide, royalty-free license to:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                Store and process your content to provide the Service
              </Trans>
            </li>
            <li>
              <Trans>Generate virtual try-on images using AI technology</Trans>
            </li>
            <li>
              <Trans>
                Generate anonymized, aggregated insights to improve our AI
                models
              </Trans>
            </li>
          </ul>
          <p>
            <Trans>
              We will never sell your personal content or share identifiable
              photos with third parties without your explicit consent.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>5. AI Virtual Try-On Disclaimer</Trans>}>
          <p>
            <Trans>
              The AI-powered virtual try-on visualizations provided by Drezzi
              are for informational and preview purposes only. They should not
              be considered an exact representation of how garments will fit or
              appear in real life.
            </Trans>
          </p>
          <p>
            <Trans>
              Actual garment fit, color, and texture may vary from AI-generated
              images due to factors including lighting, fabric properties, body
              measurements, and manufacturing variations. We make no guarantees
              about the accuracy of AI-generated try-on results.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>6. Credit Purchases and Refund Policy</Trans>}>
          <p>
            <Trans>
              Drezzi uses a credit-based system for AI virtual try-on features.
              Credits can be purchased through our secure payment system powered
              by Stripe.
            </Trans>
          </p>

          <h3 className="mt-6 mb-2 font-semibold text-foreground text-lg">
            <Trans>Non-Refundable Purchases</Trans>
          </h3>
          <p>
            <Trans>
              All credit purchases are final and non-refundable. This policy
              exists because:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                <strong>Pay-for-Success Model:</strong> Credits are only
                deducted from your account after a successful virtual try-on is
                generated. If a try-on fails for any reason, no credits are
                charged.
              </Trans>
            </li>
            <li>
              <Trans>
                <strong>Digital Goods:</strong> Credits are digital goods that
                are delivered immediately upon purchase and cannot be
                "returned."
              </Trans>
            </li>
            <li>
              <Trans>
                <strong>Fair Use:</strong> This policy prevents abuse of the
                refund system while ensuring you only pay for successful
                try-ons.
              </Trans>
            </li>
          </ul>

          <h3 className="mt-6 mb-2 font-semibold text-foreground text-lg">
            <Trans>Credit Expiration</Trans>
          </h3>
          <p>
            <Trans>
              Credits do not expire. Once purchased, credits remain in your
              account until used.
            </Trans>
          </p>

          <h3 className="mt-6 mb-2 font-semibold text-foreground text-lg">
            <Trans>Failed Try-Ons</Trans>
          </h3>
          <p>
            <Trans>
              If a virtual try-on generation fails due to technical issues:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>No credits will be deducted from your account</Trans>
            </li>
            <li>
              <Trans>You may retry the try-on at no additional cost</Trans>
            </li>
            <li>
              <Trans>
                Our system automatically handles refunds for failed generations
              </Trans>
            </li>
          </ul>

          <h3 className="mt-6 mb-2 font-semibold text-foreground text-lg">
            <Trans>Disputes</Trans>
          </h3>
          <p>
            <Trans>
              If you believe there has been an error with your credit purchase
              or usage, please contact our support team. We will investigate and
              resolve any legitimate billing issues.
            </Trans>
          </p>

          <h3 className="mt-6 mb-2 font-semibold text-foreground text-lg">
            <Trans>Changes to Pricing</Trans>
          </h3>
          <p>
            <Trans>
              We reserve the right to modify credit package pricing at any time.
              Any changes will not affect credits already purchased.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>7. Prohibited Uses</Trans>}>
          <p>
            <Trans>You agree not to:</Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                Use the Service for any illegal or unauthorized purpose
              </Trans>
            </li>
            <li>
              <Trans>
                Upload content that infringes on intellectual property rights
              </Trans>
            </li>
            <li>
              <Trans>Upload inappropriate, offensive, or harmful content</Trans>
            </li>
            <li>
              <Trans>
                Attempt to gain unauthorized access to the Service or other
                users' accounts
              </Trans>
            </li>
            <li>
              <Trans>
                Use automated systems to access the Service without permission
              </Trans>
            </li>
            <li>
              <Trans>Interfere with or disrupt the Service</Trans>
            </li>
          </ul>
        </Section>

        <Section title={<Trans>8. Intellectual Property</Trans>}>
          <p>
            <Trans>
              The Service, including its design, features, and content
              (excluding User Content), is owned by Maky Software Inc. and is
              protected by copyright, trademark, and other intellectual property
              laws.
            </Trans>
          </p>
          <p>
            <Trans>
              You may not copy, modify, distribute, or create derivative works
              based on the Service without our prior written consent.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>9. Limitation of Liability</Trans>}>
          <p>
            <Trans>
              To the maximum extent permitted by law, Maky Software Inc. shall
              not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use of or
              inability to use the Service.
            </Trans>
          </p>
          <p>
            <Trans>
              The Service is provided "as is" without warranties of any kind,
              either express or implied. We do not guarantee that the Service
              will be uninterrupted, secure, or error-free.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>10. Termination</Trans>}>
          <p>
            <Trans>
              We reserve the right to suspend or terminate your account at any
              time for violation of these terms or for any other reason at our
              discretion.
            </Trans>
          </p>
          <p>
            <Trans>
              You may delete your account at any time through the account
              settings. Upon deletion, your personal data will be removed in
              accordance with our Privacy Policy.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>11. Changes to Terms</Trans>}>
          <p>
            <Trans>
              We may modify these Terms of Service at any time. We will notify
              you of significant changes by posting a notice on the Service or
              sending you an email. Your continued use of the Service after
              changes are posted constitutes acceptance of the modified terms.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>12. Governing Law</Trans>}>
          <p>
            <Trans>
              These Terms of Service shall be governed by and construed in
              accordance with the laws of the jurisdiction in which Maky
              Software Inc. operates, without regard to conflict of law
              principles.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>13. Contact Us</Trans>}>
          <p>
            <Trans>
              If you have any questions about these Terms of Service, please
              contact us at:
            </Trans>
          </p>
          <p className="mt-4">
            <strong className="text-foreground">Maky Software Inc.</strong>
            <br />
            <a
              className="text-primary hover:underline"
              href={`mailto:${DREZZI_SUPPORT_EMAIL}`}
            >
              {DREZZI_SUPPORT_EMAIL}
            </a>
          </p>
        </Section>
      </main>
    </ContentLayout>
  );
}
