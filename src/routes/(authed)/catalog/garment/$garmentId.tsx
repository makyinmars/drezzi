import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(authed)/catalog/garment/$garmentId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(authed)/catalog/garment/$garmentId"!</div>;
}
