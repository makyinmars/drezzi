import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/support")({
  head: () => ({
    meta: [
      {
        title: "Drezzi - Support",
      },
    ],
  }),
  component: lazyRouteComponent(() => import("@/screens/support")),
});
