import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { reviewedDate, shortRuntime, ukReleaseDate } from "@/lib/albumFacts";
import { morphProps } from "@/lib/coverMorph";
import { describeMinutes, describePlays } from "@/lib/listening";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import styles from "./AlbumInfoPanel.module.css";

import type { Genre, Jsonified, ReviewedAlbum, ReviewedArtist } from "@shared/types";

interface AlbumInfoPanelProps {
  album: Jsonified<ReviewedAlbum>;
  artists: Jsonified<ReviewedArtist>[];
  genres: Jsonified<Genre>[];
  /** The admin's all-time plays and minutes of the album and their first play, null while they load. Visitors get none. */
  listening?: { plays: number | null; minutes: number | null; firstPlayedAt: string | null };
}

const firstPlayDate = (date: string) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });

/**
 * The album's title, artists, score, facts and genres, on a see-through panel over the backdrop.
 * The admin also sees their plays, minutes and first play, on a line under the facts.
 */
export function AlbumInfoPanel({ album, artists, genres, listening }: AlbumInfoPanelProps) {
  const photoArtist = artists[0];
  const photo = photoArtist?.imageURLs.at(-1);

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>{album.name}</h1>

      <p className={styles.byline}>
        {photo && <img src={photo.url} alt="" width={34} height={34} {...morphProps("artist", photoArtist.spotifyID)} />}
        <span>
          {artists.length > 0
            ? artists.map((artist, index) => (
                <Fragment key={artist.spotifyID}>
                  {index > 0 && ", "}
                  <Link to="/artists/$artistID" params={{ artistID: artist.spotifyID }}>
                    {artist.name}
                  </Link>
                </Fragment>
              ))
            : album.artistName}
        </span>
      </p>

      <div className={styles.score}>
        <ScoreDisplay key={album.spotifyID} score={album.finalScore} arriveFor={album.spotifyID} />
      </div>

      <p className={styles.facts}>
        <span>Released {ukReleaseDate(album.releaseDate)}</span>
        <span>{shortRuntime(album.runtime)}</span>
        <span>Reviewed {reviewedDate(album.createdAt)}</span>
      </p>

      {listening && (
        <p className={styles.listening}>
          <span>{listening.plays === null ? "– plays" : describePlays(listening.plays)}</span>
          <span>{listening.minutes === null ? "– minutes" : describeMinutes(listening.minutes)}</span>
          {(listening.plays === null || listening.firstPlayedAt) && <span className={styles.firstPlayed}>First played {listening.firstPlayedAt ? firstPlayDate(listening.firstPlayedAt) : "–"}</span>}
        </p>
      )}

      {genres.length > 0 && (
        <ul className={styles.genres}>
          {genres.map(genre => (
            <li key={genre.slug}>
              <Link to="/albums" search={{ genres: genre.slug }}>
                {genre.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
