import type { DiscoverRows } from "@shared/types";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";

const UP_NEXT_LIMIT = 10;

/** The rows that help pick the next album to review. */
export class DiscoverService {
  static async getRows(): Promise<DiscoverRows> {
    const bookmarks = await BookmarkedAlbumModel.getUpNext(UP_NEXT_LIMIT);
    const upNext = bookmarks.map(album => ({
      spotifyID: album.spotifyID,
      name: album.name,
      imageURLs: album.imageURLs,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
      finalScore: null,
      affectsArtistScore: true,
    }));
    return { upNext };
  }
}
