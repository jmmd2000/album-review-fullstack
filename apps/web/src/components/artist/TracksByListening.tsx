import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TrackRow } from "@/components/artist/TracksByRating";
import { describeAmount, type RankBy } from "@/lib/listening";
import styles from "./TracksByRating.module.css";

import type { DisplayTrack } from "@shared/types";

const SHOWN_FIRST = 20;

interface TracksByListeningProps {
  tracks: DisplayTrack[];
  /** Each track's plays or minutes, by Spotify ID */
  amounts: Record<string, number>;
  by: RankBy;
  /** The artist whose page this is. Their name is left out of the feature credits. */
  artistName: string;
}

/** The artist's played tracks, most played or most minutes first, each with its amount. The first 20 show, and a button shows the rest. */
export function TracksByListening({ tracks, amounts, by, artistName }: TracksByListeningProps) {
  const [showAll, setShowAll] = useState(false);
  const played = tracks.filter(track => (amounts[track.spotifyID] ?? 0) > 0).sort((first, second) => amounts[second.spotifyID] - amounts[first.spotifyID]);
  const shown = showAll ? played : played.slice(0, SHOWN_FIRST);

  return (
    <div className={styles.shell}>
      <div className={styles.group}>
        <ol className={styles.columns}>
          {shown.map(track => (
            <TrackRow key={track.spotifyID} track={track} artistName={artistName} listening={describeAmount(amounts[track.spotifyID], by)} />
          ))}
        </ol>
      </div>
      {!showAll && played.length > SHOWN_FIRST && (
        <Button className={styles.more} onClick={() => setShowAll(true)}>
          Show the other {played.length - SHOWN_FIRST} tracks
        </Button>
      )}
    </div>
  );
}
