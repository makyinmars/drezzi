import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import z from "zod/v4";

import LoadingState from "@/components/common/loading-state";
import type { RouterOutput } from "@/trpc/utils";

export const Route = createFileRoute("/(authed)/garment/$garmentId")({
  parseParams: (params) => ({
    garmentId: z.cuid("Invalid garment ID format").parse(params.garmentId),
  }),
  loader: async ({ context, params }) => {
    const garment = (await context.queryClient.ensureQueryData(
      context.trpc.garment.byId.queryOptions({ id: params.garmentId })
    )) as RouterOutput["garment"]["byId"];
    return { garment };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Drezzi - ${loaderData?.garment.name ?? "Garment"}`,
      },
    ],
  }),
  errorComponent: ({ error }) => {
    const isInvalidFormat = error.message.includes("Invalid garment ID format");
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl">
            {isInvalidFormat ? "Invalid Garment ID" : "Garment Not Found"}
          </h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  },
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading garment...`} />;
  },
  component: lazyRouteComponent(() => import("src/screens/garment/garment-id")),
});
