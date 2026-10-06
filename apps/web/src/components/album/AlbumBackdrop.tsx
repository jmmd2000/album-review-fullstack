import { useEffect, useState } from "react";
import styles from "./AlbumBackdrop.module.css";

import type { CSSProperties, RefObject } from "react";

interface AlbumBackdropProps {
  /** The backdrop fades out a little below the bottom of this element */
  until: RefObject<HTMLElement | null>;
}

/**
 * Blobs of the album's cover colours behind the top of the page, read from the
 * --cover-colour-1 to 5 properties its parent sets. It sits behind the nav, the cover
 */
export function AlbumBackdrop({ until }: AlbumBackdropProps) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const end = until.current;
    if (!end) return;

    const measure = () => setHeight(end.getBoundingClientRect().bottom + window.scrollY + 80);
    measure();

    // The panels change height as the window narrows and the layout stacks
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [until]);

  const style = height === null ? undefined : ({ "--backdrop-height": `${height}px` } as CSSProperties);

  return <div className={styles.backdrop} style={style} aria-hidden="true" />;
}
