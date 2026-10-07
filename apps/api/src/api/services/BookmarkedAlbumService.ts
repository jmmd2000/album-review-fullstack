import "dotenv/config";
import type { DisplayAlbum, GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { BookmarkedAlbumModel } from "../models/BookmarkedAlbum";
import { AppError } from "@/api/AppError";
import { PAGE_SIZE } from "@shared/constants";

export class BookmarkedAlbumService {
  static async bookmarkAlbum(album: DisplayAlbum) {
    const existingAlbum = await BookmarkedAlbumModel.findBySpotifyID(album.spotifyID);
    if (existingAlbum) throw new AppError("Album already bookmarked", 400);

    return await BookmarkedAlbumModel.bookmarkAlbum({
      name: album.name,
      spotifyID: album.spotifyID,
      artistSpotifyID: album.artistSpotifyID,
      artistName: album.artistName,
      releaseYear: album.releaseYear,
      imageURLs: album.imageURLs,
    });
  }

  static async getAlbumByID(id: string) {
    const bookmarkedAlbum = await BookmarkedAlbumModel.findBySpotifyID(id);
    if (!bookmarkedAlbum) throw new AppError("Bookmarked album not found.", 404);
    return bookmarkedAlbum;
  }

  static async getAllAlbums() {
    const bookmarkedAlbums = await BookmarkedAlbumModel.getAllBookmarkedAlbums();
    const displayAlbums: DisplayAlbum[] = bookmarkedAlbums.map(album => ({
      name: album.name,
      spotifyID: album.spotifyID,
      imageURLs: album.imageURLs,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
      finalScore: null,
      affectsArtistScore: true,
    }));

    return { albums: displayAlbums };
  }

  static async getPaginatedAlbums(opts: GetPaginatedBookmarkedAlbumsOptions) {
    const albums = await BookmarkedAlbumModel.getPaginatedAlbums(opts);
    const totalCount = await BookmarkedAlbumModel.getBookmarkedAlbumCount(opts.search);
    const furtherPages = albums.length > PAGE_SIZE;
    if (furtherPages) albums.pop();

    const displayAlbums: DisplayAlbum[] = albums.map(album => ({
      spotifyID: album.spotifyID,
      name: album.name,
      image: album.imageURLs[0]?.url ?? null,
      imageURLs: album.imageURLs,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
      finalScore: null,
      affectsArtistScore: true,
    }));

    return { albums: displayAlbums, furtherPages, totalCount };
  }

  static async removeBookmarkedAlbum(id: string) {
    const album = await BookmarkedAlbumModel.findBySpotifyID(id);
    if (!album) throw new AppError("Bookmarked album not found.", 404);
    await BookmarkedAlbumModel.removeBookmarkedAlbum(id);
  }
}
