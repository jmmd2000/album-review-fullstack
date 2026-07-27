import { formatDate } from "@shared/helpers/formatDate";
import styles from "./AlbumInfo.module.css";

interface AlbumInfoProps {
  releaseDate: string;
  runtime: string;
  trackCount: number;
  reviewed: string;
  affectsArtistScore: boolean;
}

export function AlbumInfo({ releaseDate, runtime, trackCount, reviewed, affectsArtistScore }: AlbumInfoProps) {
  const items = [`Released ${releaseDate}`, runtime, `${trackCount} tracks`, `Reviewed ${formatDate(reviewed.split("T")[0]!)}`];

  if (!affectsArtistScore) items.push("Excluded from artist score");

  return (
    <p className={styles.meta}>
      {items.map((item, index) => (
        <span key={item} className={styles.item}>
          {item}
          {index < items.length - 1 && <span className={styles.divider} aria-hidden="true" />}
        </span>
      ))}
    </p>
  );
}
