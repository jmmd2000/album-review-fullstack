import { DisplayTrack } from "@shared/types";

/**
 * Calculates the album's score based on the rated tracks
 * @param {DisplayTrack[]} ratedTracks an array of rated tracks
 * @returns {number} the album's score rounded to the nearest whole number
 */
export const calculateAlbumScore = (ratedTracks: DisplayTrack[]) => {
  let albumScore = 0;
  // Remove any tracks with a rating of 0
  const tempTracks = ratedTracks.filter((track) => track.rating !== 0);

  // This function is used in both AlbumReviewForm and in the backend when an album is created
  if (tempTracks.length === 0) {
    return 0;
  }

  // Add up all the ratings
  // const tracks = data.ratedTracks;
  tempTracks.forEach((track) => {
    // By this point, it will have gone through AlbumReviewForm which has each tracks rating default to 0
    // So it's impossible to be undefined
    albumScore += Number(track.rating!);
  });
  const maxScore = tempTracks.length * 10;
  const percentageScore = (albumScore / maxScore) * 100;
  // Round to 0 decimal places
  const roundedScore = Math.round(percentageScore);

  return roundedScore;
};
