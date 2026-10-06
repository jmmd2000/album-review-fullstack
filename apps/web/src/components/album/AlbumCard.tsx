import { Link } from "@tanstack/react-router";
import { scoreTier } from "@shared/helpers/ratingTiers";
import type { DisplayAlbum } from "@shared/types";
import styles from "./AlbumCard.module.css";

interface AlbumCardProps {
  album: DisplayAlbum;
}

export function AlbumCard({ album }: AlbumCardProps) {
  const image = album.imageURLs[1] ?? album.imageURLs[0];
  const largeImage = album.imageURLs[0];
  const hasScore = album.finalScore !== null;

  return (
    <Link to={hasScore ? "/albums/$albumID" : "/albums/$albumID/create"} params={{ albumID: album.spotifyID }} className={styles.card}>
      {image && <img src={image.url} srcSet={largeImage ? `${largeImage.url} 2x` : undefined} alt={`${album.name} by ${album.artistName}`} width={image.width} height={image.height} loading="lazy" />}
      {hasScore && (
        <span className={styles.chip} style={{ backgroundColor: `var(--colour-tier-${scoreTier(album.finalScore).toLowerCase()})` }}>
          {Math.ceil(album.finalScore!)}
        </span>
      )}
      <div className={styles.reveal}>
        <div className={styles.title}>{album.name}</div>
        <div className={styles.artist}>{album.artistName}</div>
      </div>
    </Link>
  );
}
