import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { createFileRoute } from "@tanstack/react-router";
import { DisplayAlbum } from "@shared/types";
import AlbumCard from "@components/AlbumCard";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAllAlbums(): Promise<DisplayAlbum[]> {
  const response = await fetch(`${API_BASE_URL}/api/albums`);
  return await response.json();
}

const tokenQueryOptions = queryOptions({
  queryKey: ["albums"],
  queryFn: fetchAllAlbums,
});

export const Route = createFileRoute("/albums/")({
  loader: () => queryClient.ensureQueryData(tokenQueryOptions),
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useQuery(tokenQueryOptions);
  if (!data) return <div>Loading...</div>;
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] max-w-[1900px] mx-4 my-8 gap-4 place-items-center">
      {data.map((album) => (
        <AlbumCard key={album.spotifyID} album={album} />
      ))}
    </div>
  );
}
