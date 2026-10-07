export interface ArtistLeaderboardData {
  /** The artist's database ID */
  id: number;
  /** The artist's name */
  name: string;
  /** The artist's score */
  score: number;
}

export interface RankedArtist extends ArtistLeaderboardData {
  /** The artist's position in the leaderboard. Artists with the same score share a position. */
  position: number;
}

/**
 * Updates the leaderboard positions by sorting an array of artists based on their scores
 * in descending order. If two artists have the same score, they are sorted alphabetically
 * by their names.
 *
 * @param {ArtistLeaderboardData[]} artists - An array of ArtistLeaderboardData objects
 * @returns A new array of new artist objects sorted by score in descending order, and by name
 * alphabetically if scores are equal, with position numbers assigned.
 */
export function calculateLeaderboardPositions(artists: ArtistLeaderboardData[]): RankedArtist[] {
  const sortedArtists = [...artists].sort((a, b) => {
    if (b.score !== a.score) {
      // sort by score in descending order
      return b.score - a.score;
    }
    // sort by alphabetical if the scores are the same
    return a.name.localeCompare(b.name);
  });

  // Assign positions, handling ties correctly
  let currentPosition = 1;
  return sortedArtists.map((artist, index) => {
    if (index > 0 && artist.score !== sortedArtists[index - 1].score) {
      currentPosition = index + 1;
    }
    return { ...artist, position: currentPosition };
  });
}
