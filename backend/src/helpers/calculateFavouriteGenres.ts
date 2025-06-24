import { ReviewedAlbum, Genre, AlbumGenre } from "@shared/types"; // Adjust as needed

export function calculateFavouriteGenres(albums: ReviewedAlbum[], genres: Genre[], albumGenres: AlbumGenre[]): { favouriteGenre: Genre | null; leastFavouriteGenre: Genre | null } {
  // Map albumID to score
  const albumScoreMap = new Map(albums.filter((a) => typeof a.finalScore === "number").map((a) => [a.spotifyID, a.finalScore!]));

  // Map genreID to array of album scores
  const genreScoresMap = new Map<number, number[]>();

  for (const { albumSpotifyID, genreID } of albumGenres) {
    const score = albumScoreMap.get(albumSpotifyID);
    if (score === undefined) continue;

    if (!genreScoresMap.has(genreID)) genreScoresMap.set(genreID, []);
    genreScoresMap.get(genreID)!.push(score);
  }

  // Calculate average per genre
  const genreAverages = genres
    .filter((g) => genreScoresMap.has(g.id))
    .map((g) => {
      const scores = genreScoresMap.get(g.id)!;
      const average = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { genre: g.name, average };
    });

  const sorted = genreAverages.sort((a, b) => b.average - a.average);
  const favouriteGenre = sorted[0] ? genres.find((g) => g.name === sorted[0].genre) ?? null : null;
  const leastFavouriteGenre = sorted[sorted.length - 1] ? genres.find((g) => g.name === sorted[sorted.length - 1].genre) ?? null : null;

  return {
    favouriteGenre,
    leastFavouriteGenre,
  };
}
