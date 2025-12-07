import { createFileRoute } from "@tanstack/react-router";

import ContentLayout from "@/components/common/content-layout";
import Landing from "@/components/landing";
import {
  APP_NAME,
  APP_SEO_OG_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from "@/constants/app";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      {
        title: `${APP_NAME} - AI-Powered Virtual Try-On`,
        content: DEFAULT_DESCRIPTION,
        name: "description",
      },
      {
        property: "og:title",
        content: `${APP_NAME} - AI-Powered Virtual Try-On`,
      },
      {
        property: "og:description",
        content: DEFAULT_DESCRIPTION,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:image",
        content: APP_SEO_OG_URL,
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: `${APP_NAME} - AI-Powered Virtual Try-On`,
      },
      {
        name: "twitter:description",
        content: DEFAULT_DESCRIPTION,
      },
      {
        name: "twitter:image",
        content: APP_SEO_OG_URL,
      },
      {
        name: "keywords",
        content: DEFAULT_KEYWORDS,
      },
    ],
  }),
});

function Home() {
  return (
    <ContentLayout>
      <Landing />
    </ContentLayout>
  );
}
