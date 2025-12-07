/// <reference types="vite/client" />

import type { I18n } from "@lingui/core";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouteContext,
  useRouter,
} from "@tanstack/react-router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { ThemeProvider } from "next-themes";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  APP_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
} from "@/constants/app";
import appCss from "@/styles/app.css?url";
import type { TRPCRouter } from "@/trpc/router";
import { seo } from "@/utils/seo";

type MyRouterContext = {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<TRPCRouter>;
  i18n: I18n;
};

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : React.lazy(() =>
        import("@tanstack/react-router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        }))
      );

function ErrorComponent({ error }: { error: Error }) {
  const router = useRouter();

  return (
    <div className="flex min-h-96 items-center justify-center">
      <Alert className="max-w-lg" variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>{error.message}</p>
          <Button
            className="w-full"
            onClick={() => router.invalidate()}
            variant="outline"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <Alert className="max-w-lg">
        <AlertTitle>Page Not Found</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>The page you're looking for doesn't exist.</p>
          <Button asChild className="w-full">
            <Link to="/">Go Home</Link>
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: `${APP_NAME} - AI Virtual Try-On | See Clothes On You Before Buying`,
        description: DEFAULT_DESCRIPTION,
        keywords: DEFAULT_KEYWORDS,
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#d9a03d" },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: NotFoundComponent,
  wrapInSuspense: true,
});

function RootComponent() {
  const { i18n } = useRouteContext({ from: "__root__" });
  return (
    <RootDocument locale={i18n.locale}>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  return (
    <html lang={locale} suppressHydrationWarning={true}>
      <head>
        {process.env.NODE_ENV === "development" && (
          <script
            crossOrigin="anonymous"
            defer
            src="//unpkg.com/react-grab/dist/index.global.js"
          />
        )}
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
          enableSystem
        >
          {children}
          {process.env.NODE_ENV === "development" && (
            <TanStackDevtools
              plugins={[
                {
                  name: "TanStack Query",
                  render: <ReactQueryDevtoolsPanel />,
                  defaultOpen: true,
                },
                {
                  name: "TanStack Router",
                  render: <TanStackRouterDevtools />,
                  defaultOpen: false,
                },
              ]}
            />
          )}
          <Toaster richColors={true} />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}
