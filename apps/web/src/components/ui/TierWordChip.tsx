import { tierFillVar } from "@/lib/tierColours";
import styles from "./TierWordChip.module.css";

import type { ReactNode } from "react";
import type { TierLabel } from "@shared/helpers/ratingTiers";

interface TierWordChipProps {
  tier: TierLabel;
  /** The tier word, or something that shows it, such as rolling text */
  children: ReactNode;
}

/** A track's tier word on a chip of its tier colour. Every chip is the same width, so the chips line up in a list. */
export function TierWordChip({ tier, children }: TierWordChipProps) {
  return (
    <span className={styles.chip} style={{ backgroundColor: tierFillVar(tier) }} data-on-tier="">
      {children}
    </span>
  );
}
