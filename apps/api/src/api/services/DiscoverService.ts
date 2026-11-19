import type { DiscoverRows, DisplayAlbum } from "@shared/types";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";
import { SuggestedAlbumModel } from "@/api/models/SuggestedAlbum";

const ROW_LIMIT = 10;

/** The fields an album card needs, for an album that isn't reviewed yet */
function toUnreviewedAlbum(album: { spotifyID: string; name: string; imageURLs: DisplayAlbum["imageURLs"]; artistName: string; artistSpotifyID: string; releaseYear: number }): DisplayAlbum {
  return {
    spotifyID: album.spotifyID,
    name: album.name,
    imageURLs: album.imageURLs,
    artistName: album.artistName,
    artistSpotifyID: album.artistSpotifyID,
    releaseYear: album.releaseYear,
    finalScore: null,
    affectsArtistScore: true,
  };
}

/** The rows that help pick the next album to review. */
export class DiscoverService {
  static async getRows(): Promise<DiscoverRows> {
    const [newAlbums, upNext] = await Promise.all([SuggestedAlbumModel.getShown("new", ROW_LIMIT), BookmarkedAlbumModel.getUpNext(ROW_LIMIT)]);
    return { newAlbums: newAlbums.map(toUnreviewedAlbum), upNext: upNext.map(toUnreviewedAlbum) };
  }
}
