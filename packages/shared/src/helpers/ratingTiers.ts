export type TierLabel = "Unrated" | "Terrible" | "Awful" | "Bad" | "OK" | "Meh" | "Good" | "Great" | "Brilliant" | "Amazing" | "Perfect";

interface RatingTier {
  label: TierLabel;
  range: [number, number];
}

export const ratingTiers: RatingTier[] = [
  { label: "Unrated", range: [0, 0] },
  { label: "Terrible", range: [1, 10] },
  { label: "Awful", range: [11, 20] },
  { label: "Bad", range: [21, 30] },
  { label: "OK", range: [31, 40] },
  { label: "Meh", range: [41, 50] },
  { label: "Good", range: [51, 60] },
  { label: "Great", range: [61, 70] },
  { label: "Brilliant", range: [71, 80] },
  { label: "Amazing", range: [81, 90] },
  { label: "Perfect", range: [91, 100] },
];

export const getRatingStyles = (rating: number | string | undefined): RatingTier => {
  if (rating === undefined) return ratingTiers.find(t => t.label === "Unrated")!;

  if (typeof rating === "string") {
    const tier = ratingTiers.find(t => t.label.toLowerCase() === rating.toLowerCase());
    if (!tier) throw new Error(`Unknown rating label: "${rating}"`);
    return tier;
  }

  const roundedRating = Math.ceil(rating);
  const tier = ratingTiers.find(({ range }) => roundedRating >= range[0] && roundedRating <= range[1]);
  if (!tier) throw new Error(`Rating must be between 0 and 100. (${roundedRating})`);
  return tier;
};

export const scoreTier = (score: number | null): TierLabel => (score === null ? "Unrated" : getRatingStyles(score).label);
