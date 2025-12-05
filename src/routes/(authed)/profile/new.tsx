import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/profile/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/profile/new"!</div>;
}
