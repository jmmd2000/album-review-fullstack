import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { ArtistJobRow } from "@/components/settings/ArtistJobRow";
import { RecalculateScoresRow } from "@/components/settings/RecalculateScoresRow";
import { RefreshScheduleRow } from "@/components/settings/RefreshScheduleRow";
import { BuildInfo } from "@/components/settings/BuildInfo";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import styles from "./index.module.css";

const lastRunsQueryOptions = queryOptions({
  queryKey: queryKeys.settings.lastRuns,
  queryFn: () => handle(client.api.settings["last-runs"].$get()),
});

const jobResultsQueryOptions = queryOptions({
  queryKey: queryKeys.settings.jobResults,
  queryFn: () => handle(client.api.settings["job-results"].$get()),
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
          />
          <ArtistJobRow
            job="artist-headers"
            title="Artist headers"
            description="Gets the banner from each artist's Spotify page. This takes a few minutes."
            actionLabel="Update headers"
            lastRun={lastRuns.artist_headers_last_run ?? null}
            result={jobResults.headers}
          />
          <RefreshScheduleRow />
          <RecalculateScoresRow lastRun={lastRuns.artist_scores_last_run ?? null} />
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
