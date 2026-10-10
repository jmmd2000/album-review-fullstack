import { ratingTiers } from "@shared/helpers/ratingTiers";
import { tierFillVar } from "@/lib/tierColours";
import styles from "./SeparatorTile.module.css";

import type { Separator } from "@/lib/separators";

/**
 * A square tile in a sorted grid that starts a group, such as a tier, year or letter.
 * A tier tile is filled with the tier colour and shows its score range.
 */
export function SeparatorTile({ label, tier }: Separator) {
  const range = tier && tier !== "Unrated" ? ratingTiers.find(ratingTier => ratingTier.label === tier)?.range : undefined;

  return (
    <li className={styles.tile} data-tier={tier ? "" : undefined} data-on-tier={tier ? "" : undefined} style={tier ? { backgroundColor: tierFillVar(tier) } : undefined}>
      <h2 className={styles.label}>{label}</h2>
      {range && (
        <span className={styles.range}>
          {range[0]} to {range[1]}
        </span>
      )}
    </li>
  );
}
