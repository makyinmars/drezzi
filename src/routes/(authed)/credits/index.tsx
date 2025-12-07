import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import z from "zod/v4";

import CustomError from "@/components/common/custom-error";
import LoadingState from "@/components/common/loading-state";
import NotFound from "@/components/common/not-found";

const searchSchema = z.object({
  purchase: z.enum(["success", "cancelled"]).optional(),
  session_id: z.string().optional(),
});

export const Route = createFileRoute("/(authed)/credits/")({
  head: () => ({
    meta: [{ title: "Drezzi - Credits" }],
  }),
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        context.trpc.credits.getBalance.queryOptions()
      ),
      context.queryClient.ensureQueryData(
        context.trpc.credits.getPackages.queryOptions()
      ),
      context.queryClient.ensureQueryData(
        context.trpc.credits.getHistory.queryOptions({ limit: 10 })
      ),
    ]);
  },
  errorComponent: ({ error }) => (
    <CustomError description={error.message} title="Error" />
  ),
  notFoundComponent: NotFound,
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading credits...`} />;
  },
  component: lazyRouteComponent(() => import("@/screens/credits/index")),
});
