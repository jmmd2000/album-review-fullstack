import type { SearchAlbum } from "@shared/types";
import type { SpotifyAlbumSearchResponse } from "@/api/schemas/spotifySchema";

/**
 * Maps a raw Spotify album search payload into our SearchAlbum shape. The score
 * starts as null, and enrichAlbumsWithStatus fills it in for reviewed albums.
 *
 * @param raw - The Spotify search response.
 * @returns One SearchAlbum per search hit.
 */
export function mapSearchResults(raw: SpotifyAlbumSearchResponse): SearchAlbum[] {
  return raw.albums.items.map(album => ({
    spotifyID: album.id,
    name: album.name,
    artistName: album.artists[0].name,
    artistSpotifyID: album.artists[0].id,
    releaseYear: Number(album.release_date.split("-")[0]),
    imageURLs: album.images,
    finalScore: null,
    affectsArtistScore: true,
    releaseType: album.album_type,
  }));
}

/**
 * Adds the final score and the bookmark status to search results.
 *
 * @param albums - The mapped search results.
 * @param finalScores - The final scores of the albums that are reviewed.
 * @param bookmarkedIDs - Spotify ids of the albums that are bookmarked.
 * @returns The albums with finalScore and bookmarked filled in. An album with no review keeps a null score.
 */
export function enrichAlbumsWithStatus(albums: SearchAlbum[], finalScores: { spotifyID: string; finalScore: number | null }[], bookmarkedIDs: string[]): SearchAlbum[] {
  const scoreMap = new Map(finalScores.map(({ spotifyID, finalScore }) => [spotifyID, finalScore]));
  const bookmarkedSet = new Set(bookmarkedIDs);

  return albums.map(album => ({
    ...album,
    finalScore: scoreMap.get(album.spotifyID) ?? null,
    bookmarked: bookmarkedSet.has(album.spotifyID),
  }));
}
