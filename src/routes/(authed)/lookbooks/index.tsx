import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import CustomError from "@/components/common/custom-error";
import LoadingState from "@/components/common/loading-state";
import NotFound from "@/components/common/not-found";

export const Route = createFileRoute("/(authed)/lookbooks/")({
  head: () => ({
    meta: [
      {
        title: "Drezzi - Lookbooks",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.lookbook.list.queryOptions()
    );
  },
  errorComponent: ({ error }) => (
    <CustomError description={error.message} title="Error" />
  ),
  notFoundComponent: NotFound,
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading lookbooks...`} />;
  },
  component: lazyRouteComponent(() => import("src/screens/lookbooks/index")),
});
