import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/support")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/support"!</div>;
}
