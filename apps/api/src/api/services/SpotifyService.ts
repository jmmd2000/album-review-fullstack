import type { AlbumArtist, DisplayAlbum, Genre, SearchAlbumsOptions, SpotifyAlbum } from "@shared/types";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { AlbumModel } from "@/api/models/Album";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";
import { GenreModel } from "../models/Genre";
import { getImageColors } from "@/helpers/getImageColors";
import { mapSearchResults, enrichAlbumsWithStatus } from "@/helpers/spotifySearch";
import { AppError } from "../AppError";

export class SpotifyService {
  static async getAccessToken() {
    return SpotifyTokenCache.getAccessToken();
  }

  static async searchAlbums(query: SearchAlbumsOptions): Promise<DisplayAlbum[]> {
    const rawQuery = query.query?.trim();
    if (!rawQuery || rawQuery === "undefined") return [];

    const token = await SpotifyTokenCache.getAccessToken();
    const albums = mapSearchResults(await SpotifyClient.searchAlbums(rawQuery, token));
    if (albums.length === 0) return albums;

    // Read our own data here and hand it to the pure enrichment step, so the
    // Spotify layer never reaches into the database itself.
    const ids = albums.map(a => a.spotifyID);
    const reviewScores = await AlbumModel.getReviewScoresByIds(ids);
    const bookmarkedIDs = await BookmarkedAlbumModel.getBookmarkedByIds(ids);
    return enrichAlbumsWithStatus(albums, reviewScores, bookmarkedIDs);
  }

  static async getAlbum(
    id: string,
    includeGenres: boolean = true
  ): Promise<{
    album: SpotifyAlbum;
    artists: AlbumArtist[];
    genres?: Genre[];
  }> {
    const existing = await AlbumModel.findBySpotifyID(id);
    if (existing) throw new AppError("Album already exists in the database.", 400);

    const token = await SpotifyTokenCache.getAccessToken();
    const album = await SpotifyClient.getAlbum(id, token);
    album.colors = await getImageColors(album.images[0].url);

    const artistDetails = await SpotifyClient.getArtists(
      album.artists.map(a => a.id),
      token
    );
    const artistMap = new Map(artistDetails.map(a => [a.id, a]));
    const albumArtists: AlbumArtist[] = album.artists.map(a => {
      const details = artistMap.get(a.id);
      return {
        spotifyID: a.id,
        name: a.name,
        imageURLs: details?.images ?? [],
      };
    });
    album.albumArtists = albumArtists;

    if (!includeGenres) {
      return { album, artists: albumArtists };
    }

    const genres = await GenreModel.getAllGenres();
    return { album, artists: albumArtists, genres };
  }
}
