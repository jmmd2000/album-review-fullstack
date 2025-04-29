import { DisplayTrack } from "@shared/types";

/**
 * Enhanced album scoring system that includes both bonuses for high quality
 * and penalties for low quality tracks.
 * @param {DisplayTrack[]} ratedTracks an array of rated tracks
 * @returns {Object} detailed breakdown of the album score
 */
export const calculateAlbumScore = (ratedTracks: DisplayTrack[]) => {
  // Remove any tracks with a rating of 0
  const tempTracks = ratedTracks.filter((track) => track.rating !== 0);

  // Return 0 if no rated tracks
  if (tempTracks.length === 0) {
    return {
      baseScore: 0,
      bonuses: {
        qualityBonus: 0,
        perfectBonus: 0,
        consistencyBonus: 0,
        noWeakBonus: 0,
        terriblePenalty: 0,
        poorQualityPenalty: 0,
        noStrongPenalty: 0,
        totalBonus: 0,
      },
      finalScore: 0,
    };
  }

  // Calculate basic score (old method)
  let albumScore = 0;
  tempTracks.forEach((track) => {
    albumScore += Number(track.rating!);
  });
  const maxScore = tempTracks.length * 10;
  const percentageScore = (albumScore / maxScore) * 100;
  const baseScore = Math.round(percentageScore);

  // Get track ratings as numbers for analysis
  const ratings = tempTracks.map((track) => Number(track.rating!));

  // ----- QUALITY BONUSES -----

  // 1. Perfect track bonus (0-1.5 points)
  const perfectTracks = ratings.filter((r) => r >= 10).length;
  const perfectBonus = Math.min(1.5, perfectTracks * 0.5);

  // 2. Quality bonus (0-1.5 points) - count 8s and 9s
  const qualityTracks = ratings.filter((r) => r >= 8 && r < 10).length;
  const qualityBonus = Math.min(1.5, (qualityTracks / tempTracks.length) * 3);

  // 3. Consistency bonus (0-1 points)
  const trackAverage = albumScore / tempTracks.length;
  const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - trackAverage, 2), 0) / tempTracks.length;
  const stdDev = Math.sqrt(variance);

  // Determine the rating range in the album
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const ratingRange = maxRating - minRating;

  // Improved consistency bonus that considers the rating range
  let consistencyBonus = 0;

  // Adjust threshold based on the range of ratings
  if (ratingRange <= 2) {
    // Only apply to albums with ratings within 2 points
    const adjustedThreshold = 0.9 + ratingRange * 0.2;

    if (stdDev < adjustedThreshold) {
      // Scale the bonus relative to the adjusted threshold
      consistencyBonus = Math.min(1, Math.max(0, 1 - stdDev / adjustedThreshold));
    }
  }

  // 4. No weak tracks bonus (0-1 points)
  const weakTracks = ratings.filter((r) => r < 5).length;
  const noWeakBonus = weakTracks === 0 ? 1 : 0;

  // ----- QUALITY PENALTIES -----

  // 1. Terrible tracks penalty (0 to -3 points)
  // Each "terrible" track (rating 1) penalizes the album
  const terribleTracks = ratings.filter((r) => r <= 1).length;
  const terriblePenalty = Math.max(-3, terribleTracks * -1); // Cap at -3 points

  // 2. Poor quality penalty (0 to -2 points)
  // Based on percentage of tracks rated 2-3
  const poorTracks = ratings.filter((r) => r >= 2 && r <= 3).length;
  const poorQualityPenalty = Math.max(-2, (poorTracks / tempTracks.length) * -4);

  // 3. No strong tracks penalty (0 to -2 points)
  // If there are no tracks rated above 5
  const strongTracks = ratings.filter((r) => r > 5).length;
  const noStrongPenalty = strongTracks === 0 ? -2 : 0;

  // 4. Poor consistency penalty (already factored in - no consistency bonus for highly variable albums)

  // Round all bonuses and penalties to 1 decimal place
  const roundedQualityBonus = Math.round(qualityBonus * 10) / 10;
  const roundedPerfectBonus = Math.round(perfectBonus * 10) / 10;
  const roundedConsistencyBonus = Math.round(consistencyBonus * 10) / 10;
  const roundedTerriblePenalty = Math.round(terriblePenalty * 10) / 10;
  const roundedPoorQualityPenalty = Math.round(poorQualityPenalty * 10) / 10;

  // Calculate total adjustments, capped at +5 and -5 points
  const totalPositive = roundedQualityBonus + roundedPerfectBonus + roundedConsistencyBonus + noWeakBonus;
  const totalNegative = roundedTerriblePenalty + roundedPoorQualityPenalty + noStrongPenalty;

  // Combine positive and negative adjustments, capped at +5 and -5
  const totalBonus = Math.min(5, Math.max(-5, totalPositive + totalNegative));

  // Final score with combined bonuses and penalties (capped at 100, minimum 1)
  const finalScore = Math.min(100, Math.max(1, Math.ceil(baseScore + totalBonus)));

  // Return detailed breakdown
  return {
    baseScore,
    bonuses: {
      // Positive adjustments
      qualityBonus: roundedQualityBonus,
      perfectBonus: roundedPerfectBonus,
      consistencyBonus: roundedConsistencyBonus,
      noWeakBonus,

      // Negative adjustments
      terriblePenalty: roundedTerriblePenalty,
      poorQualityPenalty: roundedPoorQualityPenalty,
      noStrongPenalty,

      // Total adjustment (can be positive or negative)
      totalBonus: Math.round(totalBonus * 10) / 10,
    },
    finalScore,
  };
};
