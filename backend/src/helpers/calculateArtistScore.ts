//? This function takes an array of albums and calculates the artist's score.
//? If this is called while adding a new album, the array of albums doesn't include the new album yet, so it needs to be accounted for.

import { MinimalAlbum, Reason, ReviewedAlbum, SpotifyImage } from "@shared/types";

/**
The bonus points awarded for a high-quality album.*/
const GOOD_ALBUM_BONUS = 0.25;

/**The penalty points deducted for a low-quality album.*/
const BAD_ALBUM_BONUS = 0.25;

/**
 * Calculates the artist's score based on their albums
 * @param {ReviewedAlbum[]} albums an array of albums to calculate the score for
 * @param {number | null} existingScore In the case that this is being called while adding a new album, this is the artist's current score
 * @returns {Object} an object containing the `newAverageScore`, `newBonusPoints`, `totalScore`, and `bonusReasons`
 */
export const calculateArtistScore = (albums: ReviewedAlbum[], existingScore: number | null) => {
  let newAverageScore = existingScore ?? 0;
  let newBonusPoints = 0;

  for (const album of albums) {
    newAverageScore += album.reviewScore;
  }

  const bonusReasons: Reason[] = [];

  if (albums.length > 2) {
    //* Calculate bonus points only for every album after the first 2
    //* Also generate the bonus reasons
    // const albumsToConsider = albums.slice(2);
    for (const album of albums) {
      const image_urls = album.imageURLs;
      const minimalAlbum: MinimalAlbum = {
        id: album.id,
        spotifyID: album.spotifyID,
        name: album.name,
        imageURLs: image_urls,
      };
      if (album.reviewScore < 45) {
        newBonusPoints -= BAD_ALBUM_BONUS;
        bonusReasons.push({
          album: minimalAlbum,
          reason: "Low quality album",
          value: -BAD_ALBUM_BONUS,
        });
      } else if (album.reviewScore > 45 && album.reviewScore < 55) {
        bonusReasons.push({
          album: minimalAlbum,
          reason: "Mid quality album",
          value: 0,
        });
      } else if (album.reviewScore > 55) {
        newBonusPoints += GOOD_ALBUM_BONUS;
        bonusReasons.push({
          album: minimalAlbum,
          reason: "High quality album",
          value: GOOD_ALBUM_BONUS,
        });
      }
    }
  }

  //* If this is being called while adding a new album, the array of albums doesn't include the new album yet
  if (existingScore) {
    newAverageScore = newAverageScore / (albums.length + 1);
  } else {
    newAverageScore = newAverageScore / albums.length;
  }

  //* Calculate the total score
  let totalScore = newAverageScore + newBonusPoints;
  if (totalScore > 100) {
    totalScore = 100;
  }

  return { newAverageScore, newBonusPoints, totalScore, bonusReasons };
};
