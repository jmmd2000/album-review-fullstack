import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { reviewedDate, shortRuntime, ukReleaseDate } from "@/lib/albumFacts";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import styles from "./AlbumInfoPanel.module.css";

import type { Genre, Jsonified, ReviewedAlbum, ReviewedArtist } from "@shared/types";

interface AlbumInfoPanelProps {
  album: Jsonified<ReviewedAlbum>;
  artists: Jsonified<ReviewedArtist>[];
  genres: Jsonified<Genre>[];
}

/** The album's title, artists, score, facts and genres, on a see-through panel over the backdrop. */
export function AlbumInfoPanel({ album, artists, genres }: AlbumInfoPanelProps) {
  const photo = artists[0]?.imageURLs.at(-1);

  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>{album.name}</h1>

      <p className={styles.byline}>
        {photo && <img src={photo.url} alt="" width={34} height={34} />}
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
        <ScoreDisplay score={album.finalScore} />
      </div>

      <p className={styles.facts}>
        <span>Released {ukReleaseDate(album.releaseDate)}</span>
        <span>{shortRuntime(album.runtime)}</span>
        <span>Reviewed {reviewedDate(album.createdAt)}</span>
      </p>

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
