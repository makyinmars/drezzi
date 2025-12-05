import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import z from "zod/v4";

import LoadingState from "@/components/common/loading-state";

export const Route = createFileRoute("/(authed)/profile/$profileId")({
  parseParams: (params) => ({
    profileId: z.cuid("Invalid profile ID format").parse(params.profileId),
  }),
  loader: async ({ context, params }) => {
    const profile = await context.queryClient.ensureQueryData(
      context.trpc.profile.byId.queryOptions({ id: params.profileId })
    );
    return { profile };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Drezzi - ${loaderData?.profile.name || "Profile"}`,
      },
    ],
  }),
  errorComponent: ({ error }) => {
    const isInvalidFormat = error.message.includes("Invalid profile ID format");
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl">
            {isInvalidFormat ? "Invalid Profile ID" : "Profile Not Found"}
          </h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  },
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading profile...`} />;
  },
  component: lazyRouteComponent(() => import("src/screens/profile/profile-id")),
});
