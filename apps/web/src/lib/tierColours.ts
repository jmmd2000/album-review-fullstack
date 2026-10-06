import type { TierLabel } from "@shared/helpers/ratingTiers";

/**
 * The CSS custom property holding a tier's colour. Tier labels map onto the
 * `--colour-tier-*` tokens in tokens.css by lowercasing, so a new tier needs both a
 * label and a matching token.
 */
export function tierColourVar(tier: TierLabel): string {
  return `var(--colour-tier-${tier.toLowerCase()})`;
}

/** The CSS custom property for a tier's fill, which is dark enough for white text on top. */
export function tierFillVar(tier: TierLabel): string {
  return `var(--colour-tier-${tier.toLowerCase()}-fill)`;
}
