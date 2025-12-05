import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/lookbooks/$lookbookId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/lookbooks/$lookbookId"!</div>;
}
