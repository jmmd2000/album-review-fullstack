/**
 * Converts a duration from milliseconds to a string in the format "mm:ss".
 *
 * @param {number} duration - The duration in milliseconds.
 * @returns {string} The formatted duration string as "mm:ss".
 */

export const convertDuration = (duration: number): string => {
  const minutes = Math.floor(duration / 60000);
  const seconds = ((duration % 60000) / 1000).toFixed(0);
  return `${minutes}:${+seconds < 10 ? "0" : ""}${seconds}`;
};
