import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Settings",
      },
    ],
  }),
});

function RouteComponent() {
  return (
    <>
      <h1>Settings</h1>
      <p>Being rebuilt.</p>
    </>
  );
}
