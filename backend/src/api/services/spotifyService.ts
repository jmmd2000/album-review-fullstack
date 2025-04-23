import { SearchAlbumsOptions } from "@shared/types";
import { Spotify } from "@/api/models/Spotify";
import { getAllGenres } from "@/helpers/getAllGenres";
import { fetchArtistFromSpotify } from "@/helpers/fetchArtistFromSpotify";

export class SpotifyService {
  static async getAccessToken() {
    return await Spotify.getAccessToken();
  }

  static async searchAlbums(query: SearchAlbumsOptions) {
    // console.log("query", query.query);
    return await Spotify.searchAlbums(query);
  }

  static async getAlbum(id: string, includeGenres: boolean = true) {
    const album = await Spotify.getAlbum(id);
    const artist = await fetchArtistFromSpotify(album.artists[0].id, album.artists[0].href);
    if (!includeGenres) {
      return album;
    }

    const genres = await getAllGenres();
    return { album, artist, genres };
  }
}
