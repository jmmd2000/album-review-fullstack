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
   * A track Spotify doesn't have is marked, so it isn't looked up again. Each batch sends a progress event before its request.
   */
  async lookUp(emit: JobEmit): Promise<void> {
    const accessToken = await SpotifyTokenCache.getAccessToken();
    const tracks = await PlayedTrackModel.getTracksToLookUp(MAX_REQUESTS_PER_RUN * LOOKUP_BATCH_SIZE);
    let requestCount = 0;

    for (const [batchIndex, batch] of chunks(tracks, LOOKUP_BATCH_SIZE).entries()) {
      const firstIndex = batchIndex * LOOKUP_BATCH_SIZE;
      emit("progress", { index: firstIndex + 1, total: tracks.length, spotifyID: batch[0].spotifyID, artistName: batch[0].name });
      if (requestCount > 0) await sleep(REQUEST_GAP_MS);
      requestCount++;

      const { found, missingIDs } = await SpotifyClient.getTracks(
        batch.map(track => track.spotifyID),
        accessToken
      );
      await PlayedTrackModel.saveTracks(found);
      await PlayedTrackModel.markUnavailable(missingIDs);

      for (const [position, track] of found.entries()) {
        emit("changed", { index: firstIndex + position + 1, total: tracks.length, spotifyID: track.id, artistName: `${track.name} by ${track.artists.map(artist => artist.name).join(", ")}` });
      }
      for (const spotifyID of missingIDs) {
        const name = batch.find(track => track.spotifyID === spotifyID)?.name ?? spotifyID;
        emit("failed", { index: firstIndex + found.length + 1, total: tracks.length, spotifyID, artistName: name, message: "Spotify no longer has this track" });
      }
    }

    // Read after the tracks are saved, so the artists they bring in get their photos in the same run
    const artists = await PlayedTrackModel.getArtistsToLookUp((MAX_REQUESTS_PER_RUN - requestCount) * LOOKUP_BATCH_SIZE);
    for (const [batchIndex, batch] of chunks(artists, LOOKUP_BATCH_SIZE).entries()) {
      const firstIndex = batchIndex * LOOKUP_BATCH_SIZE;
      emit("progress", { index: firstIndex + 1, total: artists.length, spotifyID: batch[0].spotifyID, artistName: batch[0].name });
      if (requestCount > 0) await sleep(REQUEST_GAP_MS);
      requestCount++;

      const batchIDs = batch.map(artist => artist.spotifyID);
      const found = (await SpotifyClient.getSeveralArtists(batchIDs, accessToken)).filter(artist => artist !== null);
      await PlayedTrackModel.savePhotos(batchIDs, found);

      for (const [position, artist] of found.entries()) {
        const progress = { index: firstIndex + position + 1, total: artists.length, spotifyID: artist.id, artistName: artist.name, artistImage: artist.images[0]?.url };
        emit(artist.images.length > 0 ? "changed" : "same", progress);
      }
    }
  },
};
