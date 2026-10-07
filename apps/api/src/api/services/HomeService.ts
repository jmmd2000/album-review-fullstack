import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import type { HomeOverview } from "@shared/types";

/** Enough covers to fill the home page's columns on a wide screen */
const SAMPLE_SIZE = 64;

export class HomeService {
  /**
   * Returns a random sample of reviewed albums for the cover columns,
   * the newest review for the Latest review button, and the album and artist totals for the search box.
   */
  static async getOverview(): Promise<HomeOverview> {
    const [sample, latestAlbumID, albumCount, artistCount] = await Promise.all([
      AlbumModel.getRandomAlbums(SAMPLE_SIZE),
      AlbumModel.getLatestAlbumID(),
      AlbumModel.getAlbumCount(),
      ArtistModel.getArtistCount(),
    ]);

    const albums = sample.map(album => ({
      spotifyID: album.spotifyID,
      name: album.name,
      artistName: album.artistName,
      releaseYear: album.releaseYear,
      finalScore: album.finalScore,
      imageURLs: album.imageURLs,
      colors: album.colors,
    }));

    return { albums, latestAlbumID, albumCount, artistCount };
  }
}
