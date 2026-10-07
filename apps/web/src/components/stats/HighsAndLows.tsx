import { Link } from "@tanstack/react-router";
import { highsAndLows } from "@/lib/statsSelection";
import { morphProps } from "@/lib/coverMorph";
import { ScoreChip } from "@/components/ui/ScoreChip";
import styles from "./HighsAndLows.module.css";

import type { ReactNode } from "react";
import type { StatsAlbum, StatsArtist } from "@shared/types";

interface HighsAndLowsProps {
  /** The albums the filters pick */
  albums: StatsAlbum[];
  /** The rated artists with an album in the selection */
  artists: StatsArtist[];
}

/** The best and worst albums and artists in the selection, five of each. */
export function HighsAndLows({ albums, artists }: HighsAndLowsProps) {
  const albumPicks = highsAndLows(albums, album => album.finalScore);
  const artistPicks = highsAndLows(artists, artist => artist.totalScore);

  return (
    <div className={styles.lists}>
      <PickList title="Best albums" empty="No albums here.">
        {albumPicks.highest.map((album, index) => (
          <AlbumRow key={album.spotifyID} album={album} place={index + 1} />
        ))}
      </PickList>
      <PickList title="Worst albums" empty="Too few albums for a worst list.">
        {albumPicks.lowest.map((album, index) => (
          <AlbumRow key={album.spotifyID} album={album} place={index + 1} />
        ))}
      </PickList>
      <PickList title="Best artists" empty="No ranked artists here.">
        {artistPicks.highest.map((artist, index) => (
          <ArtistRow key={artist.spotifyID} artist={artist} place={index + 1} />
        ))}
      </PickList>
      <PickList title="Worst artists" empty="Too few ranked artists for a worst list.">
        {artistPicks.lowest.map((artist, index) => (
          <ArtistRow key={artist.spotifyID} artist={artist} place={index + 1} />
        ))}
      </PickList>
    </div>
  );
}

interface PickListProps {
  title: string;
  /** What the list says when it has no rows */
  empty: string;
  children: ReactNode[];
}

function PickList({ title, empty, children }: PickListProps) {
  return (
    <div>
      <h3 className={styles.title}>{title}</h3>
      <ol className={styles.list}>{children.length > 0 ? children : <li className={styles.empty}>{empty}</li>}</ol>
    </div>
  );
}

function AlbumRow({ album, place }: { album: StatsAlbum; place: number }) {
  const cover = album.imageURLs[1] ?? album.imageURLs[0];

  return (
    <li>
      <Link to="/albums/$albumID" params={{ albumID: album.spotifyID }} className={styles.row}>
        <span className={styles.place}>{place}</span>
        {cover ? <img src={cover.url} alt="" width={48} height={48} loading="lazy" {...morphProps("album", album.spotifyID)} /> : <span />}
        <span className={styles.name}>
          <span title={album.name}>{album.name}</span>
          <small>
            {album.artistName}, {album.releaseYear}
          </small>
        </span>
        <ScoreChip score={album.finalScore} />
      </Link>
    </li>
  );
}

function ArtistRow({ artist, place }: { artist: StatsArtist; place: number }) {
  const photo = artist.imageURLs[1] ?? artist.imageURLs[0];

  return (
    <li>
      <Link to="/artists/$artistID" params={{ artistID: artist.spotifyID }} className={styles.row}>
        <span className={styles.place}>{place}</span>
        {photo ? <img className={styles.round} src={photo.url} alt="" width={48} height={48} loading="lazy" {...morphProps("artist", artist.spotifyID)} /> : <span />}
        <span className={styles.name}>
          <span title={artist.name}>{artist.name}</span>
          <small>
            {artist.albumCount} {artist.albumCount === 1 ? "album" : "albums"}
          </small>
        </span>
        <ScoreChip score={artist.totalScore} />
      </Link>
    </li>
  );
}
