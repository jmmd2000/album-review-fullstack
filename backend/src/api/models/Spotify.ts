import { DisplayAlbum, ExtractedColor, SearchAlbumsOptions, SpotifyAlbum, SpotifySearchResponse } from "@shared/types";
import { getImageColors } from "@/helpers/getImageColors";
import { AlbumModel } from "@/api/models/Album";

export class Spotify {
  private static accessToken: string | null = null;
  private static expiresAt: number | null = null;

  static async getAccessToken() {
    // If token exists and is still valid, use it
    if (this.accessToken && this.expiresAt && Date.now() < this.expiresAt) {
      return this.accessToken;
    }

    const tokenEndpoint = "https://accounts.spotify.com/api/token";
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET),
      },
      body: "grant_type=client_credentials",
    };

    const response = await fetch(tokenEndpoint, requestOptions);

    const data = await response.json();

    // Store token and expiration time (3600 seconds)
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000; // Convert to milliseconds

    return this.accessToken;
  }

  static async searchAlbums(query: SearchAlbumsOptions) {
    // Check if the query is empty or undefined
    const rawQuery = query.query?.trim();
    if (!rawQuery || rawQuery === "undefined") return [] as DisplayAlbum[];
    // console.log("Searching for albums with query:", rawQuery);
    const endpoint = `https://api.spotify.com/v1/search?q=${query.query}&type=album&limit=35`;
    const accessToken = await this.getAccessToken();
    const searchParamaters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    const response: Response = await fetch(endpoint, searchParamaters);

    const data = await response.json();
    // console.log("Response data:", data);
    const displayAlbums: DisplayAlbum[] = data.albums.items.map((album: SpotifyAlbum) => {
      return {
        spotifyID: album.id,
        name: album.name,
        artistName: album.artists[0].name,
        artistSpotifyID: album.artists[0].id,
        releaseYear: album.release_date.split("-")[0],
        imageURLs: album.images,
      };
    });

    // console.log("Display albums:", displayAlbums);

    return displayAlbums;

    // return data as SpotifySearchResponse;
  }

  static async getAlbum(albumID: string) {
    // Check if the album already exists in the database
    const existingAlbum = AlbumModel.findBySpotifyID(albumID);
    if (await existingAlbum) {
      throw new Error("Album already exists in the database");
    }
    const endpoint = `https://api.spotify.com/v1/albums/${albumID}`;
    const accessToken = await this.getAccessToken();
    const searchParamaters = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    };

    console.log("accessToken", accessToken);

    const response: Response = await fetch(endpoint, searchParamaters);

    const data = await response.json();
    console.log("Response data:", data);

    // Extract colors from the album cover
    const imageColors: ExtractedColor[] = await getImageColors(data.images[0].url);
    data.colors = imageColors;

    return data as SpotifyAlbum;
  }
}
