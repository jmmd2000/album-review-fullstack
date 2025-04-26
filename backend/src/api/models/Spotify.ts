import { DisplayAlbum, ExtractedColor, SearchAlbumsOptions, SpotifyAlbum, SpotifySearchResponse } from "@shared/types";
import { getImageColors } from "@/helpers/getImageColors";
import { AlbumModel } from "@/api/models/Album";
import { BookmarkedAlbumModel } from "./BookmarkedAlbum";

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

  static async searchAlbums(query: SearchAlbumsOptions): Promise<DisplayAlbum[]> {
    // Check if the query is empty or undefined
    const rawQuery = query.query?.trim();
    if (!rawQuery || rawQuery === "undefined") {
      return [] as DisplayAlbum[];
    }

    // Fetch from Spotify
    const endpoint = `https://api.spotify.com/v1/search?q=${encodeURIComponent(rawQuery)}&type=album&limit=35`;
    const accessToken = await this.getAccessToken();
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });
    const data = await response.json();

    // Map raw Spotify data into your DisplayAlbum shape
    const displayAlbums: DisplayAlbum[] = data.albums.items.map((album: SpotifyAlbum) => ({
      spotifyID: album.id,
      name: album.name,
      artistName: album.artists[0].name,
      artistSpotifyID: album.artists[0].id,
      releaseYear: Number(album.release_date.split("-")[0]),
      imageURLs: album.images,
    }));

    if (displayAlbums.length === 0) return displayAlbums;

    // Bulk fetch existing review scores
    const ids = displayAlbums.map((a) => a.spotifyID);
    const scoreRows = await AlbumModel.getReviewScoresByIds(ids);
    const scoreMap = new Map(scoreRows.map(({ spotifyID, reviewScore }) => [spotifyID, reviewScore]));

    // Bulk fetch bookmarked IDs
    const bookmarkedIds = await BookmarkedAlbumModel.getBookmarkedByIds(ids);
    const bookmarkedSet = new Set(bookmarkedIds);

    // merge back into each album
    return displayAlbums.map((album) => ({
      ...album,
      reviewScore: scoreMap.get(album.spotifyID), // optional
      bookmarked: bookmarkedSet.has(album.spotifyID), // optional
    }));
  }

  static async getAlbum(albumID: string) {
    // Check if the album already exists in the database
    const existingAlbum = await AlbumModel.findBySpotifyID(albumID);
    if (existingAlbum) {
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

    const response: Response = await fetch(endpoint, searchParamaters);

    const data = await response.json();

    // Extract colors from the album cover
    const imageColors: ExtractedColor[] = await getImageColors(data.images[0].url);
    data.colors = imageColors;

    return data as SpotifyAlbum;
  }
}
