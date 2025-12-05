import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/try-on/$tryOnId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/try-on/$tryOnId"!</div>;
}
