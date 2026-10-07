import { Link } from "@tanstack/react-router";
import { ScoreChip } from "@/components/ui/ScoreChip";
import styles from "./Card.module.css";

import type { CSSProperties, ReactNode } from "react";
import type { LinkProps } from "@tanstack/react-router";
import type { SpotifyImage } from "@shared/types";

interface CardProps {
  link: LinkProps;
  title: string;
  subtitle: string;
  score: number | null;
  /** The cover sizes Spotify gives, largest first */
  images: SpotifyImage[];
  /** The leaderboard place, shown in the cover's corner */
  rank?: number;
  /** A "#rrggbb" cover colour for the hover shadow. Without one the shadow is black. */
  shade?: string;
  /** A button in the cover's top right corner. It sits outside the link, so clicking it doesn't open the page. */
  action?: ReactNode;
}

/**
 * The one card for albums and artists: a square cover, then the title and
 * subtitle with the score chip beside them. It's a list item, so it goes in a CardGrid.
 */
export function Card({ link, title, subtitle, score, images, rank, shade, action }: CardProps) {
  const image = images[1] ?? images[0];
  const largeImage = images[0];
  // 4d is 30% opacity. Chrome can only animate a plain colour in a filter, so the CSS can't mix it in.
  const style = shade ? ({ "--shade": `${shade}4d` } as CSSProperties) : undefined;

  return (
    <li className={styles.item}>
      <Link {...link} className={styles.card} style={style}>
        <div className={styles.art}>
          {image ? (
            <img src={image.url} srcSet={largeImage ? `${largeImage.url} 2x` : undefined} alt="" width={image.width} height={image.height} loading="lazy" />
          ) : (
            <span className={styles.missing} aria-hidden="true">
              {title.trim().charAt(0)}
            </span>
          )}
          {rank !== undefined && <span className={styles.rank}>#{rank}</span>}
        </div>
        <div className={styles.caption}>
          <span>
            <span className={styles.title} title={title}>
              {title}
            </span>
            <span className={styles.subtitle} title={subtitle}>
              {subtitle}
            </span>
          </span>
          <ScoreChip score={score} />
        </div>
      </Link>
      {action && <div className={styles.action}>{action}</div>}
    </li>
  );
}
