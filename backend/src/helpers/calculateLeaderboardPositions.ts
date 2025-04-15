export interface ArtistLeaderboardData {
  /** The artist's database ID */
  id: number;
  /** The artist's name */
  name: string;
  /** The artist's score */
  score: number;
}

/**
 * Updates the leaderboard positions by sorting an array of artists based on their scores
 * in descending order. If two artists have the same score, they are sorted alphabetically
 * by their names.
 *
 * @param {ArtistLeaderboardData[]} artists - An array of ArtistLeaderboardData objects
 * @returns A new array of artist objects sorted by score in descending order, and by name
 * alphabetically if scores are equal.
 */
export function calculateLeaderboardPositions(artists: ArtistLeaderboardData[]): ArtistLeaderboardData[] {
  return artists.sort((a, b) => {
    if (b.score !== a.score) {
      // sort by score in descending order
      return b.score - a.score;
    }
    // sort by alphabetical if the scores are the same
    return a.name.localeCompare(b.name);
  });
}
