import { AppError } from "@/api/AppError";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyService } from "@/api/services/SpotifyService";
import type { SpotifyArtistResponse } from "@/api/schemas/spotifySchema";
import { logger } from "@/config/logger";

/**
 * Fetches an artist's name and photos from Spotify.
 * @param id The artist's Spotify ID.
 * @returns The artist, or null when Spotify can't find them or sends a reply the app can't read. An unreadable reply is logged as a warning.
 */
export const fetchArtistFromSpotify = async (id: string): Promise<SpotifyArtistResponse | null> => {
  const token = await SpotifyService.getAccessToken();
  try {
    return await SpotifyClient.getArtist(id, token);
  } catch (error) {
    if (!(error instanceof AppError) || error.status !== 502) throw error;
    logger.warn({ spotifyID: id, reason: error.message }, "Spotify sent an artist the app can't read");
    return null;
  }
};
