import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/profile/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/profile/"!</div>;
}
