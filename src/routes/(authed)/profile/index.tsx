import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import CustomError from "@/components/common/custom-error";
import LoadingState from "@/components/common/loading-state";
import NotFound from "@/components/common/not-found";

export const Route = createFileRoute("/(authed)/profile/")({
  head: () => ({
    meta: [
      {
        title: "Drezzi - Body Profiles",
      },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.profile.list.queryOptions()
    );
  },
  errorComponent: ({ error }) => (
    <CustomError description={error.message} title="Error" />
  ),
  notFoundComponent: NotFound,
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading profiles...`} />;
  },
  component: lazyRouteComponent(() => import("src/screens/profile/index")),
});
