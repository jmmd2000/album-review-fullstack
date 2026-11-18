import type { AlbumArtist, ExtractedColor, GenreCount, SearchAlbum, SearchAlbumsOptions } from "@shared/types";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { AlbumModel } from "@/api/models/Album";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";
import { GenreModel } from "../models/Genre";
import { ReviewDraftService, type AlbumDraft } from "@/api/services/ReviewDraftService";
import { getImageColors } from "@/helpers/getImageColors";
import { mapSearchResults, enrichAlbumsWithStatus } from "@/helpers/spotifySearch";
import { AppError } from "../AppError";
import type { SpotifyAlbumResponse } from "@/api/schemas/spotifySchema";

/** A Spotify album ready to review, with its cover colours and its artists' photos */
export interface SpotifyAlbumToReview extends SpotifyAlbumResponse {
  colors: ExtractedColor[];
  albumArtists: AlbumArtist[];
}

export class SpotifyService {
  static async getAccessToken() {
    return SpotifyTokenCache.getAccessToken();
  }

  static async searchAlbums(query: SearchAlbumsOptions): Promise<SearchAlbum[]> {
    const rawQuery = query.query?.trim();
    if (!rawQuery || rawQuery === "undefined") return [];

    const token = await SpotifyTokenCache.getAccessToken();
    const albums = mapSearchResults(await SpotifyClient.searchAlbums(rawQuery, token));
    if (albums.length === 0) return albums;

    const ids = albums.map(a => a.spotifyID);
    const finalScores = await AlbumModel.getFinalScoresByIds(ids);
    const bookmarkedIDs = await BookmarkedAlbumModel.getBookmarkedByIds(ids);
    return enrichAlbumsWithStatus(albums, finalScores, bookmarkedIDs);
  }

  static async getAlbum(
    id: string,
    includeGenres: boolean = true
  ): Promise<{
    album: SpotifyAlbumToReview;
    artists: AlbumArtist[];
    /** The album's unfinished review, or null when it has none */
    draft: AlbumDraft | null;
    /** Every genre with its album count, most used first */
    genres?: GenreCount[];
  }> {
    const existing = await AlbumModel.findBySpotifyID(id);
    if (existing) throw new AppError("This album has already been reviewed.", 409);

    const token = await SpotifyTokenCache.getAccessToken();
    const spotifyAlbum = await SpotifyClient.getAlbum(id, token);
    const colors = await getImageColors(spotifyAlbum.images[0].url);

    const artistDetails = await SpotifyClient.getArtists(
      spotifyAlbum.artists.map(a => a.id),
      token
    );
    const artistMap = new Map(artistDetails.map(a => [a.id, a]));
    const albumArtists: AlbumArtist[] = spotifyAlbum.artists.map(a => {
      const details = artistMap.get(a.id);
      return {
        spotifyID: a.id,
        name: a.name,
        imageURLs: details?.images ?? [],
      };
    });
    const album: SpotifyAlbumToReview = { ...spotifyAlbum, colors, albumArtists };
    const draft = await ReviewDraftService.getDraft(id);

    if (!includeGenres) {
      return { album, artists: albumArtists, draft };
    }

    const genres = await GenreModel.getGenreCounts();
    return { album, artists: albumArtists, draft, genres };
  }
}
