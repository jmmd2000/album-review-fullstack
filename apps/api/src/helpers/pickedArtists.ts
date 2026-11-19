import { normaliseArtistName } from "@/helpers/artistName";

/** How many of the highest-rated artists the picks come from */
export const TOP_ARTIST_COUNT = 15;
/** Link lists hold up to this many artists, so a link's place runs from 1 to this */
const LINK_LIST_LENGTH = 100;

export interface RatedArtist {
  spotifyID: string;
  albumCount: number;
  averageScore: number;
}

export interface ArtistLink {
  artistSpotifyID: string;
  linkedName: string;
  position: number;
}

export interface PickedArtist {
  /** The linked artist's name, as Last.fm gives it */
  name: string;
  score: number;
}

/**
 * How highly rated an artist is: how far their average sits above the overall average, scaled down when they have few albums.
 * For example, with an overall average of 70, an artist with 3 albums averaging 82 weighs 3 × 12 ÷ 4 = 9,
 * and an artist with 1 album at 90 weighs 1 × 20 ÷ 2 = 10.
 */
export function artistWeight(artist: RatedArtist, overallAverage: number): number {
  return (artist.albumCount * (artist.averageScore - overallAverage)) / (artist.albumCount + 1);
}

/**
 * Ranks the artists that listeners link to the highest-rated artists, leaving out artists already reviewed.
 * Each top artist adds its weight to every artist it links to, reduced by the link's place in its list:
 * the closest link adds the full weight and the 100th adds a hundredth of it.
 * For example, an artist that two top artists of weight 10 both link to in 1st place scores 20,
 * and one linked by a single top artist in 1st place scores 10.
 * @returns The linked artists, highest score first.
 */
export function rankPickedArtists(artists: RatedArtist[], links: ArtistLink[], overallAverage: number, reviewedNames: string[]): PickedArtist[] {
  const topArtists = artists
    .map(artist => ({ spotifyID: artist.spotifyID, weight: artistWeight(artist, overallAverage) }))
    .filter(artist => artist.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, TOP_ARTIST_COUNT);
  const weights = new Map(topArtists.map(artist => [artist.spotifyID, artist.weight]));
  const reviewed = new Set(reviewedNames.map(normaliseArtistName));

  const picks = new Map<string, PickedArtist>();
  for (const link of links) {
    const weight = weights.get(link.artistSpotifyID);
    if (weight === undefined) continue;
    const key = normaliseArtistName(link.linkedName);
    if (reviewed.has(key)) continue;

    const share = (weight * (LINK_LIST_LENGTH + 1 - link.position)) / LINK_LIST_LENGTH;
    const existing = picks.get(key);
    picks.set(key, { name: existing?.name ?? link.linkedName, score: (existing?.score ?? 0) + share });
  }
  return [...picks.values()].sort((a, b) => b.score - a.score);
}
