import type { DisplayTrack } from "../types";

/**
 * Works out an album's score from its track ratings and the bonus set on its review.
 * Tracks rated 0 don't count, and an album with no rated tracks scores 0.
 * @returns The score from the tracks alone, and the final score: that plus the bonus, rounded up and kept between 1 and 100.
 */
export const calculateAlbumScore = (tracks: Pick<DisplayTrack, "rating">[], bonus: number) => {
  const ratings = tracks.map(track => track.rating ?? 0).filter(rating => rating > 0);
  if (ratings.length === 0) return { baseScore: 0, finalScore: 0 };

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  const baseScore = Math.round((total / ratings.length) * 10);
  const finalScore = Math.min(100, Math.max(1, Math.ceil(baseScore + bonus)));

  return { baseScore, finalScore };
};
