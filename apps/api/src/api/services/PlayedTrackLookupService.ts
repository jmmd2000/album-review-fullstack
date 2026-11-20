import { LOOKUP_BATCH_SIZE, SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { chunks } from "@/helpers/chunks";
import { sleep } from "@/helpers/sleep";
import type { JobEmit } from "@/api/services/JobService";

/** Album search shares Spotify's rate limit, so a run stays slow and short */
const MAX_REQUESTS_PER_RUN = 200;
const REQUEST_GAP_MS = 1000;

export const PlayedTrackLookupService = {
  /**
   * Looks up the album and artists of each played track that has none, then the photo of each played artist that has none.
   * Makes at most 200 Spotify requests, one a second. A Spotify failure, such as a 429, stops the run, and the next run carries on.
   * A track Spotify doesn't have is marked, so it isn't looked up again.
   */
  async lookUp(emit: JobEmit): Promise<void> {
    const accessToken = await SpotifyTokenCache.getAccessToken();
    const trackIDs = await PlayedTrackModel.getTracksToLookUp(MAX_REQUESTS_PER_RUN * LOOKUP_BATCH_SIZE);
    let index = 0;
    let requestCount = 0;

    for (const batch of chunks(trackIDs, LOOKUP_BATCH_SIZE)) {
      if (requestCount > 0) await sleep(REQUEST_GAP_MS);
      requestCount++;
      const { found, missingIDs } = await SpotifyClient.getTracks(batch, accessToken);
      await PlayedTrackModel.saveTracks(found);
      await PlayedTrackModel.markUnavailable(missingIDs);

      for (const track of found) {
        index++;
        emit("changed", { index, total: trackIDs.length, spotifyID: track.id, artistName: `${track.name} by ${track.artists.map(artist => artist.name).join(", ")}` });
      }
      for (const spotifyID of missingIDs) {
        index++;
        emit("failed", { index, total: trackIDs.length, spotifyID, artistName: spotifyID, message: "Spotify no longer has this track" });
      }
    }

    // Read after the tracks are saved, so the artists they bring in get their photos in the same run
    const artistIDs = await PlayedTrackModel.getArtistsToLookUp((MAX_REQUESTS_PER_RUN - requestCount) * LOOKUP_BATCH_SIZE);
    const total = index + artistIDs.length;
    for (const batch of chunks(artistIDs, LOOKUP_BATCH_SIZE)) {
      if (requestCount > 0) await sleep(REQUEST_GAP_MS);
      requestCount++;
      const artists = await SpotifyClient.getSeveralArtists(batch, accessToken);
      const found = artists.filter(artist => artist !== null);
      await PlayedTrackModel.savePhotos(batch, found);

      for (const artist of found) {
        index++;
        const progress = { index, total, spotifyID: artist.id, artistName: artist.name, artistImage: artist.images[0]?.url };
        emit(artist.images.length > 0 ? "changed" : "same", progress);
      }
    }
  },
};
