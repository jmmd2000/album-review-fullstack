import { normaliseArtistName } from "@/helpers/artistName";

/** An album by an artist that listeners link to the current album's artists */
export interface LinkedAlbumCandidate {
  albumSpotifyID: string;
  /** The closest place in a link list, from 1 */
  position: number;
  finalScore: number;
}

/**
 * Finds which reviewed artists the links point to, by name, and the closest place each one has in the link lists.
 * Names are compared without case, accents or the difference between "&" and "and".
 * @returns The closest link place for each linked reviewed artist, keyed by Spotify ID.
 */
export function closestLinkByArtist(links: { linkedName: string; position: number }[], reviewedArtists: { spotifyID: string; name: string }[]): Map<string, number> {
  const spotifyIDsByName = new Map<string, string[]>();
  for (const artist of reviewedArtists) {
    const key = normaliseArtistName(artist.name);
    spotifyIDsByName.set(key, [...(spotifyIDsByName.get(key) ?? []), artist.spotifyID]);
  }

  const closest = new Map<string, number>();
  for (const link of links) {
    for (const spotifyID of spotifyIDsByName.get(normaliseArtistName(link.linkedName)) ?? []) {
      closest.set(spotifyID, Math.min(closest.get(spotifyID) ?? Infinity, link.position));
    }
  }
  return closest;
}

/** An album that shares at least one genre with the current album */
export interface GenreAlbumCandidate {
  albumSpotifyID: string;
  /** The genres it shares with the current album */
  sharedGenreIDs: number[];
  finalScore: number;
}

export interface SimilarAlbumInputs {
  linked: LinkedAlbumCandidate[];
  byGenre: GenreAlbumCandidate[];
  /** How many albums have each shared genre */
  genreAlbumCounts: Map<number, number>;
  totalAlbums: number;
  limit: number;
}

/**
 * How much a shared genre counts. A genre on fewer albums counts for more, and a genre on every album counts for nothing.
 * For example, with 300 albums, a genre on 3 albums weighs log(100) ≈ 4.6 and a genre on 150 albums weighs log(2) ≈ 0.7.
 */
export function genreWeight(totalAlbums: number, albumsWithGenre: number): number {
  if (albumsWithGenre <= 0) return 0;
  return Math.log(totalAlbums / albumsWithGenre);
}

/**
 * Picks the similar albums, most similar first.
 * Albums by linked artists come first, closest link first, then best score.
 * Shared genres fill the rest, the highest total genre weight first, then best score.
 * @returns Up to `limit` album Spotify IDs.
 */
export function orderSimilarAlbums({ linked, byGenre, genreAlbumCounts, totalAlbums, limit }: SimilarAlbumInputs): string[] {
  const linkedOrder = [...linked].sort((a, b) => a.position - b.position || b.finalScore - a.finalScore);
  const picked = linkedOrder.slice(0, limit).map(candidate => candidate.albumSpotifyID);
  if (picked.length === limit) return picked;

  const genreScore = (candidate: GenreAlbumCandidate) => candidate.sharedGenreIDs.reduce((total, genreID) => total + genreWeight(totalAlbums, genreAlbumCounts.get(genreID) ?? 0), 0);
  const genreOrder = byGenre
    .filter(candidate => !picked.includes(candidate.albumSpotifyID))
    .map(candidate => ({ ...candidate, score: genreScore(candidate) }))
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || b.finalScore - a.finalScore);

  return [...picked, ...genreOrder.slice(0, limit - picked.length).map(candidate => candidate.albumSpotifyID)];
}
