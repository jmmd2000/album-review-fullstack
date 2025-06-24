import { ratingTiers } from "@shared/helpers/ratingTiers";

export const getRatingStyles = (rating: number | string | undefined) => {
  if (rating === undefined) return ratingTiers.find((t) => t.label === "Non-song")!;

  // Handle string labels (like "Amazing", "Meh", etc.)
  if (typeof rating === "string") {
    const tier = ratingTiers.find((t) => t.label.toLowerCase() === rating.toLowerCase());
    if (!tier) throw new Error(`Unknown rating label: "${rating}"`);
    return tier;
  }

  // Handle numeric ratings
  const roundedRating = Math.ceil(rating);
  const tier = ratingTiers.find(({ range }) => roundedRating >= range[0] && roundedRating <= range[1]);
  if (!tier) throw new Error(`Rating must be between 0 and 100. (${roundedRating})`);
  return tier;
};
