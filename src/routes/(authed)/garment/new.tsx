import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

import CustomError from "@/components/common/custom-error";
import LoadingState from "@/components/common/loading-state";

export const Route = createFileRoute("/(authed)/garment/new")({
  head: () => ({
    meta: [
      {
        title: "Drezzi - Add Garment",
      },
    ],
  }),
  errorComponent: ({ error }) => (
    <CustomError description={error.message} title="Error" />
  ),
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading...`} />;
  },
  component: lazyRouteComponent(() => import("src/screens/garment/new")),
});
