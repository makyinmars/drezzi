import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/try-on/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/try-on/"!</div>;
}
