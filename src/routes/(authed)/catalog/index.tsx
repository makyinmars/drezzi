import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/catalog/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/catalog/"!</div>;
}
