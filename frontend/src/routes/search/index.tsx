import AlbumCard from "@/components/AlbumCard";
import CardGrid from "@/components/CardGrid";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { queryClient } from "@/main";
import { DisplayAlbum, SearchAlbumsOptions } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function searchSpotifyAlbums(query: SearchAlbumsOptions): Promise<DisplayAlbum[]> {
  const queryParams = new URLSearchParams();
  if (query) queryParams.set("query", String(query.query));

  const response = await fetch(`${API_BASE_URL}/api/spotify/albums/search?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }

  return await response.json();
}

const searchQueryOptions = (query: SearchAlbumsOptions) =>
  queryOptions({
    queryKey: ["search", query],
    queryFn: () => searchSpotifyAlbums(query),
  });

export const Route = createFileRoute("/search/")({
  loaderDeps: ({ search }: { search: SearchAlbumsOptions }) => ({
    query: search.query,
  }),
  loader: async ({ deps: { query } }: { deps: SearchAlbumsOptions }) => {
    return queryClient.ensureQueryData(searchQueryOptions({ query }));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const options: SearchAlbumsOptions = Route.useSearch();
  const { data } = useQuery(searchQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });
  const [recentAlbums] = useLocalStorage<DisplayAlbum[]>("recentAlbums", []);

  const dataIsEmpty = data?.length === 0;
  const albumCards = dataIsEmpty ? recentAlbums : data;
  const gridHeading = dataIsEmpty ? "Recently viewed albums" : `Search Results for "${options.query}"`;

  const handleSearch = (query: string) => {
    navigate({
      search: (prev: Partial<SearchAlbumsOptions>) => ({ ...prev, query }),
    });
  };

  if (!data) return <div>Loading...</div>;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <CardGrid
        cards={(albumCards || []).map((album) => (
          <AlbumCard key={album.spotifyID} album={album} />
        ))}
        options={{ search: true, pagination: false, counter: albumCards?.length || 0, heading: gridHeading }}
        search={handleSearch}
      />
    </motion.div>
  );
}
