import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TrackRow } from "@/components/artist/TracksByRating";
import styles from "./TracksByRating.module.css";

import type { DisplayTrack } from "@shared/types";

const SHOWN_FIRST = 20;

interface TracksByPlaysProps {
  tracks: DisplayTrack[];
  /** Each track's plays, by Spotify ID */
  plays: Record<string, number>;
  /** The artist whose page this is. Their name is left out of the feature credits. */
  artistName: string;
}

/** The artist's played tracks, most played first, each with its plays. The first 20 show, and a button shows the rest. */
export function TracksByPlays({ tracks, plays, artistName }: TracksByPlaysProps) {
  const [showAll, setShowAll] = useState(false);
  const played = tracks.filter(track => (plays[track.spotifyID] ?? 0) > 0).sort((first, second) => plays[second.spotifyID] - plays[first.spotifyID]);
  const shown = showAll ? played : played.slice(0, SHOWN_FIRST);

  return (
    <div className={styles.shell}>
      <div className={styles.group}>
        <ol className={styles.columns}>
          {shown.map(track => (
            <TrackRow key={track.spotifyID} track={track} artistName={artistName} plays={plays[track.spotifyID]} />
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
