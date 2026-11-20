import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@shared/helpers/formatDate";
import { client, handle } from "@/lib/client";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/Button";
import { SettingsRow } from "@/components/settings/SettingsRow";
import styles from "./ListeningRow.module.css";

import type { InferResponseType } from "hono/client";

type ListeningStatus = InferResponseType<typeof client.api.listening.$get>;

function describeCollection(status: ListeningStatus, isCollecting: boolean): string[] {
  const details = [];
  if (isCollecting) details.push("Collecting now");
  else details.push(status.lastCollected ? `Last collected ${timeAgo(status.lastCollected)}` : "Never collected");
  if (!status.connected) details.push("Spotify isn't connected. Run the spotify:token script and put the token in SPOTIFY_REFRESH_TOKEN.");
  else if (!status.scheduled) details.push("Scheduled collection is turned off on this server.");
  return details;
}

/** The settings row that collects the admin's Spotify plays, with the latest plays under it. */
export function ListeningRow({ status }: { status: ListeningStatus }) {
  const queryClient = useQueryClient();

  const collection = useMutation({
    mutationFn: () => handle(client.api.listening.collect.$post()),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.settings.listening }),
  });

  return (
    <SettingsRow
      title="Spotify plays"
      description="Saves what you play on Spotify every 15 minutes."
      details={describeCollection(status, collection.isPending)}
      action={
        <Button onClick={() => collection.mutate()} disabled={collection.isPending || !status.connected}>
          {collection.isPending ? "Collecting…" : "Collect now"}
        </Button>
      }
    >
      {status.lastError && (
        <p className={styles.error} role="alert">
          Last error: {status.lastError}
        </p>
      )}
      {collection.data && <p>{collection.data.saved === 1 ? "Saved 1 new play" : `Saved ${collection.data.saved} new plays`}</p>}
      {status.recentPlays.length === 0 ? (
        <p className={styles.empty}>No plays yet</p>
      ) : (
        <ol className={styles.plays}>
          {status.recentPlays.map(play => (
            <li key={play.id} className={styles.play}>
              {play.albumImageURL ? <img className={styles.cover} src={play.albumImageURL} alt="" width={48} height={48} loading="lazy" /> : <span className={styles.cover} />}
              <span className={styles.text}>
                <span className={styles.track}>{play.trackName}</span>
                <span className={styles.artists}>{play.artistNames.join(", ")}</span>
              </span>
              <time className={styles.time} dateTime={play.playedAt}>
                {timeAgo(play.playedAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </SettingsRow>
  );
}
