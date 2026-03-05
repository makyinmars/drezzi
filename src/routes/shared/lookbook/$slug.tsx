import { useLingui } from "@lingui/react/macro";
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import z from "zod/v4";

import LoadingState from "@/components/common/loading-state";
import type { RouterOutput } from "@/trpc/utils";

export const Route = createFileRoute("/shared/lookbook/$slug")({
  parseParams: (params) => ({
    slug: z.string().min(1, "Invalid share slug").parse(params.slug),
  }),
  loader: async ({ context, params }) => {
    const lookbook = (await context.queryClient.ensureQueryData(
      context.trpc.lookbook.bySlug.queryOptions({ slug: params.slug })
    )) as RouterOutput["lookbook"]["bySlug"];
    return { lookbook };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.lookbook.name ?? "Lookbook"} - Shared on Drezzi`,
      },
      {
        name: "description",
        content: loaderData?.lookbook.description ?? "A curated lookbook",
      },
    ],
  }),
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="text-center">
        <h2 className="mb-2 font-semibold text-2xl">Lookbook Not Found</h2>
        <p className="text-muted-foreground">
          This lookbook may be private or doesn't exist.
        </p>
      </div>
    </div>
  ),
  pendingComponent: () => {
    const { t } = useLingui();
    return <LoadingState text={t`Loading lookbook...`} />;
  },
  component: lazyRouteComponent(() => import("src/screens/share/share-slug")),
});
