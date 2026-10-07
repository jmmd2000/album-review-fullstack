import { useState } from "react";
import { scoreTier } from "@shared/helpers/ratingTiers";
import { tierColourVar } from "@/lib/tierColours";
import { splitFeatures } from "@/lib/trackFeatures";
import { Button } from "@/components/ui/Button";
import styles from "./TracksByRating.module.css";

import type { DisplayTrack } from "@shared/types";

const GROUPS_SHOWN_FIRST = 3;

interface RatingGroup {
  rating: number;
  tracks: DisplayTrack[];
}

/** Groups the rated tracks by rating, from 10 down. Empty ratings get no group. */
function groupByRating(tracks: DisplayTrack[]): RatingGroup[] {
  const groups: RatingGroup[] = [];
  for (let rating = 10; rating >= 1; rating--) {
    const inGroup = tracks.filter(track => track.rating === rating);
    if (inGroup.length > 0) groups.push({ rating, tracks: inGroup });
  }
  return groups;
}

interface TracksByRatingProps {
  tracks: DisplayTrack[];
  /** The artist whose page this is. Their name is left out of the feature credits. */
  artistName: string;
}

/** The artist's rated tracks in groups from 10 down. The first three groups show, and a button shows the rest. */
export function TracksByRating({ tracks, artistName }: TracksByRatingProps) {
  const [showAll, setShowAll] = useState(false);
  const groups = groupByRating(tracks);
  const shownGroups = showAll ? groups : groups.slice(0, GROUPS_SHOWN_FIRST);
  const hiddenTrackCount = groups.slice(GROUPS_SHOWN_FIRST).reduce((total, group) => total + group.tracks.length, 0);

  return (
    <div className={styles.shell}>
      {shownGroups.map(group => {
        // Track ratings are out of 10, and the tiers are out of 100
        const tier = scoreTier(group.rating * 10);

        return (
          <div key={group.rating} className={styles.group}>
            <h3 className={styles.heading} style={{ color: tierColourVar(tier) }}>
              {tier}
              <span className={styles.count}>
                {group.tracks.length} {group.tracks.length === 1 ? "track" : "tracks"}
              </span>
            </h3>
            <ul className={styles.columns}>
              {group.tracks.map(track => (
                <TrackRow key={track.spotifyID} track={track} artistName={artistName} />
              ))}
            </ul>
          </div>
        );
      })}
      {!showAll && hiddenTrackCount > 0 && (
        <Button className={styles.more} onClick={() => setShowAll(true)}>
          Show the other {hiddenTrackCount} tracks
        </Button>
      )}
    </div>
  );
}

interface TrackRowProps {
  track: DisplayTrack;
  artistName: string;
}

function TrackRow({ track, artistName }: TrackRowProps) {
  const { title, featuring } = splitFeatures(track.name, track.features, artistName);
  const cover = track.imageURLs?.at(-1);

  return (
    <li className={styles.row} title={track.albumName ? `${track.name}, from ${track.albumName}` : track.name}>
      {cover ? <img src={cover.url} alt="" width={30} height={30} loading="lazy" /> : <span />}
      <span className={styles.name}>
        {title}
        {featuring.length > 0 && <span className={styles.features}> feat. {featuring.join(", ")}</span>}
      </span>
    </li>
  );
}
