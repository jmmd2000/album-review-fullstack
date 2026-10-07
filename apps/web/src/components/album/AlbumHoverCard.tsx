import { ScoreChip } from "@/components/ui/ScoreChip";
import styles from "./AlbumHoverCard.module.css";

import type { SpotifyImage } from "@shared/types";

interface HoverCardAlbum {
  name: string;
  artistName: string;
  releaseYear: number;
  finalScore: number;
  imageURLs: SpotifyImage[];
}

interface AlbumHoverCardProps {
  album: HoverCardAlbum;
}

/** A small card for an album: its cover, name, artist, year and score. The caller places it. */
export function AlbumHoverCard({ album }: AlbumHoverCardProps) {
  const cover = album.imageURLs[1] ?? album.imageURLs[0];

  return (
    <div className={styles.card}>
      {cover ? <img src={cover.url} alt="" width={52} height={52} /> : <span />}
      <div className={styles.text}>
        <b>{album.name}</b>
        <span>
          {album.artistName}, {album.releaseYear}
        </span>
      </div>
      <ScoreChip score={album.finalScore} />
    </div>
  );
}
