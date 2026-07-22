import type { DisplayAlbum, SpotifyAlbum } from "@shared/types";

/**
 * Maps a raw Spotify album search payload into our DisplayAlbum shape. A search
 * result is an album we have not reviewed, so it carries no score and defaults to
 * affecting the artist score once reviewed.
 *
 * @param raw - The Spotify search response.
 * @returns One DisplayAlbum per search hit.
 */
export function mapSearchResults(raw: { albums: { items: SpotifyAlbum[] } }): DisplayAlbum[] {
  return raw.albums.items.map(album => ({
    spotifyID: album.id,
    name: album.name,
    artistName: album.artists[0].name,
    artistSpotifyID: album.artists[0].id,
    releaseYear: Number(album.release_date.split("-")[0]),
    imageURLs: album.images,
    finalScore: null,
    affectsArtistScore: true,
  }));
}

/**
 * Combines review scores and bookmark status onto search results.
 *
 * @param albums - The mapped search results.
 * @param reviewScores - Review scores for any of the albums that we have reviewed.
 * @param bookmarkedIDs - Spotify ids of the albums that are bookmarked.
 * @returns The albums with reviewScore and bookmarked filled in.
 */
export function enrichAlbumsWithStatus(albums: DisplayAlbum[], reviewScores: { spotifyID: string; reviewScore: number }[], bookmarkedIDs: string[]): DisplayAlbum[] {
  const scoreMap = new Map(reviewScores.map(({ spotifyID, reviewScore }) => [spotifyID, reviewScore]));
  const bookmarkedSet = new Set(bookmarkedIDs);

  return albums.map(album => ({
    ...album,
    reviewScore: scoreMap.get(album.spotifyID),
    bookmarked: bookmarkedSet.has(album.spotifyID),
  }));
}
