import { RequireAdmin } from "@/components/RequireAdmin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/bookmarks/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <RequireAdmin>
      <div>Hello "/bookmarks/"!</div>
    </RequireAdmin>
  );
}
