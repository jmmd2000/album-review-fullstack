import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../main";
import { createFileRoute } from "@tanstack/react-router";

async function fetchToken(): Promise<string> {
  const response = await fetch(`http://localhost:4000/api/spotify`);
  console.log({ response });
  return await response.json();
}

const tokenQueryOptions = queryOptions({
  queryKey: ["token"],
  queryFn: fetchToken,
});

export const Route = createFileRoute("/albums/")({
  loader: () => queryClient.ensureQueryData(tokenQueryOptions),
  component: RouteComponent,
});

function RouteComponent() {
  const { data, error, isPending } = useQuery({ queryKey: ["notes"], queryFn: fetchToken });
  console.log({ data, error, isPending });
  return <div>Hello "/albums/"!</div>;
}
