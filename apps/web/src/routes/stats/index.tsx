import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { scoreTier } from "@shared/helpers/ratingTiers";
import { queryKeys } from "@/lib/queryKeys";
import { socialMeta } from "@/lib/socialMeta";
import { client, handle } from "@/lib/client";
import { albumMatches, decadeOf, describeSelection, isFiltered, nameSelection } from "@/lib/statsSelection";
import { tierColourVar } from "@/lib/tierColours";
import { AlbumDots } from "@/components/stats/AlbumDots";
import { HighsAndLows } from "@/components/stats/HighsAndLows";
import { FilterChip } from "@/components/ui/FilterChip";
import { GenreSelect } from "@/components/ui/GenreSelect";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import styles from "./index.module.css";

import type { StatsFilter } from "@/lib/statsSelection";

async function fetchStats() {
  return handle(client.api.stats.$get());
}

const statsQueryOptions = queryOptions({
  queryKey: queryKeys.stats.overview,
  queryFn: fetchStats,
});

const defaultSearch = { genres: "" } as const;

const statsSearchSchema = z.object({
  // A comma-separated list of genre slugs
  genres: z
    .preprocess(value => (Array.isArray(value) ? value.join(",") : value), z.string())
    .default(defaultSearch.genres)
    .catch(defaultSearch.genres),
  decade: z.coerce.number().int().multipleOf(10).optional().catch(undefined),
});

export const Route = createFileRoute("/stats/")({
  ssr: true,
  validateSearch: statsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQueryOptions),
  component: RouteComponent,
  head: () => ({
    meta: socialMeta({
      title: "Stats",
      description: "Every album I've reviewed on one chart, with the best and worst albums and artists.",
    }),
  }),
});

function RouteComponent() {
  const { data } = useSuspenseQuery(statsQueryOptions);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const filter: StatsFilter = { genres: search.genres ? search.genres.split(",") : [], decade: search.decade ?? null };
  const setFilter = (next: Partial<StatsFilter>) => {
    const { genres, decade } = { ...filter, ...next };
    void navigate({ search: { genres: genres.join(","), decade: decade ?? undefined }, replace: true, resetScroll: false });
  };

  const selected = data.albums.filter(album => albumMatches(album, filter));
  const matchingIDs = new Set(selected.map(album => album.spotifyID));
  const decades = [...new Set(data.albums.map(album => decadeOf(album.releaseYear)))].sort();
  const genreNames = filter.genres.map(slug => data.genres.find(genre => genre.slug === slug)?.name ?? slug);
  const selectedArtistIDs = new Set(selected.flatMap(album => album.artistSpotifyIDs));
  const selectedArtists = isFiltered(filter) ? data.artists.filter(artist => selectedArtistIDs.has(artist.spotifyID)) : data.artists;

  return (
    <>
      <PageHeader title="Stats" />
      <div className={styles.body}>
        <p className={styles.tally}>
          <b>{data.albums.length}</b> albums from <b>{data.artistCount}</b> artists across <b>{data.genres.length}</b> genres, with <b>{data.ratedTrackCount.toLocaleString("en-GB")}</b> tracks rated.
        </p>

        <div className={styles.explorer}>
          <AlbumDots albums={data.albums} matchingIDs={matchingIDs} />
          <div className={styles.side}>
            <div aria-live="polite">
              <Summary count={selected.length} average={averageScore(selected)} genreNames={genreNames} filter={filter} />
            </div>
            <div className={styles.filters}>
              <GenreSelect variant="chip" genres={data.genres} selected={filter.genres} onChange={genres => setFilter({ genres })} />
              <span className={styles.divider} aria-hidden="true" />
              <FilterChip label="All" pressed={filter.decade === null} onClick={() => setFilter({ decade: null })} />
              {decades.map(decade => (
                <FilterChip
                  key={decade}
                  label={`${decade}s`}
                  count={data.albums.filter(album => decadeOf(album.releaseYear) === decade).length}
                  pressed={filter.decade === decade}
                  onClick={() => setFilter({ decade })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className={styles.highs}>
        <SectionHeader title="Highs and lows" aside={nameSelection(genreNames, filter.decade)} />
        <HighsAndLows albums={selected} artists={selectedArtists} />
      </section>
    </>
  );
}

function averageScore(albums: { finalScore: number }[]): number {
  if (albums.length === 0) return 0;
  return Math.round(albums.reduce((total, album) => total + album.finalScore, 0) / albums.length);
}

interface SummaryProps {
  count: number;
  average: number;
  genreNames: string[];
  filter: StatsFilter;
}

function Summary({ count, average, genreNames, filter }: SummaryProps) {
  if (count === 0) return <p className={styles.says}>{isFiltered(filter) ? "Nothing matches. Try another genre or decade." : "No albums reviewed yet."}</p>;

  return (
    <p className={styles.says}>
      {describeSelection(count, genreNames, filter.decade)}, averaging <b style={{ color: tierColourVar(scoreTier(average)) }}>{average}</b>.
    </p>
  );
}
