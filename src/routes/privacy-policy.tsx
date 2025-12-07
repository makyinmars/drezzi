import { Trans } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import ContentLayout from "@/components/common/content-layout";
import PageHeader from "@/components/common/page-header";
import { DREZZI_SUPPORT_EMAIL } from "@/constants/app";

export const Route = createFileRoute("/privacy-policy")({
  component: PrivacyPolicy,
  head: () => ({
    meta: [
      {
        title: "Privacy Policy - Drezzi",
        name: "description",
        content:
          "Privacy Policy for Drezzi, the AI-powered virtual try-on experience. Learn how we collect, use, and protect your data.",
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

function PrivacyPolicy() {
  return (
    <ContentLayout>
      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 pt-32 pb-24">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <PageHeader
            description={<Trans>Last updated: December 2025</Trans>}
            title={<Trans>Privacy Policy</Trans>}
          />
        </motion.div>

        <Section title={<Trans>1. Introduction</Trans>}>
          <p>
            <Trans>
              Maky Software Inc. ("we", "us", or "our") operates Drezzi ("the
              Service"). This Privacy Policy explains how we collect, use,
              disclose, and protect your personal information when you use our
              Service.
            </Trans>
          </p>
          <p>
            <Trans>
              By using the Service, you agree to the collection and use of
              information in accordance with this policy. We are committed to
              protecting your privacy and ensuring transparency about our data
              practices.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>2. Information We Collect</Trans>}>
          <p>
            <Trans>
              We collect different types of information to provide and improve
              our Service:
            </Trans>
          </p>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>Account Information</Trans>
          </h3>
          <p>
            <Trans>
              When you create an account via Google OAuth, we receive:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>Email address (for account identification)</Trans>
            </li>
            <li>
              <Trans>Display name (for personalization)</Trans>
            </li>
            <li>
              <Trans>Profile picture URL (for your avatar)</Trans>
            </li>
          </ul>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>Body Profile Data</Trans>
          </h3>
          <p>
            <Trans>When you create body profiles, we collect:</Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>Body photos you upload for virtual try-on</Trans>
            </li>
            <li>
              <Trans>
                Optional body measurements (height, waist, hip, inseam, chest)
              </Trans>
            </li>
            <li>
              <Trans>Fit preferences</Trans>
            </li>
          </ul>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>Usage Data</Trans>
          </h3>
          <p>
            <Trans>We automatically collect:</Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>Garment data (images, names, categories, brands)</Trans>
            </li>
            <li>
              <Trans>Try-on history and AI-generated results</Trans>
            </li>
            <li>
              <Trans>Lookbook collections you create</Trans>
            </li>
            <li>
              <Trans>Device information (browser type, IP address)</Trans>
            </li>
          </ul>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>Photo Content</Trans>
          </h3>
          <p>
            <Trans>
              When you upload photos for virtual try-on, we store and process
              these images to generate try-on results. Photo data is handled
              with strict security measures and processed through our AI
              services.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>3. How We Use Your Information</Trans>}>
          <p>
            <Trans>We use the collected information for:</Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>Providing and maintaining the Service</Trans>
            </li>
            <li>
              <Trans>
                Authenticating your identity and managing your account
              </Trans>
            </li>
            <li>
              <Trans>
                Generating AI-powered virtual try-on images showing garments on
                your body
              </Trans>
            </li>
            <li>
              <Trans>
                Enhancing and upscaling your photos for better results
              </Trans>
            </li>
            <li>
              <Trans>Creating and managing your lookbook collections</Trans>
            </li>
            <li>
              <Trans>
                Improving our Service and AI models (using anonymized data)
              </Trans>
            </li>
            <li>
              <Trans>Communicating with you about updates or support</Trans>
            </li>
            <li>
              <Trans>Detecting and preventing fraud or abuse</Trans>
            </li>
          </ul>
        </Section>

        <Section title={<Trans>4. Data Storage and Security</Trans>}>
          <p>
            <Trans>
              We implement industry-standard security measures to protect your
              data:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>All data is encrypted in transit using SSL/TLS</Trans>
            </li>
            <li>
              <Trans>
                Data at rest is encrypted in our PostgreSQL database
              </Trans>
            </li>
            <li>
              <Trans>OAuth tokens are securely stored and never exposed</Trans>
            </li>
            <li>
              <Trans>Photos are stored in secure cloud storage (AWS S3)</Trans>
            </li>
            <li>
              <Trans>Regular security audits and monitoring</Trans>
            </li>
          </ul>
          <p>
            <Trans>
              While we strive to protect your data, no method of transmission or
              storage is 100% secure. We cannot guarantee absolute security.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>5. Third-Party Services</Trans>}>
          <p>
            <Trans>We use the following third-party services:</Trans>
          </p>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>Google OAuth</Trans>
          </h3>
          <p>
            <Trans>
              We use Google OAuth for authentication. When you sign in with
              Google, we only request access to your basic profile information
              (email, name, profile picture). We do not access your Google
              Drive, Gmail, Calendar, or any other Google services.
            </Trans>
          </p>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>Google Gemini AI</Trans>
          </h3>
          <p>
            <Trans>
              We use Google Gemini 3 Pro to generate virtual try-on images. Your
              body photos and garment images are processed through this AI
              service to create realistic composite images showing how clothes
              would look on you.
            </Trans>
          </p>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>FAL AI</Trans>
          </h3>
          <p>
            <Trans>
              We use FAL AI's image upscaling service to enhance your body
              profile photos for better try-on results. Images are processed
              temporarily and not retained by FAL AI after processing.
            </Trans>
          </p>

          <h3 className="mt-6 mb-3 font-semibold text-foreground text-lg">
            <Trans>Cloud Infrastructure</Trans>
          </h3>
          <p>
            <Trans>
              We use Amazon Web Services (AWS) for hosting, storage, and email
              services. Data is stored in secure, compliant data centers.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>6. Data Retention</Trans>}>
          <p>
            <Trans>
              We retain your personal data for as long as your account is active
              or as needed to provide you with our services:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                Account data: Retained until you delete your account
              </Trans>
            </li>
            <li>
              <Trans>
                Body profiles and photos: Retained until you delete them or your
                account
              </Trans>
            </li>
            <li>
              <Trans>
                Garments and try-on results: Retained until you delete them or
                your account
              </Trans>
            </li>
            <li>
              <Trans>
                Lookbooks: Retained until you delete them or your account
              </Trans>
            </li>
            <li>
              <Trans>
                Anonymized analytics: May be retained indefinitely for service
                improvement
              </Trans>
            </li>
          </ul>
        </Section>

        <Section title={<Trans>7. Your Rights</Trans>}>
          <p>
            <Trans>
              Depending on your location, you may have the following rights
              regarding your personal data:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                <strong className="text-foreground">Access:</strong> Request a
                copy of your personal data
              </Trans>
            </li>
            <li>
              <Trans>
                <strong className="text-foreground">Correction:</strong> Request
                correction of inaccurate data
              </Trans>
            </li>
            <li>
              <Trans>
                <strong className="text-foreground">Deletion:</strong> Request
                deletion of your account and data
              </Trans>
            </li>
            <li>
              <Trans>
                <strong className="text-foreground">Export:</strong> Request a
                copy of your data in a portable format
              </Trans>
            </li>
            <li>
              <Trans>
                <strong className="text-foreground">Restriction:</strong>{" "}
                Request restriction of processing in certain circumstances
              </Trans>
            </li>
          </ul>
          <p>
            <Trans>
              To exercise these rights, please contact us at{" "}
              <a
                className="text-primary hover:underline"
                href={`mailto:${DREZZI_SUPPORT_EMAIL}`}
              >
                {DREZZI_SUPPORT_EMAIL}
              </a>
              . We will respond within 30 days.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>8. GDPR Compliance</Trans>}>
          <p>
            <Trans>
              For users in the European Economic Area (EEA), we process your
              data based on the following legal bases:
            </Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                <strong className="text-foreground">Contract:</strong>{" "}
                Processing necessary to provide the Service you requested
              </Trans>
            </li>
            <li>
              <Trans>
                <strong className="text-foreground">Consent:</strong> Processing
                based on your explicit consent (e.g., photo uploads for try-on)
              </Trans>
            </li>
            <li>
              <Trans>
                <strong className="text-foreground">
                  Legitimate Interest:
                </strong>{" "}
                Processing for service improvement and security
              </Trans>
            </li>
          </ul>
        </Section>

        <Section title={<Trans>9. Children's Privacy</Trans>}>
          <p>
            <Trans>
              The Service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13. If you become aware that a child has provided us with personal
              data, please contact us immediately.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>10. Cookies and Tracking</Trans>}>
          <p>
            <Trans>We use the following types of cookies:</Trans>
          </p>
          <ul className="ml-6 list-disc space-y-2">
            <li>
              <Trans>
                <strong className="text-foreground">Essential cookies:</strong>{" "}
                Required for authentication and core functionality
              </Trans>
            </li>
            <li>
              <Trans>
                <strong className="text-foreground">Preference cookies:</strong>{" "}
                Remember your settings (language, theme)
              </Trans>
            </li>
          </ul>
          <p>
            <Trans>
              We do not use third-party tracking cookies or advertising cookies.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>11. Changes to This Policy</Trans>}>
          <p>
            <Trans>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the "Last updated" date. We encourage you
              to review this policy periodically.
            </Trans>
          </p>
        </Section>

        <Section title={<Trans>12. Contact Us</Trans>}>
          <p>
            <Trans>
              If you have any questions about this Privacy Policy or our data
              practices, please contact us at:
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
          <p className="mt-4">
            <Trans>
              For GDPR-related inquiries, you may also contact your local data
              protection authority.
            </Trans>
          </p>
        </Section>
      </main>
    </ContentLayout>
  );
}
