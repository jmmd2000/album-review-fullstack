import { ReviewedAlbum } from "@shared/types";

/*** The bonus points awarded for a high-quality album. */
const GOOD_ALBUM_BONUS = 0.25;

/*** The penalty points deducted for a low-quality album.*/
const BAD_ALBUM_BONUS = 0.25;

/**
 * Calculates the peak score for an artist based on their top 3 highest rated albums.
 * @param {ReviewedAlbum[]} albums - array of albums to calculate the peak score for
 * @returns {number} the average score of the top 3 highest rated albums with bonuses
 */
export const calculatePeakScore = (albums: ReviewedAlbum[]): number => {
  // Filter out non-contributing albums
  const contributing = albums.filter(album => album.affectsArtistScore);

  if (contributing.length === 0) {
    return 0;
  }

  // Sort by final score in descending order and take top 3
  const topAlbums = contributing
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 3);

  // Calculate average of top 3 albums
  const sum = topAlbums.reduce((acc, album) => acc + album.finalScore, 0);
  const average = sum / topAlbums.length;

  // Apply same bonus logic as overall score
  const roundedAverage = Math.ceil(average);
  let bonusPoints = 0;

  if (topAlbums.length > 2) {
    for (const album of topAlbums) {
      if (album.finalScore < 45) {
        bonusPoints -= BAD_ALBUM_BONUS;
      } else if (album.finalScore > 55) {
        bonusPoints += GOOD_ALBUM_BONUS;
      }
    }
  }

  let totalScore = roundedAverage + bonusPoints;
  if (totalScore > 100) totalScore = 100;

  return totalScore;
};

/**
 * Calculates the latest score for an artist based on their latest 3 albums.
 * @param {ReviewedAlbum[]} albums - array of albums to calculate the latest score for
 * @returns {number} the average score of the latest 3 albums with bonuses
 */
export const calculateLatestScore = (albums: ReviewedAlbum[]): number => {
  // Filter out non-contributing albums
  const contributing = albums.filter(album => album.affectsArtistScore);

  if (contributing.length === 0) {
    return 0;
  }

  // Sort by release year in descending order (latest first) and take latest 3
  const latestAlbums = contributing
    .sort((a, b) => b.releaseYear - a.releaseYear)
    .slice(0, 3);

  // Calculate average of latest 3 albums
  const sum = latestAlbums.reduce((acc, album) => acc + album.finalScore, 0);
  const average = sum / latestAlbums.length;

  // Apply same bonus logic as overall score
  const roundedAverage = Math.ceil(average);
  let bonusPoints = 0;

  if (latestAlbums.length > 2) {
    for (const album of latestAlbums) {
      if (album.finalScore < 45) {
        bonusPoints -= BAD_ALBUM_BONUS;
      } else if (album.finalScore > 55) {
        bonusPoints += GOOD_ALBUM_BONUS;
      }
    }
  }

  let totalScore = roundedAverage + bonusPoints;
  if (totalScore > 100) totalScore = 100;

  return totalScore;
};
