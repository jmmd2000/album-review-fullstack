import { scoreTier } from "@shared/helpers/ratingTiers";
import { tierColourVar } from "@/lib/tierColours";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { ScoreExplainer } from "@/components/artist/ScoreExplainer";
import styles from "./ArtistStanding.module.css";

import type { CSSProperties } from "react";

interface StandingArtist {
  unrated: boolean;
  totalScore: number;
  leaderboardPosition: number | null;
  peakScore: number;
  peakLeaderboardPosition: number | null;
  latestScore: number;
  latestLeaderboardPosition: number | null;
}

interface ArtistStandingProps {
  artist: StandingArtist;
  /** The number of artists on the leaderboard */
  rankedArtistCount: number;
  albumCount: number;
  ratedTrackCount: number;
  /** The admin's all-time plays of the artist and their first play, null while they load. Visitors get none. */
  listening?: { plays: number | null; firstPlayedAt: string | null };
}

const firstPlayDate = (date: string) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });

/**
 * The artist's score with a note on how scores work, then one strip of their ranks and counts.
 * An unrated artist has no score or ranks, so the strip shows only the counts. The admin also sees their plays and first play.
 */
export function ArtistStanding({ artist, rankedArtistCount, albumCount, ratedTrackCount, listening }: ArtistStandingProps) {
  return (
    <div className={styles.standing}>
      {!artist.unrated && (
        <div className={styles.score}>
          <ScoreDisplay score={artist.totalScore} />
          <ScoreExplainer />
        </div>
      )}
      <dl className={styles.strip}>
        {!artist.unrated && (
          <>
            {artist.leaderboardPosition !== null && (
              <div>
                <dt>Rank</dt>
                <dd>
                  #{artist.leaderboardPosition}
                  <small>of {rankedArtistCount}</small>
                </dd>
              </div>
            )}
            <ScoreCell label="Peak" score={artist.peakScore} position={artist.peakLeaderboardPosition} />
            <ScoreCell label="Latest" score={artist.latestScore} position={artist.latestLeaderboardPosition} />
          </>
        )}
        <div>
          <dt>Albums</dt>
          <dd>{albumCount}</dd>
        </div>
        <div>
          <dt>Tracks rated</dt>
          <dd>{ratedTrackCount}</dd>
        </div>
        {listening && (
          <>
            <div>
              <dt>Plays</dt>
              <dd>{listening.plays === null ? "–" : listening.plays.toLocaleString("en-GB")}</dd>
            </div>
            <div>
              <dt>First play</dt>
              <dd>{listening.firstPlayedAt ? firstPlayDate(listening.firstPlayedAt) : "–"}</dd>
            </div>
          </>
        )}
      </dl>
    </div>
  );
}

interface ScoreCellProps {
  label: string;
  score: number;
  position: number | null;
}

function ScoreCell({ label, score, position }: ScoreCellProps) {
  const style = { "--tier": tierColourVar(scoreTier(score)) } as CSSProperties;

  return (
    <div style={style}>
      <dt>{label}</dt>
      <dd>
        {Math.ceil(score)}
        {position !== null && <small>#{position}</small>}
      </dd>
    </div>
  );
}
