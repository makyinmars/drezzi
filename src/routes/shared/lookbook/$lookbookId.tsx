import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/shared/lookbook/$lookbookId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/shared/lookbook/$lookbookId"!</div>;
}
