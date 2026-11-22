import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { ArtistJobRow } from "@/components/settings/ArtistJobRow";
import { RecalculateScoresRow } from "@/components/settings/RecalculateScoresRow";
import { ListeningRow } from "@/components/settings/ListeningRow";
import { StreamingHistoryRow } from "@/components/settings/StreamingHistoryRow";
import { BuildInfo } from "@/components/settings/BuildInfo";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import styles from "./index.module.css";

const lastRunsQueryOptions = queryOptions({
  queryKey: queryKeys.settings.lastRuns,
  queryFn: () => handle(client.api.settings["last-runs"].$get()),
});

const jobIntervalsQueryOptions = queryOptions({
  queryKey: queryKeys.settings.jobIntervals,
  queryFn: () => handle(client.api.settings["job-intervals"].$get()),
});

const jobResultsQueryOptions = queryOptions({
  queryKey: queryKeys.settings.jobResults,
  queryFn: () => handle(client.api.settings["job-results"].$get()),
});

const listeningQueryOptions = queryOptions({
  queryKey: queryKeys.settings.listening,
  queryFn: () => handle(client.api.listening.$get()),
});

export const Route = createFileRoute("/settings/")({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: "Settings" }],
  }),
});

function RouteComponent() {
  return (
    <AdminOnly>
      <Settings />
    </AdminOnly>
  );
}

function Settings() {
  const { data: lastRuns } = useSuspenseQuery(lastRunsQueryOptions);
  const { data: jobResults } = useSuspenseQuery(jobResultsQueryOptions);
  const { data: jobIntervals } = useSuspenseQuery(jobIntervalsQueryOptions);
  const { data: listening } = useSuspenseQuery(listeningQueryOptions);

  return (
    <div className={styles.page}>
      <PageHeader title="Settings" />
      <section>
        <SectionHeader title="Artists" />
        <div className={styles.body}>
          <ArtistJobRow
            job="artist-images"
            title="Artist photos"
            description="Gets each artist's current photo from Spotify."
            actionLabel="Update photos"
            lastRun={lastRuns.artist_images_last_run ?? null}
            result={jobResults.images}
            intervalDays={jobIntervals.intervals["artist-images"] ?? 0}
            scheduleEnabled={jobIntervals.scheduleEnabled}
          />
          <ArtistJobRow
            job="artist-headers"
            title="Artist headers"
            description="Gets the banner from each artist's Spotify page. This takes a few minutes."
            actionLabel="Update headers"
            lastRun={lastRuns.artist_headers_last_run ?? null}
            result={jobResults.headers}
            intervalDays={jobIntervals.intervals["artist-headers"] ?? 0}
            scheduleEnabled={jobIntervals.scheduleEnabled}
          />
          <ArtistJobRow
            job="listener-links"
            title="Listener links"
            description="Gets the artists Last.fm listeners play alongside each artist."
            actionLabel="Update links"
            lastRun={lastRuns.listener_links_last_run ?? null}
            result={null}
            intervalDays={jobIntervals.intervals["listener-links"] ?? 0}
            scheduleEnabled={jobIntervals.scheduleEnabled}
          />
          <ArtistJobRow
            job="album-suggestions"
            title="Album suggestions"
            description="Finds new albums by reviewed artists, and picks albums by the artists listeners link to your favourites, for the Review an album page."
            actionLabel="Update suggestions"
            lastRun={lastRuns.album_suggestions_last_run ?? null}
            result={null}
            intervalDays={jobIntervals.intervals["album-suggestions"] ?? 0}
            scheduleEnabled={jobIntervals.scheduleEnabled}
          />
          <RecalculateScoresRow lastRun={lastRuns.artist_scores_last_run ?? null} />
        </div>
      </section>
      <section className={styles.section}>
        <SectionHeader title="Listening" />
        <div className={styles.body}>
          <ListeningRow status={listening} />
          <StreamingHistoryRow lastImport={listening.lastImport} />
          <ArtistJobRow
            job="played-tracks"
            title="Played tracks"
            description="Looks up each new played track and artist on Spotify, then groups the copies of each album and recording so the stats count them once."
            actionLabel="Look up tracks"
            lastRun={lastRuns.played_tracks_last_run ?? null}
            result={null}
            intervalDays={jobIntervals.intervals["played-tracks"] ?? 0}
            scheduleEnabled={jobIntervals.scheduleEnabled}
          />
          <ArtistJobRow
            job="played-genres"
            title="Played artist genres"
            description="Gives each new played artist up to 3 genres from the tags Last.fm listeners use most for them."
            actionLabel="Look up genres"
            lastRun={lastRuns.played_genres_last_run ?? null}
            result={null}
            intervalDays={jobIntervals.intervals["played-genres"] ?? 0}
            scheduleEnabled={jobIntervals.scheduleEnabled}
          />
        </div>
      </section>
      <section className={styles.section}>
        <SectionHeader title="Build" />
        <div className={styles.body}>
          <BuildInfo />
        </div>
      </section>
    </div>
  );
}
