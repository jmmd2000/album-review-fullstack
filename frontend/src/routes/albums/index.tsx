import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/main";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DisplayAlbum, GetAllAlbumsOptions } from "@shared/types";
import AlbumCard from "@components/AlbumCard";
import CardGrid from "@components/CardGrid";
import { motion } from "framer-motion";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchAllAlbums(options: GetAllAlbumsOptions): Promise<{ albums: DisplayAlbum[]; furtherPages: boolean }> {
  const queryParams = new URLSearchParams();

  if (options.page) queryParams.set("page", String(options.page));
  if (options.order) queryParams.set("order", options.order);
  if (options.orderBy) queryParams.set("orderBy", options.orderBy);
  if (options.search) queryParams.set("search", options.search);

  console.log(queryParams);

  const response = await fetch(`${API_BASE_URL}/api/albums?${queryParams.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }

  return await response.json();
}

const albumQueryOptions = (options: GetAllAlbumsOptions) =>
  queryOptions({
    queryKey: ["albums", options],
    queryFn: () => fetchAllAlbums(options),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 10,
  });

export const Route = createFileRoute("/albums/")({
  loaderDeps: ({ search }: { search: GetAllAlbumsOptions }) => ({
    page: search.page,
    search: search.search,
    orderBy: search.orderBy,
    order: search.order,
  }),
  loader: async ({ deps: { page, search, orderBy, order } }: { deps: GetAllAlbumsOptions }) => {
    return queryClient.ensureQueryData(albumQueryOptions({ page, search, orderBy, order }));
  },
  component: RouteComponent,
});

function RouteComponent() {
  const options: GetAllAlbumsOptions = Route.useSearch();
  const { data } = useQuery(albumQueryOptions(options));
  const navigate = useNavigate({ from: Route.fullPath });

  const handleNextPage = () => {
    if (data?.furtherPages) {
      navigate({
        search: (prev: Partial<GetAllAlbumsOptions>) => ({ ...prev, page: (prev.page || 1) + 1 }),
      });
    }
  };

  const handlePrevPage = () => {
    navigate({
      search: (prev: Partial<GetAllAlbumsOptions>) => {
        const currentPage = prev.page || 1;
        if (currentPage > 1) {
          return { ...prev, page: currentPage - 1 };
        }
        return prev;
      },
    });
  };

  console.log(data?.furtherPages, options.page);

  if (!data || !data.albums) return <div>Loading...</div>;
  return (
    <motion.div key={options.page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <CardGrid
        cards={data.albums.map((album) => (
          <AlbumCard key={album.spotifyID} album={album} />
        ))}
        options={{ controls: true, counter: true }}
        nextPage={handleNextPage}
        previousPage={handlePrevPage}
        nextDisabled={!data.furtherPages}
        previousDisabled={options.page === 1 || options.page === undefined}
      />
    </motion.div>
  );
}
