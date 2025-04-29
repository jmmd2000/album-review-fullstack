import { DisplayTrack } from "@shared/types";

/**
 * Calculates the album's score based on the rated tracks
 * @param {DisplayTrack[]} ratedTracks an array of rated tracks
 * @returns {number} the album's score rounded to the nearest whole number
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

  // Quality bonus based on percentage of quality tracks
  const qualityBonus = Math.min(1.5, (qualityTracks / tempTracks.length) * 3);

  // 3. Consistency bonus (0-1 points) - calculate track average and standard deviation
  // Technically there could be a situation where dropping the score of a track actually
  // increases the consistency bonus, and therefore possibly increasing the score.
  // Rounding up basically negates this in the finalScore, but the consistency bonus
  // would still be higher
  const trackAverage = albumScore / tempTracks.length;
  const variance = ratings.reduce((sum, rating) => sum + Math.pow(rating - trackAverage, 2), 0) / tempTracks.length;
  const stdDev = Math.sqrt(variance);

  // Determine the rating range in the album
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  // If min is 7 and max is 10, range is 3
  const ratingRange = maxRating - minRating;

  // Improved consistency bonus that considers the rating range
  let consistencyBonus = 0;

  // Adjust threshold based on the range of ratings
  if (ratingRange <= 2) {
    // Only apply to albums with ratings within 2 points
    // Adjust the threshold based on range, decrease numbers below to be more strict
    const adjustedThreshold = 0.9 + ratingRange * 0.2;

    if (stdDev < adjustedThreshold) {
      // Scale the bonus relative to the adjusted threshold
      consistencyBonus = Math.min(1, Math.max(0, 1 - stdDev / adjustedThreshold));
    }
  }

  // 4. No weak tracks bonus (0-1 points)
  const weakTracks = ratings.filter((r) => r < 5).length;
  const noWeakBonus = weakTracks === 0 ? 1 : 0;

  // Round each bonus to 1 decimal place
  const roundedQualityBonus = Math.round(qualityBonus * 10) / 10;
  const roundedPerfectBonus = Math.round(perfectBonus * 10) / 10;
  const roundedConsistencyBonus = Math.round(consistencyBonus * 10) / 10;

  // Apply combined bonus (cap at 5 points total - the theoretical maximum)
  const totalBonus = Math.min(5, roundedQualityBonus + roundedPerfectBonus + roundedConsistencyBonus + noWeakBonus);

  // Final score with bonus (capped at 100)
  const finalScore = Math.min(100, Math.ceil(baseScore + totalBonus));

  // Return detailed breakdown
  return {
    baseScore,
    bonuses: {
      qualityBonus: roundedQualityBonus,
      perfectBonus: roundedPerfectBonus,
      consistencyBonus: roundedConsistencyBonus,
      noWeakBonus,
      totalBonus: Math.round(totalBonus * 10) / 10,
    },
    finalScore,
  };
};
