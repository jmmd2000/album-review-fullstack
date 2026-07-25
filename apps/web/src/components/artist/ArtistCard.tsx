import { Link } from "@tanstack/react-router";
import { scoreTier } from "@shared/helpers/ratingTiers";
import type { DisplayArtist } from "@shared/types";
import styles from "./ArtistCard.module.css";

interface ArtistCardProps {
  artist: DisplayArtist;
  position: number | null;
  score: number;
}

export function ArtistCard({ artist, position, score }: ArtistCardProps) {
  const image = artist.imageURLs[1] ?? artist.imageURLs[0];
  const largeImage = artist.imageURLs[0];

  return (
    <Link to="/artists/$artistID" params={{ artistID: artist.spotifyID }} className={styles.card}>
      {image && <img src={image.url} srcSet={largeImage ? `${largeImage.url} 2x` : undefined} alt={artist.name} width={image.width} height={image.height} loading="lazy" />}
      {position !== null && <span className={styles.rank}>{String(position).padStart(2, "0")}</span>}
      {!artist.unrated && (
        <span className={styles.chip} style={{ backgroundColor: `var(--tier-${scoreTier(score).toLowerCase()})` }}>
          {Math.ceil(score)}
        </span>
      )}
      <div className={styles.reveal}>
        <div className={styles.title}>{artist.name}</div>
        <div className={styles.subtitle}>
          {artist.albumCount} {artist.albumCount === 1 ? "album" : "albums"}
        </div>
      </div>
    </Link>
  );
}
