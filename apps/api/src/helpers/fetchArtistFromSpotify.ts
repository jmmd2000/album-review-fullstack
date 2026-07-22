import type { SpotifyArtist, SpotifyImage } from "@shared/types";
import { SpotifyService } from "@/api/services/SpotifyService";

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
 * @returns A promise resolving to the artist if found, otherwise `null`.
 */
export const fetchArtistFromSpotify = async (id: string): Promise<SpotifyArtist | null> => {
  const token = await SpotifyService.getAccessToken();
  const searchParameters = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, searchParameters);

  if (!response.ok) return null;

  const artist = (await response.json()) as SpotifyArtist;
  return artist;
};
