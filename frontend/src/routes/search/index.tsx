import AlbumCard from "@/components/AlbumCard";
import CardGrid from "@/components/CardGrid";
import { RequireAdmin } from "@/components/RequireAdmin";
import { useAlbumStatus } from "@/hooks/useAlbumStatus";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { api } from "@/lib/api";
import { queryClient } from "@/main";
import { DisplayAlbum, SearchAlbumsOptions } from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

async function searchSpotifyAlbums(query: SearchAlbumsOptions): Promise<DisplayAlbum[]> {
  const queryParams = new URLSearchParams();
  if (query) queryParams.set("query", String(query.query));

  return api.get<DisplayAlbum[]>(`/api/spotify/albums/search?${queryParams.toString()}`);
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
  head: () => ({
    meta: [
      {
        title: "Search Albums",
      },
    ],
  }),
});

function RouteComponent() {
  const options: SearchAlbumsOptions = Route.useSearch();
  const { data } = useQuery(searchQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });
  const [recentAlbums] = useLocalStorage<DisplayAlbum[]>("recentAlbums", []);
  const [pageTitle, setPageTitle] = useState<string>("Search Albums");

  const { data: recentAlbumsWithStatus } = useAlbumStatus(recentAlbums);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("query");
    if (query) {
      setPageTitle(`Search results for "${query}"`);
    } else {
      setPageTitle("Search Albums");
    }
  }, [options.query]);

  const dataIsEmpty = data?.length === 0;
  const albumCards = dataIsEmpty ? recentAlbumsWithStatus : data;
  const gridHeading = dataIsEmpty
    ? "Recently viewed albums"
    : `Search results for "${options.query}"`;

  const handleSearch = (query: string) => {
    setPageTitle(`Search results for "${query}"`);
    navigate({
      search: (prev: Partial<SearchAlbumsOptions>) => ({ ...prev, query }),
    });
  };

  if (!data) return <div>Loading...</div>;
  return (
    <>
      <RequireAdmin>
        {/* Setting the title via <title> rather than in the head option of createFileRoute()
        because it was annoying and finnicky to access the search params to update the title.  */}
        <title>{pageTitle}</title>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardGrid
            cards={(albumCards || []).map(album => (
              <AlbumCard key={album.spotifyID} album={album} bookmarked={album.bookmarked} />
            ))}
            heading={gridHeading}
            counter={albumCards?.length || 0}
            controls={{ search: handleSearch }}
          />
        </motion.div>
      </RequireAdmin>
    </>
  );
}
