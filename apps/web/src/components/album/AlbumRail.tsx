import { AlbumCard } from "@/components/album/AlbumCard";
import styles from "./AlbumRail.module.css";

import type { ReactNode } from "react";
import type { DisplayAlbum } from "@shared/types";

interface AlbumRailProps {
  title: string;
  /** A link at the other end of the heading, such as to the artist page */
  link?: ReactNode;
  albums: DisplayAlbum[];
}

/** A titled row of album cards that scrolls sideways. Shows nothing when there are no albums. */
export function AlbumRail({ title, link, albums }: AlbumRailProps) {
  if (albums.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        {link}
      </div>
      <ul className={styles.rail}>
        {albums.map(album => (
          <AlbumCard key={album.spotifyID} album={album} />
        ))}
      </ul>
    </section>
  );
}
