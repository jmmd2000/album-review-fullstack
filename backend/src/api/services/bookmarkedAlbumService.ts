import "dotenv/config";
import { DisplayAlbum, SpotifyImage, GetPaginatedBookmarkedAlbumsOptions } from "@shared/types";
import { BookmarkedAlbumModel } from "../models/BookmarkedAlbum";

export class BookmarkedAlbumService {
  static async bookmarkAlbum(album: DisplayAlbum) {
    const existingAlbum = await BookmarkedAlbumModel.findBySpotifyID(album.spotifyID);
    if (existingAlbum) throw new Error("Album already bookmarked");

    return await BookmarkedAlbumModel.bookmarkAlbum({
      name: album.name,
      spotifyID: album.spotifyID,
      artistSpotifyID: album.spotifyID,
      artistName: album.artistName,
      releaseYear: album.releaseYear,
      imageURLs: album.imageURLs as SpotifyImage[],
    });
  }

  static async getAlbumByID(id: string) {
    return await BookmarkedAlbumModel.findBySpotifyID(id);
  }

  static async getBookmarkedByIds(ids: string[]): Promise<string[]> {
    return await BookmarkedAlbumModel.getBookmarkedByIds(ids);
  }

  static async getAllAlbums() {
    const albums = await BookmarkedAlbumModel.getAllBookmarkedAlbums();
    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      name: album.name,
      spotifyID: album.spotifyID,
      imageURLs: album.imageURLs,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
      finalScore: null,
      affectsArtistScore: true, // this probably should be boolean | null maybe?
    }));

    return { albums: displayAlbums };
  }

  static async getPaginatedAlbums(opts: GetPaginatedBookmarkedAlbumsOptions) {
    const albums = await BookmarkedAlbumModel.getPaginatedAlbums(opts);
    const totalCount = await BookmarkedAlbumModel.getBookmarkedAlbumCount();
    const furtherPages = albums.length > 35;
    if (furtherPages) albums.pop();

    const displayAlbums: DisplayAlbum[] = albums.map((album) => ({
      spotifyID: album.spotifyID,
      name: album.name,
      image: album.imageURLs[0]?.url ?? null,
      imageURLs: album.imageURLs,
      artistName: album.artistName,
      artistSpotifyID: album.artistSpotifyID,
      releaseYear: album.releaseYear,
      finalScore: null,
      affectsArtistScore: true, // this probably should be boolean | null maybe?
    }));

    return { albums: displayAlbums, furtherPages, totalCount };
  }

  static async removeBookmarkedAlbum(id: string) {
    const album = await BookmarkedAlbumModel.findBySpotifyID(id);
    if (!album) throw new Error("Album not found");

    await BookmarkedAlbumModel.removeBookmarkedAlbum(id);
  }
}
