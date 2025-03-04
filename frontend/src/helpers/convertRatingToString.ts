/**
 * A mapping of rating numbers to corresponding string representations.
 */
export const ratingString: { [key: number]: string } = {
  0: "Non-song",
  1: "Terrible",
  2: "Awful",
  3: "Bad",
  4: "OK",
  5: "Decent",
  6: "Good",
  7: "Great",
  8: "Brilliant",
  9: "Amazing",
  10: "Perfect",
};

/**
 * Converts a rating number to a string representation.
 *
 * @param {number} rating - The rating number, 0-10.
 * @returns {string} The string representation of the rating.
 */
export const convertRatingToString = (rating: number): string => {
  return ratingString[rating];
};
