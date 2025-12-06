import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { createRouter, ErrorComponent } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import LoadingState from "./components/common/loading-state";
import NotFound from "./components/common/not-found";
import { routeTree } from "./routeTree.gen";
import * as TanstackQuery from "./trpc/root-provider";

export const getRouter = () => {
  const queryClient = TanstackQuery.createQueryClient();
  const serverHelpers = TanstackQuery.createServerHelpers({ queryClient });

  const router = createRouter({
    routeTree,
    context: {
      queryClient,
      trpc: serverHelpers,
      i18n,
    },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultStaleTime: 0,
    defaultPreload: "intent",
    defaultViewTransition: true,
    defaultPendingComponent: () => <LoadingState text="Loading..." />,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
    Wrap: (props: { children: React.ReactNode }) => (
      <I18nProvider i18n={i18n}>
        <TanstackQuery.Provider queryClient={queryClient}>
          {props.children}
        </TanstackQuery.Provider>
      </I18nProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};
