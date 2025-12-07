import {
  APP_NAME,
  APP_SEO_OG_URL,
  APP_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from "@/constants/app";

export type SEOConfig = {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  type?: "website" | "article";
};

export const seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  url,
  type = "website",
}: SEOConfig) => {
  const fullTitle = title ? `${APP_NAME} - ${title}` : APP_NAME;

  const tags = [
    { title: fullTitle },
    { name: "description", content: description },
    { name: "keywords", content: keywords },

    // Twitter Card tags
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: "@makyinc" },
    { name: "twitter:creator", content: "@makyinc" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: APP_SEO_OG_URL },
    { name: "twitter:url", content: url ?? APP_URL },

    // OpenGraph tags (use 'property' not 'name')
    { property: "og:type", content: type },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: APP_SEO_OG_URL },
    { property: "og:site_name", content: APP_NAME },
    { property: "og:url", content: url ?? APP_URL },
  ];

  return tags;
};
