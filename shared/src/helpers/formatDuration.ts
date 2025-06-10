import { SpotifyAlbum } from "../types";

/**
 * Formats a duration in milliseconds to a human-readable format
 * @param {number} durationMs The duration in milliseconds
 * @param {"short" | "long"} form The format of the duration
 * @returns {string} The formatted duration
 */
export function formatDuration(durationMs: number, form: "short" | "long"): string {
  if (form === "short") {
    const minutes = Math.floor(durationMs / 60000); // 1 minute = 60000 milliseconds
    const seconds = Math.floor((durationMs % 60000) / 1000); // Remaining seconds

    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${minutes}:${formattedSeconds}`;
  } else if (form === "long") {
    const minutes = Math.floor(durationMs / 60000); // 1 minute = 60000 milliseconds
    const seconds = Math.floor((durationMs % 60000) / 1000); // Remaining seconds

    const minuteText = minutes > 1 ? "minutes" : "minute";
    const secondText = seconds > 1 ? "seconds" : "second";

    if (minutes > 0 && seconds > 0) {
      return `${minutes} ${minuteText} ${seconds} ${secondText}`;
    } else if (minutes > 0) {
      return `${minutes} ${minuteText}`;
    } else {
      return `${seconds} ${secondText}`;
    }
  } else {
    throw new Error('Invalid form parameter. Use "long" or "short".');
  }
}

/**
 * Gets the total duration of an album
 * @param {SpotifyAlbum} album The album to calculate the total duration for
 * @returns {string} The total duration of the album
 */
export default function getTotalDuration(album: SpotifyAlbum): string {
  const totalDurationMs = album.tracks.items.reduce((acc, track) => acc + track.duration_ms, 0);
  return formatDuration(totalDurationMs, "long");
}
