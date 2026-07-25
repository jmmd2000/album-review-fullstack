import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/albums/$albumID/create")({
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "New Review",
      },
    ],
  }),
});

function RouteComponent() {
  return (
    <>
      <h1>New review</h1>
      <p>The review editor is being rebuilt.</p>
    </>
  );
}
