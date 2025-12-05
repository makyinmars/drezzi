import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/settings/"!</div>;
}
