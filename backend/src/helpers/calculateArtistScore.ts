import {
  MinimalAlbum,
  Reason,
  ReviewedAlbum,
  SpotifyImage,
} from "@shared/types";
import {
  calculatePeakScore,
  calculateLatestScore,
} from "./calculatePeakAndLatestScores";

/*** The bonus points awarded for a high-quality album. */
const GOOD_ALBUM_BONUS = 0.25;

/*** The penalty points deducted for a low-quality album.*/
const BAD_ALBUM_BONUS = 0.25;

/**
 * Calculates the artist's score based on their albums.
 * Only albums with `affectsArtistScore = true` contribute to the score.
 * @param {ReviewedAlbum[]} albums - array of albums to calculate the score for
 * @returns {Object} an object containing the `newAverageScore`, `newBonusPoints`, `totalScore`, `peakScore`, `latestScore`, and `bonusReasons`
 */
export const calculateArtistScore = (albums: ReviewedAlbum[]) => {
  // filter out non-contributing albums
  const contributing = albums.filter(album => album.affectsArtistScore);

  if (contributing.length === 0) {
    return {
      newAverageScore: 0,
      newBonusPoints: 0,
      totalScore: 0,
      peakScore: 0,
      latestScore: 0,
      bonusReasons: [],
    };
  }

  // sum final scores of contributing albums
  let sumScore = 0;
  for (const album of contributing) {
    sumScore += album.finalScore;
  }

  // base average
  const average = sumScore / contributing.length;

  // calculate bonuses/penalties
  const bonusReasons: Reason[] = [];
  let newBonusPoints = 0;

  if (contributing.length > 2) {
    for (const album of contributing) {
      const minimalAlbum: MinimalAlbum = {
        id: album.id,
        spotifyID: album.spotifyID,
        name: album.name,
        imageURLs: album.imageURLs,
      };

      if (album.finalScore < 45) {
        newBonusPoints -= BAD_ALBUM_BONUS;
        bonusReasons.push({
          album: minimalAlbum,
          reason: "Low quality album",
          value: -BAD_ALBUM_BONUS,
        });
      } else if (album.finalScore > 45 && album.finalScore < 55) {
        bonusReasons.push({
          album: minimalAlbum,
          reason: "Mid quality album",
          value: 0,
        });
      } else if (album.finalScore > 55) {
        newBonusPoints += GOOD_ALBUM_BONUS;
        bonusReasons.push({
          album: minimalAlbum,
          reason: "High quality album",
          value: GOOD_ALBUM_BONUS,
        });
      }
    }
  }

  // round average and cap total at 100
  const newAverageScore = average;
  const roundedAverage = Math.ceil(newAverageScore);
  let totalScore = roundedAverage + newBonusPoints;
  if (totalScore > 100) totalScore = 100;

  // Calculate peak and latest scores
  const peakScore = calculatePeakScore(contributing);
  const latestScore = calculateLatestScore(contributing);

  return {
    newAverageScore,
    newBonusPoints,
    totalScore,
    peakScore,
    latestScore,
    bonusReasons,
  };
};
