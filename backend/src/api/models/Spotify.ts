import { ExtractedColor, SpotifyAlbum, SpotifySearchResponse } from "@shared/types";
import { getImageColors } from "../../helpers/getImageColors";
import { db } from "../../index";
import { reviewedAlbums } from "../../db/schema";
import { eq } from "drizzle-orm";

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

  static async searchAlbums(query: string) {
    const endpoint = `https://api.spotify.com/v1/search?q=${query}&type=album&limit=10`;
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
    // console.log({ data });
    return data as SpotifySearchResponse;
  }

  static async getAlbum(albumID: string) {
    // const existingAlbum = await db
    //   .select()
    //   .from(reviewedAlbums)
    //   .where(eq(reviewedAlbums.spotifyID, albumID))
    //   .then((results) => results[0]);

    // if (existingAlbum) {
    //   throw new Error("Album already exists.");
    // }

    const endpoint = `https://api.spotify.com/v1/albums/${albumID}`;
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

    // Extract colors from the album cover
    const imageColors: ExtractedColor[] = await getImageColors(data.images[0].url);
    data.colors = imageColors;

    return data as SpotifyAlbum;
  }
}
