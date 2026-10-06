import { scoreTier } from "@shared/helpers/ratingTiers";

import type { TierLabel } from "@shared/helpers/ratingTiers";

/** The tile that starts a group in a sorted grid */
export interface Separator {
  label: string;
  /** Set for score groups, which fill the tile with the tier colour */
  tier?: TierLabel;
}

export interface CardGroup<Item> {
  /** The tile before the group, or null when the grid isn't grouped */
  separator: Separator | null;
  items: Item[];
}

/** A score's group: its tier. */
export function scoreSeparator(score: number | null): Separator {
  const tier = scoreTier(score);
  return { label: tier, tier };
}

/** A release year's group: the year itself. */
export function yearSeparator(year: number): Separator {
  return { label: String(year) };
}

/**
 * A name's group: its first letter, ignoring punctuation and accents to match how
 * the database sorts names. Names that start with a number, or have no letters, go under "#".
 */
export function letterSeparator(name: string): Separator {
  // NFD splits "É" into "E" plus an accent mark, so the match finds the plain letter
  const first = name.normalize("NFD").match(/[\p{L}\p{N}]/u)?.[0];
  if (!first || /\p{N}/u.test(first)) return { label: "#" };
  return { label: first.toUpperCase() };
}

/**
 * Splits a sorted list into runs of neighbours that share a separator, keeping their order.
 *
 * @param items The list, already sorted.
 * @param separatorOf The group an item belongs to, or null for no groups.
 * @returns One group per run. A null separator gives a single group with no tile.
 */
export function groupBySeparator<Item>(items: Item[], separatorOf: (item: Item) => Separator | null): CardGroup<Item>[] {
  const groups: CardGroup<Item>[] = [];

  for (const item of items) {
    const separator = separatorOf(item);
    const current = groups.at(-1);

    if (current && current.separator?.label === separator?.label) {
      current.items.push(item);
    } else {
      groups.push({ separator, items: [item] });
    }
  }

  return groups;
}
