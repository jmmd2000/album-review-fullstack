import AlbumCard from "@/components/AlbumCard";
import ArtistCard from "@/components/ArtistCard";
import GenrePills from "@/components/GenrePills";
import BentoCard from "@/components/stats/BentoCard";
import StatBox from "@/components/stats/StatBox";
import { queryClient } from "@/main";
import {
  Genre,
  DisplayAlbum,
  DisplayArtist,
  GetStatsOptions,
} from "@shared/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Music, Users, Disc, Headphones } from "lucide-react";
import DistributionChart from "@/components/stats/DistributionChart";
import { Dropdown } from "@/components/Dropdown";
const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchOverview(): Promise<{
  leastFavouriteGenre: Genre | null;
  favouriteGenre: Genre | null;
  leastFavouriteAlbum: DisplayAlbum | null;
  favouriteAlbum: DisplayAlbum | null;
  leastFavouriteArtist: DisplayArtist | null;
  favouriteArtist: DisplayArtist | null;
}> {
  const res = await fetch(`${API_BASE_URL}/api/stats/favourites`);
  return await res.json();
}

async function fetchGenreStats(slug: string): Promise<{
  reviewedAlbumCount: number | null;
  averageScore: number | null;
  relatedGenres: Genre[] | null;
  albums: {
    highestRated: DisplayAlbum;
    lowestRated: DisplayAlbum;
  } | null;
  name: string | null;
  slug: string | null;
  allGenres: Genre[];
}> {
  const queryParams = new URLSearchParams();
  if (slug) queryParams.set("slug", slug);
  const res = await fetch(
    `${API_BASE_URL}/api/stats/genres?${queryParams.toString()}`
  );
  return await res.json();
}

async function fetchRatingDistribution(
  resource: "albums" | "tracks" | "artists"
): Promise<{ rating: string; count: number }[]> {
  const queryParams = new URLSearchParams();
  if (resource) queryParams.set("resource", resource);
  const res = await fetch(
    `${API_BASE_URL}/api/stats/distribution?${queryParams.toString()}`
  );
  return await res.json();
}

async function fetchResourceCounts(): Promise<{
  albumCount: number;
  artistCount: number;
  genreCount: number;
  trackCount: number;
}> {
  const res = await fetch(`${API_BASE_URL}/api/stats/counts`);
  return await res.json();
}

const overviewQueryOptions = queryOptions({
  queryKey: ["stats", "overview"],
  queryFn: fetchOverview,
});

const genresQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: ["stats", "genres", slug],
    queryFn: () => fetchGenreStats(slug),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

const distributionQueryOptions = (resource: "albums" | "tracks" | "artists") =>
  queryOptions({
    queryKey: ["stats", "distribution", resource],
    queryFn: () => fetchRatingDistribution(resource),
    placeholderData: prev => prev,
    staleTime: 1000 * 60 * 10,
  });

const countQueryOptions = queryOptions({
  queryKey: ["stats", "counts"],
  queryFn: fetchResourceCounts,
});

export const Route = createFileRoute("/stats/")({
  loaderDeps: ({ search }: { search: GetStatsOptions }) => ({
    slug: search.slug ?? "",
    resource: search.resource ?? "albums",
  }),
  loader: async ({
    deps: { slug, resource },
  }: {
    deps: { slug: string; resource: "albums" | "tracks" | "artists" };
  }) =>
    Promise.all([
      queryClient.ensureQueryData(overviewQueryOptions),
      queryClient.ensureQueryData(genresQueryOptions(slug)),
      queryClient.ensureQueryData(distributionQueryOptions(resource)),
      queryClient.ensureQueryData(countQueryOptions),
    ]),
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Stats" }],
  }),
});

function RouteComponent() {
  const options: GetStatsOptions = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data: favourites } = useQuery(overviewQueryOptions);
  const { data: counts } = useQuery(countQueryOptions);

  const [selectedResource, setSelectedResource] = useState<
    "albums" | "tracks" | "artists"
  >("albums");
  const { data: distribution } = useQuery(
    distributionQueryOptions(selectedResource)
  );

  const [selectedGenre, setSelectedGenre] = useState<string>(
    options.slug || ""
  );
  const { data: genre } = useQuery(genresQueryOptions(selectedGenre));

  if (!selectedGenre && genre?.allGenres?.length) {
    setSelectedGenre(genre.allGenres[0].slug);
  }

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLUListElement>(null);

  const onSelectGenre = (value: string[]) => {
    const newSlug = value[0];
    setSelectedGenre(newSlug);
    setDropdownOpen(false);

    navigate({
      search: prev => ({ ...prev, slug: newSlug }),
    });

    queryClient.invalidateQueries({
      queryKey: genresQueryOptions(newSlug).queryKey,
    });
  };

  const onSelectResource = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as "albums" | "tracks" | "artists";
    setSelectedResource(value);

    navigate({
      search: prev => ({ ...prev, resource: value }),
    });

    console.log("Selected resource:", value);
    queryClient.invalidateQueries({
      queryKey: distributionQueryOptions(value).queryKey,
    });
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 grid-flow-row lg:grid-rows-5 gap-4 max-w-9/10 lg:max-w-[1600px] mx-auto h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)]">
      <BentoCard>
        {counts?.albumCount ? (
          <StatBox
            label="Albums"
            value={counts.albumCount}
            icon={
              <Disc className="w-6 h-6 lg:w-10 lg:h-10 opacity-80 text-blue-500" />
            }
          />
        ) : (
          <NoDataFound message="Couldn't get data." />
        )}
      </BentoCard>
      <BentoCard>
        {counts?.artistCount ? (
          <StatBox
            label="Artists"
            value={counts.artistCount}
            icon={
              <Users className="w-6 h-6 lg:w-10 lg:h-10 opacity-80 text-green-500" />
            }
          />
        ) : (
          <NoDataFound message="Couldn't get data." />
        )}
      </BentoCard>
      <BentoCard className="col-start-1 row-start-2 lg:col-start-3 lg:row-start-1">
        {counts?.trackCount ? (
          <StatBox
            label="Tracks"
            value={counts.trackCount}
            icon={
              <Music className="w-6 h-6 lg:w-10 lg:h-10 opacity-80 text-orange-500" />
            }
          />
        ) : (
          <NoDataFound message="Couldn't get data." />
        )}
      </BentoCard>
      <BentoCard className="col-start-2 row-start-2 lg:col-start-4 lg:row-start-1">
        {counts?.genreCount ? (
          <StatBox
            label="Genres"
            value={counts.genreCount}
            icon={
              <Headphones className="w-6 h-6 lg:w-10 lg:h-10 opacity-80 text-purple-500" />
            }
          />
        ) : (
          <NoDataFound message="Couldn't get data." />
        )}
      </BentoCard>
      <BentoCard className="col-span-2 lg:col-span-4 row-span-4 lg:row-span-2 col-start-1 row-start-3 lg:row-start-2">
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 content-center gap-8 items-center mx-auto place-items-center">
            {favourites?.favouriteAlbum && (
              <div className="flex flex-col gap-2 max-w-[200px]">
                <p className="text-xs text-gray-400 my-1 text-center">
                  Favourite Album
                </p>
                <AlbumCard album={favourites.favouriteAlbum} />
              </div>
            )}
            {favourites?.favouriteArtist && (
              <div className="flex flex-col gap-2 max-w-[200px]">
                <p className="text-xs text-gray-400 my-1 text-center">
                  Favourite Artist
                </p>
                <ArtistCard artist={favourites.favouriteArtist} />
              </div>
            )}
            {favourites?.leastFavouriteAlbum && (
              <div className="flex flex-col gap-2 max-w-[200px]">
                <p className="text-xs text-gray-400 my-1 text-center">
                  Least Favourite Album
                </p>
                <AlbumCard album={favourites.leastFavouriteAlbum} />
              </div>
            )}
            {favourites?.leastFavouriteArtist && (
              <div className="flex flex-col gap-2 max-w-[200px]">
                <p className="text-xs text-gray-400 my-1 text-center">
                  Least Favourite Artist
                </p>
                <ArtistCard artist={favourites.leastFavouriteArtist} />
              </div>
            )}
          </div>
        </div>
      </BentoCard>
      <BentoCard className="col-span-2 lg:col-span-4 row-span-1 lg:row-span-2 col-start-1 row-start-7">
        {distribution ? (
          <div>
            <div className="flex flex-row justify-start items-center px-4 gap-2">
              <select
                className="bg-neutral-800 text-white font-semibold border border-gray-600 rounded"
                value={selectedResource}
                onChange={onSelectResource}
              >
                <option value="albums">Album</option>
                <option value="tracks">Track</option>
                <option value="artists">Artist</option>
              </select>
              <p className="text-lg font-semibold tracking-wide">
                {" "}
                Rating Distribution
              </p>
            </div>
            <DistributionChart
              data={distribution}
              resource={selectedResource}
            />
          </div>
        ) : (
          <NoDataFound message="No data available for rating distribution." />
        )}
      </BentoCard>
      <BentoCard className="col-span-2 col-start-1 lg:col-start-5 row-start-8 lg:row-start-1">
        <div className="flex justify-evenly items-center h-full">
          {favourites?.favouriteGenre ? (
            <div className="flex flex-col gap-2 max-w-[200px]">
              <p className="text-sm text-green-400 my-1 text-center bg-green-400/40 rounded-lg border-green-500 border-1 px-2 py-1">
                Favourite Genre
              </p>
              <GenrePills genres={[favourites?.favouriteGenre]} />
            </div>
          ) : (
            <NoDataFound message="No data for favourite genre." />
          )}
          {favourites?.leastFavouriteGenre ? (
            <div className="flex flex-col gap-2 max-w-[200px]">
              <p className="text-sm text-red-400 my-1 text-center bg-red-400/40 rounded-lg border-red-500 border-1 px-2 py-1">
                Least Favourite Genre
              </p>
              <GenrePills genres={[favourites?.leastFavouriteGenre]} />
            </div>
          ) : (
            <NoDataFound message="No data for least favourite genre." />
          )}
        </div>
      </BentoCard>
      <BentoCard className="col-span-2 col-start-1 lg:col-start-5 row-start-9 lg:row-start-2 z-50">
        {genre && genre.slug && genre.name ? (
          <div>
            <p className="text-lg px-4 mb-2 font-semibold tracking-wide">
              Genre Stats
            </p>
            <div className="flex justify-evenly items-center px-4">
              <div className="flex-4/5">
                {genre.allGenres && (
                  <Dropdown
                    items={genre.allGenres.map(g => ({
                      name: g.name,
                      value: g.slug,
                    }))}
                    dropdownRef={dropdownRef}
                    isOpen={dropdownOpen}
                    setIsOpen={setDropdownOpen}
                    onSelect={onSelectGenre}
                    multiple={false}
                    default={{ name: genre.name, value: genre.slug }}
                  />
                )}
              </div>
              <div className="flex flex-2/3 gap-2 mb-4 justify-evenly">
                <div>
                  <p className="text-2xl lg:text-4xl font-bold text-white">
                    {genre.reviewedAlbumCount}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Reviews
                  </p>
                </div>

                <div>
                  <p className="text-2xl lg:text-4xl font-bold text-white">
                    {genre.averageScore?.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">
                    Average score
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <NoDataFound message="No data available for genre stats." />
        )}
      </BentoCard>
      <BentoCard className="col-span-2 row-span-2 col-start-1 lg:col-start-5 row-start-10 lg:row-start-3">
        <div className="flex flex-row justify-evenly gap-8 mb-2 max-w-[80%] m-auto">
          {genre?.albums?.highestRated && (
            <div className="flex flex-col gap-2 max-w-[200px]">
              <p className="text-xs text-gray-400 mt-2 text-center">
                Favourite Album in Genre
              </p>
              <AlbumCard album={genre.albums.highestRated} />
            </div>
          )}
          {genre?.albums?.lowestRated && (
            <div className="flex flex-col gap-2 max-w-[200px]">
              <p className="text-xs text-gray-400 mt-2 text-center">
                Least Favourite Album in Genre
              </p>
              <AlbumCard album={genre.albums.lowestRated} />
            </div>
          )}
        </div>
      </BentoCard>
      <BentoCard className="col-span-2 col-start-1 lg:col-start-5 row-start-12 lg:row-start-5 mb-8 lg:mb-0">
        {genre?.relatedGenres && genre.relatedGenres.length > 0 ? (
          <div className="mb-4 flex flex-col gap-4 items-start">
            <p className="text-lg px-4 mb-2 font-semibold tracking-wide">
              Top Related Genres
            </p>
            <GenrePills genres={genre.relatedGenres || []} />
          </div>
        ) : (
          <NoDataFound message="No related genres found." />
        )}
      </BentoCard>
    </div>
  );
}

interface NoDataFoundProps {
  message: string;
}

export const NoDataFound = ({ message }: NoDataFoundProps) => {
  return (
    <p className="flex items-center text-neutral-400 w-full h-full justify-center">
      {message}
    </p>
  );
};
