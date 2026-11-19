import { SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { SuggestedAlbumModel, type NewSuggestedAlbum } from "@/api/models/SuggestedAlbum";
import { isNewStudioAlbum, parseReleaseDate } from "@/helpers/newAlbums";
import type { JobEmit } from "@/api/services/JobService";

interface RankedAlbum {
  album: NewSuggestedAlbum;
  artistAverage: number;
}

/** Fills the rows on the Review an album page that the Album suggestions job keeps. */
export const SuggestionService = {
  /**
   * Finds the new studio albums by every reviewed artist on Spotify and saves them as the "new" row,
   * best artist average first, then newest first. Albums already reviewed or bookmarked are left out.
   * An artist whose albums can't be fetched keeps their albums from the last run, and is reported through `emit`.
   */
  async refreshNewAlbums(emit: JobEmit, now: Date = new Date()): Promise<void> {
    const [artists, takenAlbumIDs, previous] = await Promise.all([SuggestedAlbumModel.getArtistsWithAverage(), SuggestedAlbumModel.getTakenAlbumIDs(), SuggestedAlbumModel.getAll("new")]);
    const accessToken = await SpotifyTokenCache.getAccessToken();
    const found: RankedAlbum[] = [];

    for (const [index, artist] of artists.entries()) {
      const progress = { index: index + 1, total: artists.length, spotifyID: artist.spotifyID, artistName: artist.name, artistImage: artist.imageURLs[0]?.url };
      emit("progress", progress);
      try {
        const albums = await SpotifyClient.getArtistAlbums(artist.spotifyID, accessToken);
        const newAlbums = albums.filter(album => !takenAlbumIDs.has(album.id) && isNewStudioAlbum({ name: album.name, releaseDate: album.release_date }, now));
        for (const album of newAlbums) {
          found.push({
            artistAverage: artist.averageScore,
            album: {
              spotifyID: album.id,
              name: album.name,
              artistName: album.artists[0].name,
              artistSpotifyID: album.artists[0].id,
              imageURLs: album.images,
              releaseDate: album.release_date,
              releaseYear: parseReleaseDate(album.release_date).getUTCFullYear(),
            },
          });
        }
        emit(newAlbums.length > 0 ? "changed" : "same", progress);
      } catch (error) {
        const kept = previous.filter(album => album.artistSpotifyID === artist.spotifyID && !takenAlbumIDs.has(album.spotifyID));
        for (const album of kept) found.push({ artistAverage: artist.averageScore, album });
        emit("failed", { ...progress, message: (error as Error).message });
      }
    }

    const ranked = found.sort((a, b) => b.artistAverage - a.artistAverage || parseReleaseDate(b.album.releaseDate).getTime() - parseReleaseDate(a.album.releaseDate).getTime());
    // An album by two reviewed artists turns up once for each of them
    const albums = new Map<string, NewSuggestedAlbum>();
    for (const entry of ranked) {
      if (!albums.has(entry.album.spotifyID)) albums.set(entry.album.spotifyID, entry.album);
    }
    await SuggestedAlbumModel.replaceRow("new", [...albums.values()]);
  },
};
