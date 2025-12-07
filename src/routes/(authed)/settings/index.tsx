import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import CustomError from "@/components/common/custom-error";
import LoadingState from "@/components/common/loading-state";
import NotFound from "@/components/common/not-found";

export const Route = createFileRoute("/(authed)/settings/")({
  head: () => ({
    meta: [{ title: "Drezzi - Settings" }],
  }),
  errorComponent: ({ error }) => (
    <CustomError description={error.message} title="Error" />
  ),
  notFoundComponent: NotFound,
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading settings...`} />;
  },
  component: lazyRouteComponent(() => import("src/screens/settings/index")),
});
