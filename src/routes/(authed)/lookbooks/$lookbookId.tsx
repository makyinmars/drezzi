import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import z from "zod/v4";

import LoadingState from "@/components/common/loading-state";
import type { RouterOutput } from "@/trpc/utils";

export const Route = createFileRoute("/(authed)/lookbooks/$lookbookId")({
  parseParams: (params) => ({
    lookbookId: z.cuid("Invalid lookbook ID format").parse(params.lookbookId),
  }),
  loader: async ({ context, params }) => {
    const lookbook = (await context.queryClient.ensureQueryData(
      context.trpc.lookbook.byId.queryOptions({ id: params.lookbookId })
    )) as RouterOutput["lookbook"]["byId"];
    return { lookbook };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `Drezzi - ${loaderData?.lookbook.name ?? "Lookbook"}`,
      },
    ],
  }),
  errorComponent: ({ error }) => {
    const isInvalidFormat = error.message.includes(
      "Invalid lookbook ID format"
    );
    return (
      <div className="flex min-h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl">
            {isInvalidFormat ? "Invalid Lookbook ID" : "Lookbook Not Found"}
          </h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  },
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading lookbook...`} />;
  },
  component: lazyRouteComponent(
    () => import("src/screens/lookbooks/lookbook-id")
  ),
});
