import { SpotifyArtist, SpotifyImage } from "@shared/types";
import { SpotifyService } from "@/api/services/spotifyService";

/**
 * Represents an artist's data from Spotify.
 */
export interface ArtistData {
  /** The artist's name */
  name: string;
  /** The artist's Spotify ID */
  spotifyID: string;
  /** Array of image URLs */
  imageURLs: SpotifyImage[];
}

/**
 * Fetches an artist's data from Spotify.
 * @param id The artist's Spotify ID.
 * @param url The API endpoint to fetch the artist's data.
 * @returns A promise resolving to `ArtistData` if found, otherwise `null`.
 */
export const fetchArtistFromSpotify = async (id: string, url: string): Promise<SpotifyArtist | null> => {
  const token = await SpotifyService.getAccessToken();
  const searchParameters = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await fetch(url, searchParameters);

  const artist = (await response.json()) as SpotifyArtist;

  return artist;
};
