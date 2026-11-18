import { GenreModel } from "@/api/models/Genre";
import { MusicBrainzClient } from "@/api/models/MusicBrainzClient";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { matchGenres, type GenreSuggestion } from "@/helpers/matchGenres";
import { logger } from "@/config/logger";

const MAX_SUGGESTIONS = 8;
const TIME_LIMIT_MS = 10_000;

export class GenreSuggestionService {
  /**
   * Genres MusicBrainz gives the album, matched to the genre list, most voted first and at most 8.
   * It finds the album by its Spotify link, then by barcode, then by title and artist. It never throws:
   * when MusicBrainz is slow, down or has nothing, the list is empty.
   */
  static async getSuggestions(spotifyAlbumID: string): Promise<{ suggestions: GenreSuggestion[] }> {
    const signal = AbortSignal.timeout(TIME_LIMIT_MS);
    try {
      const releaseID = await GenreSuggestionService.findRelease(spotifyAlbumID, signal);
      if (!releaseID) return { suggestions: [] };

      const musicBrainzGenres = await MusicBrainzClient.getReleaseGroupGenres(releaseID, signal);
      const genres = await GenreModel.getGenreCounts();
      const suggestions = matchGenres(
        musicBrainzGenres.map(genre => genre.name),
        genres.map(genre => genre.name)
      );
      return { suggestions: suggestions.slice(0, MAX_SUGGESTIONS) };
    } catch (error) {
      logger.warn({ err: error, spotifyAlbumID }, "Genre suggestions failed");
      return { suggestions: [] };
    }
  }

  // Spotify is only asked for the barcode and title when the link isn't on MusicBrainz, which is rare
  private static async findRelease(spotifyAlbumID: string, signal: AbortSignal): Promise<string | null> {
    const byLink = await MusicBrainzClient.findReleaseBySpotifyLink(spotifyAlbumID, signal);
    if (byLink) return byLink;

    const album = await SpotifyClient.getAlbum(spotifyAlbumID, await SpotifyTokenCache.getAccessToken());
    const barcode = album.external_ids?.upc;
    if (barcode) {
      const byBarcode = await MusicBrainzClient.findReleaseByBarcode(barcode, signal);
      if (byBarcode) return byBarcode;
    }

    signal.throwIfAborted();
    return MusicBrainzClient.findReleaseByTitle(album.name, album.artists[0].name, signal);
  }
}
