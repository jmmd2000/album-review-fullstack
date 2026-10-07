import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ResultDetails } from "@/components/settings/ResultDetails";
import styles from "./RecalculateScoresRow.module.css";

import type { InferResponseType } from "hono/client";

type ScoreChange = InferResponseType<(typeof client.api.settings)["recalculate-scores"]["$post"]>["changedArtists"][number]["changes"][number];

const FIELD_LABELS: Record<ScoreChange["field"], string> = {
  totalScore: "Score",
  peakScore: "Peak",
  latestScore: "Latest",
  reviewCount: "Reviews",
  unrated: "Unrated",
  leaderboardPosition: "Rank",
  peakLeaderboardPosition: "Peak rank",
  latestLeaderboardPosition: "Latest rank",
};

function formatValue(field: ScoreChange["field"], value: number | null) {
  if (value === null) return "none";
  if (field === "unrated") return value ? "yes" : "no";
  if (field === "reviewCount") return String(value);
  if (field === "leaderboardPosition" || field === "peakLeaderboardPosition" || field === "latestLeaderboardPosition") return `#${value}`;
  return value.toFixed(2);
}

/** The settings row that recalculates every artist's scores and ranks, then lists what changed. */
export function RecalculateScoresRow({ lastRun }: { lastRun: string | null }) {
  const queryClient = useQueryClient();

  const recalculation = useMutation({
    mutationFn: () => handle(client.api.settings["recalculate-scores"].$post()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.lastRuns }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artists.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.home.all }),
      ]);
    },
  });

  const result = recalculation.data;

  return (
    <SettingsRow
      title="Artist scores"
      description="Works out every artist's scores and ranks again from their reviews."
      lastRun={lastRun}
      actionLabel="Recalculate"
      onAction={() => recalculation.mutate()}
      isRunning={recalculation.isPending}
    >
      {recalculation.isError && (
        <p className={styles.error} role="alert">
          The scores couldn't be recalculated. Try again.
        </p>
      )}
      {result && (
        <div className={styles.results}>
          <p>
            {result.updatedCount} of {result.totalProcessed} artists changed
          </p>
          {result.changedArtists.length > 0 && (
            <ResultDetails label="Show the changes">
              <ul className={styles.artists}>
                {result.changedArtists.map(artist => (
                  <li key={artist.spotifyID} className={styles.artist}>
                    <Link to="/artists/$artistID" params={{ artistID: artist.spotifyID }} className={styles.artistLink}>
                      {artist.name}
                    </Link>
                    <ul className={styles.changes}>
                      {artist.changes.map(change => (
                        <li key={change.field}>
                          <span className={styles.field}>{FIELD_LABELS[change.field]}</span> {formatValue(change.field, change.before)} → {formatValue(change.field, change.after)}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </ResultDetails>
          )}
        </div>
      )}
    </SettingsRow>
  );
}
