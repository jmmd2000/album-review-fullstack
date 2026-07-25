import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/albums/$albumID/edit")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Edit Review",
      },
    ],
  }),
});

function RouteComponent() {
  return (
    <>
      <h1>Edit review</h1>
      <p>The review editor is being rebuilt.</p>
    </>
  );
}
