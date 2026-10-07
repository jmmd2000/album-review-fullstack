import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import type { HomeOverview, HomeSearchAlbum, HomeSearchArtist, HomeSearchResult } from "@shared/types";

/** Enough covers to fill the home page's columns on a wide screen */
const SAMPLE_SIZE = 64;
/** The most rows the search dropdown shows */
const SEARCH_LIMIT = 5;
/** Artists come first in the dropdown, so this many at most leaves room for albums */
const SEARCH_ARTIST_SHARE = 2;

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

  /**
   * Finds up to five reviewed artists and albums for the home search, artists first.
   * Artists take two rows at most, unless there aren't enough albums to fill the rest.
   */
  static async search(query: string): Promise<HomeSearchResult[]> {
    const [artistMatches, albumMatches] = await Promise.all([ArtistModel.searchArtists(query, SEARCH_LIMIT), AlbumModel.searchAlbums(query, SEARCH_LIMIT)]);

    const artistRows = Math.min(artistMatches.length, Math.max(SEARCH_ARTIST_SHARE, SEARCH_LIMIT - albumMatches.length));
    const albumRows = SEARCH_LIMIT - artistRows;

    const artists: HomeSearchArtist[] = artistMatches.slice(0, artistRows).map(artist => ({
      type: "artist",
      spotifyID: artist.spotifyID,
      name: artist.name,
      albumCount: artist.reviewCount,
      score: artist.unrated ? null : artist.totalScore,
      imageURLs: artist.imageURLs,
    }));
    const albums: HomeSearchAlbum[] = albumMatches.slice(0, albumRows).map(album => ({
      type: "album",
      spotifyID: album.spotifyID,
      name: album.name,
      artistName: album.artistName,
      releaseYear: album.releaseYear,
      score: album.finalScore,
      imageURLs: album.imageURLs,
    }));

    return [...artists, ...albums];
  }
}
