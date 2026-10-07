import { Link } from "@tanstack/react-router";
import { scoreTier } from "@shared/helpers/ratingTiers";
import { timelinePoints } from "@/lib/scoreTimeline";
import { tierColourVar } from "@/lib/tierColours";
import styles from "./ScoreTimeline.module.css";

import type { CSSProperties } from "react";
import type { SpotifyImage } from "@shared/types";

interface TimelineAlbum {
  spotifyID: string;
  name: string;
  releaseYear: number;
  finalScore: number;
  imageURLs: SpotifyImage[];
}

interface ScoreTimelineProps {
  /** The scored albums, oldest first */
  albums: TimelineAlbum[];
}

/** Each album as its cover at its score, joined by a line, with the years along the bottom. */
export function ScoreTimeline({ albums }: ScoreTimelineProps) {
  const points = timelinePoints(albums.map(album => ({ score: album.finalScore, year: album.releaseYear })));
  const line = points.map(point => `${point.x},${100 - point.y}`).join(" ");

  return (
    <div className={styles.shell}>
      <div className={styles.chart} data-few={albums.length <= 4 ? "" : undefined}>
        <svg className={styles.line} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={line} />
        </svg>
        <ol className={styles.points}>
          {albums.map((album, index) => {
            const point = points[index]!;
            const score = Math.ceil(album.finalScore);
            const cover = album.imageURLs[1] ?? album.imageURLs[0];
            const style = { left: `${point.x}%`, bottom: `${point.y}%`, "--tier": tierColourVar(scoreTier(score)) } as CSSProperties;

            return (
              <li key={album.spotifyID} className={styles.point} style={style}>
                <Link to="/albums/$albumID" params={{ albumID: album.spotifyID }} aria-label={`${album.name}, ${album.releaseYear}, scored ${score}`}>
                  {cover && <img src={cover.url} alt="" loading="lazy" />}
                  <span className={styles.score}>{score}</span>
                  <span className={styles.name}>{album.name}</span>
                </Link>
              </li>
            );
          })}
        </ol>
        <div aria-hidden="true">
          {albums.map((album, index) =>
            points[index]!.showYear ? (
              <span key={album.spotifyID} className={styles.year} style={{ left: `${points[index]!.x}%` }}>
                {album.releaseYear}
              </span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
