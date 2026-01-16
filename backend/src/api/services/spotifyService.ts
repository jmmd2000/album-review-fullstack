import { SearchAlbumsOptions } from "@shared/types";
import { Spotify } from "@/api/models/Spotify";
import { getAllGenres } from "@/helpers/getAllGenres";
import { AlbumArtist } from "@shared/types";
import { GenreModel } from "../models/Genre";

export class SpotifyService {
  static async getAccessToken() {
    return await Spotify.getAccessToken();
  }

  static async searchAlbums(query: SearchAlbumsOptions) {
    return await Spotify.searchAlbums(query);
  }

  static async getAlbum(id: string, includeGenres: boolean = true) {
    const album = await Spotify.getAlbum(id);
    const artistIDs = album.artists.map(a => a.id);
    const artistDetails = await Spotify.getArtists(artistIDs);
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
