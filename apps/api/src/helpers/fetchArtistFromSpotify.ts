import { SpotifyService } from "@/api/services/SpotifyService";
import { artistResponseSchema } from "@/api/schemas/spotifySchema";
import type { SpotifyArtistResponse } from "@/api/schemas/spotifySchema";
import { logger } from "@/config/logger";

/**
 * Fetches an artist's name and photos from Spotify.
 * @param id The artist's Spotify ID.
 * @returns The artist, or null when Spotify can't find them or sends a reply the app can't read. An unreadable reply is logged as a warning.
 */
export const fetchArtistFromSpotify = async (id: string): Promise<SpotifyArtistResponse | null> => {
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

  const result = artistResponseSchema.safeParse(await response.json());
  if (!result.success) {
    logger.warn({ spotifyID: id, issues: result.error.issues }, "Spotify sent an artist the app can't read");
    return null;
  }
  return result.data;
};
