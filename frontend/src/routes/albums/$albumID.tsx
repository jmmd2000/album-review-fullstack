import { queryOptions, useQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryClient } from "../../main";
import { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchNotes(): Promise<string[]> {
  const response = await fetch(`http://localhost:4000/api/notes`);
  console.log({ response });
  return await response.json();
}

const notesQueryOptions = queryOptions({
  queryKey: ["notes"],
  queryFn: fetchNotes,
});

const ErrorComponent = ({ error }: ErrorComponentProps) => {
  const router = useRouter();
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  useEffect(() => {
    // Reset the query error boundary
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      {error.message}
      <button
        onClick={() => {
          // Invalidate the route to reload the loader, and reset any router error boundaries
          router.invalidate();
        }}
      >
        retry
      </button>
    </div>
  );
};

export const Route = createFileRoute("/albums/$albumID")({
  loader: () => queryClient.ensureQueryData(notesQueryOptions),
  component: RouteComponent,
  errorComponent: ErrorComponent,
});

function RouteComponent() {
  const { data, error, isPending } = useQuery({ queryKey: ["notes"], queryFn: fetchNotes });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error instanceof Error) {
    return <div>An error occurred: {error.message}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  const handleSubmit = async () => {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: "New note", content: "This is a new note", dateCreated: new Date(), dateModified: new Date() }),
    });

    if (!response.ok) {
      console.error("Failed to submit note:", response.statusText);
    } else {
      console.log("Note submitted successfully");
    }

    console.log(response);
  };

  console.log(data);

  return (
    <>
      <button data-test="submit-button" onClick={handleSubmit}>
        Submit new note
      </button>
    </>
  );
}
