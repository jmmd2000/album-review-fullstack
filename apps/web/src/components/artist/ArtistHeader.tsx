import styles from "./ArtistHeader.module.css";

import type { SpotifyImage } from "@shared/types";

interface ArtistHeaderProps {
  name: string;
  /** The wide image from the artist's Spotify page */
  headerImage: string | null;
  /** The artist's photos, largest first */
  images: SpotifyImage[];
}

/** The full-width banner, with the round photo and the name over its faded bottom edge. */
export function ArtistHeader({ name, headerImage, images }: ArtistHeaderProps) {
  const photo = images[0];

  return (
    <header>
      {headerImage && <img className={styles.banner} src={headerImage} alt="" />}
      <div className={headerImage ? `${styles.head} ${styles.overBanner}` : styles.head}>
        {photo && <img className={styles.photo} src={photo.url} alt="" width={photo.width} height={photo.height} />}
        <h1 className={styles.name}>{name}</h1>
      </div>
    </header>
  );
}
