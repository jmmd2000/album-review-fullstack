import type { TierLabel } from "@shared/helpers/ratingTiers";

/**
 * The CSS custom property holding a tier's colour. Tier labels map onto the
 * `--tier-*` tokens in tokens.css by lowercasing, so a new tier needs both a
 * label and a matching token.
 */
export function tierColourVar(tier: TierLabel): string {
  return `var(--tier-${tier.toLowerCase()})`;
}
