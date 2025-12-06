import { createFileRoute } from "@tanstack/react-router";

import ContentLayout from "@/components/common/content-layout";
import Landing from "@/components/landing";
import {
  APP_LOGO_URL,
  APP_NAME,
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
        content: APP_LOGO_URL,
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
        content: APP_LOGO_URL,
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
      {/* Global Liquid Silk Background */}
      <div className="relative min-h-screen">
        {/* Fixed background that persists during scroll */}
        <div className="fixed inset-0 z-0" style={{ perspective: "1200px" }}>
          {/* Base animated gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                135deg,
                var(--background) 0%,
                color-mix(in oklch, var(--primary) 12%, var(--background)) 25%,
                color-mix(in oklch, var(--accent) 8%, var(--background)) 50%,
                color-mix(in oklch, var(--chart-2) 10%, var(--background)) 75%,
                var(--background) 100%
              )`,
              backgroundSize: "400% 400%",
              animation: "hero-gradient-shift 25s ease-in-out infinite",
            }}
          />

          {/* Morphing Blob 1 - Large, top area */}
          <div
            className="absolute top-[5%] right-[10%] h-[500px] w-[500px] opacity-50"
            style={{
              background: `radial-gradient(circle at 40% 40%,
                color-mix(in oklch, var(--primary) 40%, transparent) 0%,
                color-mix(in oklch, var(--chart-2) 25%, transparent) 30%,
                color-mix(in oklch, var(--accent) 12%, transparent) 60%,
                transparent 80%
              )`,
              filter: "blur(50px)",
              transformStyle: "preserve-3d",
              animation: "hero-blob-morph-1 20s ease-in-out infinite",
            }}
          />

          {/* Morphing Blob 2 - Left side */}
          <div
            className="absolute top-[40%] left-[0%] h-[400px] w-[400px] opacity-45"
            style={{
              background: `radial-gradient(circle at 60% 50%,
                color-mix(in oklch, var(--chart-2) 35%, transparent) 0%,
                color-mix(in oklch, var(--primary) 20%, transparent) 40%,
                transparent 75%
              )`,
              filter: "blur(45px)",
              transformStyle: "preserve-3d",
              animation: "hero-blob-morph-2 25s ease-in-out infinite",
            }}
          />

          {/* Morphing Blob 3 - Bottom area */}
          <div
            className="absolute right-[30%] bottom-[20%] h-[350px] w-[350px] opacity-40"
            style={{
              background: `radial-gradient(circle at 50% 50%,
                color-mix(in oklch, var(--accent) 30%, transparent) 0%,
                color-mix(in oklch, var(--primary) 15%, transparent) 45%,
                transparent 75%
              )`,
              filter: "blur(40px)",
              transformStyle: "preserve-3d",
              animation: "hero-blob-morph-3 18s ease-in-out infinite",
            }}
          />

          {/* Mesh gradient overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `
                conic-gradient(from 0deg at 30% 70%,
                  transparent 0deg,
                  color-mix(in oklch, var(--primary) 12%, transparent) 60deg,
                  transparent 120deg,
                  color-mix(in oklch, var(--accent) 10%, transparent) 180deg,
                  transparent 240deg,
                  color-mix(in oklch, var(--chart-2) 8%, transparent) 300deg,
                  transparent 360deg
                )
              `,
              animation: "hero-mesh-rotate 50s linear infinite",
            }}
          />

          {/* Grain texture overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              animation: "hero-grain-shift 0.5s steps(10) infinite",
            }}
          />
        </div>

        {/* Content with relative positioning above background */}
        <div className="relative z-10">
          <Landing />
        </div>
      </div>
    </ContentLayout>
  );
}
