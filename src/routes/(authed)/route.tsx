import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import AuthContentLayout from "@/components/common/auth-content-layout";
import { useRealtimeUpdates } from "@/hooks/use-websocket";

function AuthedLayout() {
  useRealtimeUpdates();

  return (
    <AuthContentLayout>
      <Outlet />
    </AuthContentLayout>
  );
}

export const Route = createFileRoute("/(authed)")({
  beforeLoad: async ({ context }) => {
    const auth = await context.queryClient.fetchQuery(
      context.trpc.auth.getSession.queryOptions()
    );

    if (!auth) {
      throw redirect({
        to: "/",
      });
    }

    return {
      auth,
    };
  },
  component: AuthedLayout,
});
