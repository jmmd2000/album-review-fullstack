import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DisplayArtist, GetPaginatedArtistsOptions } from "@shared/types";
import CardGrid from "@components/CardGrid";
import { motion } from "framer-motion";
import ArtistCard from "@/components/ArtistCard";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchPaginatedArtists(options: GetPaginatedArtistsOptions): Promise<{ artists: DisplayArtist[]; furtherPages: boolean; totalCount: number }> {
  const queryParams = new URLSearchParams();

  if (options.page) queryParams.set("page", String(options.page));
  if (options.order) queryParams.set("order", options.order);
  if (options.orderBy) queryParams.set("orderBy", options.orderBy);
  if (options.search) queryParams.set("search", options.search);

  const response = await fetch(`${API_BASE_URL}/api/artists?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }

  return await response.json();
}

const artistQueryOptions = (options: GetPaginatedArtistsOptions) =>
  queryOptions({
    queryKey: ["artists", options],
    queryFn: () => fetchPaginatedArtists(options),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/artists/")({
  loaderDeps: ({ search }: { search: GetPaginatedArtistsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
  }),
  loader: async ({ deps: { page, search, orderBy, order } }: { deps: GetPaginatedArtistsOptions }) => {
    return queryClient.ensureQueryData(artistQueryOptions({ page, search, orderBy, order }));
  },
  component: RouteComponent,
  head: () => ({
    meta: [
      {
        title: "Artists",
      },
    ],
  }),
});

function RouteComponent() {
  const options: GetPaginatedArtistsOptions = Route.useSearch();
  const { data } = useQuery(artistQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const handleNextPage = () => {
    if (data?.furtherPages) {
      navigate({
        search: (prev: Partial<GetPaginatedArtistsOptions>) => ({ ...prev, page: (prev.page || 1) + 1 }),
      });
    }
  };

  const handlePrevPage = () => {
    navigate({
      search: (prev: Partial<GetPaginatedArtistsOptions>) => {
        const currentPage = prev.page || 1;
        if (currentPage > 1) {
          return { ...prev, page: currentPage - 1 };
        }
        return prev;
      },
    });
  };

  const handleSearch = (search: string) => {
    navigate({
      search: (prev: Partial<GetPaginatedArtistsOptions>) => ({ ...prev, search }),
    });
  };

  console.log("data", data);

  if (!data || !data.artists) return <div>Loading...</div>;
  return (
    <motion.div key={options.page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <CardGrid
        cards={data.artists.map((artist) => (
          <ArtistCard key={artist.spotifyID} artist={artist} />
        ))}
        options={{ search: true, pagination: true, counter: data.totalCount }}
        nextPage={{ action: handleNextPage, disabled: !data.furtherPages }}
        previousPage={{ action: handlePrevPage, disabled: options.page === 1 || options.page === undefined }}
        pageData={{ pageNumber: options.page || 1, totalPages: Math.ceil(data.totalCount / 35) }}
        search={handleSearch}
      />
    </motion.div>
  );
}
