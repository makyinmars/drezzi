import { describe, expect, test } from "bun:test";

import {
  APP_NAME,
  APP_SEO_OG_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from "@/constants/app";

import { seo } from "../seo";

describe("seo utility", () => {
  test("generates correct title format with provided title", () => {
    const tags = seo({ title: "Virtual Try-On" });
    const titleTag = tags.find((t) => "title" in t);
    expect(titleTag).toBeDefined();
    expect((titleTag as { title: string }).title).toBe(
      `${APP_NAME} - Virtual Try-On`
    );
  });

  test("uses APP_NAME alone when no title provided", () => {
    const tags = seo({});
    const titleTag = tags.find((t) => "title" in t);
    expect(titleTag).toBeDefined();
    expect((titleTag as { title: string }).title).toBe(APP_NAME);
  });

  test("includes description meta tag", () => {
    const tags = seo({ description: "Custom description" });
    const descTag = tags.find((t) => "name" in t && t.name === "description");
    expect(descTag).toBeDefined();
    expect((descTag as { content: string }).content).toBe("Custom description");
  });

  test("uses default description when not provided", () => {
    const tags = seo({});
    const descTag = tags.find((t) => "name" in t && t.name === "description");
    expect(descTag).toBeDefined();
    expect((descTag as { content: string }).content).toBe(DEFAULT_DESCRIPTION);
  });

  test("includes keywords meta tag", () => {
    const tags = seo({ keywords: "fashion, clothes, AI" });
    const keywordsTag = tags.find((t) => "name" in t && t.name === "keywords");
    expect(keywordsTag).toBeDefined();
    expect((keywordsTag as { content: string }).content).toBe(
      "fashion, clothes, AI"
    );
  });

  test("uses default keywords when not provided", () => {
    const tags = seo({});
    const keywordsTag = tags.find((t) => "name" in t && t.name === "keywords");
    expect(keywordsTag).toBeDefined();
    expect((keywordsTag as { content: string }).content).toBe(DEFAULT_KEYWORDS);
  });

  describe("Twitter Card tags", () => {
    test("includes twitter:card with summary_large_image", () => {
      const tags = seo({});
      const cardTag = tags.find(
        (t) => "name" in t && t.name === "twitter:card"
      );
      expect(cardTag).toBeDefined();
      expect((cardTag as { content: string }).content).toBe(
        "summary_large_image"
      );
    });

    test("includes twitter:site", () => {
      const tags = seo({});
      const siteTag = tags.find(
        (t) => "name" in t && t.name === "twitter:site"
      );
      expect(siteTag).toBeDefined();
      expect((siteTag as { content: string }).content).toBe("@makyinc");
    });

    test("includes twitter:creator", () => {
      const tags = seo({});
      const creatorTag = tags.find(
        (t) => "name" in t && t.name === "twitter:creator"
      );
      expect(creatorTag).toBeDefined();
      expect((creatorTag as { content: string }).content).toBe("@makyinc");
    });

    test("includes twitter:title with full title", () => {
      const tags = seo({ title: "My Page" });
      const titleTag = tags.find(
        (t) => "name" in t && t.name === "twitter:title"
      );
      expect(titleTag).toBeDefined();
      expect((titleTag as { content: string }).content).toBe(
        `${APP_NAME} - My Page`
      );
    });

    test("includes twitter:description", () => {
      const tags = seo({ description: "Test description" });
      const descTag = tags.find(
        (t) => "name" in t && t.name === "twitter:description"
      );
      expect(descTag).toBeDefined();
      expect((descTag as { content: string }).content).toBe("Test description");
    });

    test("includes twitter:image with default", () => {
      const tags = seo({});
      const imageTag = tags.find(
        (t) => "name" in t && t.name === "twitter:image"
      );
      expect(imageTag).toBeDefined();
      expect((imageTag as { content: string }).content).toBe(APP_SEO_OG_URL);
    });

  });

  describe("OpenGraph tags", () => {
    test("uses property attribute not name for og tags", () => {
      const tags = seo({});
      const ogTitleTag = tags.find(
        (t) => "property" in t && t.property === "og:title"
      );
      expect(ogTitleTag).toBeDefined();
      expect((ogTitleTag as { property: string }).property).toBe("og:title");
    });

    test("includes og:type defaulting to website", () => {
      const tags = seo({});
      const typeTag = tags.find(
        (t) => "property" in t && t.property === "og:type"
      );
      expect(typeTag).toBeDefined();
      expect((typeTag as { content: string }).content).toBe("website");
    });

    test("allows og:type to be set to article", () => {
      const tags = seo({ type: "article" });
      const typeTag = tags.find(
        (t) => "property" in t && t.property === "og:type"
      );
      expect(typeTag).toBeDefined();
      expect((typeTag as { content: string }).content).toBe("article");
    });

    test("includes og:title", () => {
      const tags = seo({ title: "Test" });
      const titleTag = tags.find(
        (t) => "property" in t && t.property === "og:title"
      );
      expect(titleTag).toBeDefined();
      expect((titleTag as { content: string }).content).toBe(
        `${APP_NAME} - Test`
      );
    });

    test("includes og:description", () => {
      const tags = seo({ description: "OG Description" });
      const descTag = tags.find(
        (t) => "property" in t && t.property === "og:description"
      );
      expect(descTag).toBeDefined();
      expect((descTag as { content: string }).content).toBe("OG Description");
    });

    test("includes og:image with default", () => {
      const tags = seo({});
      const imageTag = tags.find(
        (t) => "property" in t && t.property === "og:image"
      );
      expect(imageTag).toBeDefined();
      expect((imageTag as { content: string }).content).toBe(APP_SEO_OG_URL);
    });

    test("includes og:site_name", () => {
      const tags = seo({});
      const siteTag = tags.find(
        (t) => "property" in t && t.property === "og:site_name"
      );
      expect(siteTag).toBeDefined();
      expect((siteTag as { content: string }).content).toBe(APP_NAME);
    });
  });

  describe("URL handling", () => {
    test("includes og:url only when url is provided", () => {
      const tags = seo({ url: "https://drezzi.com/lookbook/123" });
      const urlTag = tags.find(
        (t) => "property" in t && t.property === "og:url"
      );
      expect(urlTag).toBeDefined();
      expect((urlTag as { content: string }).content).toBe(
        "https://drezzi.com/lookbook/123"
      );
    });

    test("uses default APP_URL when url is not provided", () => {
      const tags = seo({});
      const urlTag = tags.find(
        (t) => "property" in t && t.property === "og:url"
      );
      expect(urlTag).toBeDefined();
      expect((urlTag as { content: string }).content).toBe(
        "https://getdrezzi.app"
      );
    });
  });

  test("returns expected number of tags", () => {
    const tags = seo({});
    // 1 title + 2 meta (desc, keywords) + 7 twitter + 6 og = 16
    expect(tags.length).toBe(16);
  });
});
