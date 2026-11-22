import { LOOKUP_BATCH_SIZE, SpotifyClient } from "@/api/models/SpotifyClient";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { PlayedGroupModel } from "@/api/models/PlayedGroup";
import { PlayedTrackModel } from "@/api/models/PlayedTrack";
import { chunks } from "@/helpers/chunks";
import { mediumImageURL } from "@/helpers/mediumImageURL";
import { sleep } from "@/helpers/sleep";
import type { JobEmit } from "@/api/services/JobService";
import type { SpotifyPlayedTrack } from "@/api/schemas/spotifySchema";

/** Album search shares Spotify's rate limit, so lookups go one request a second */
const REQUEST_GAP_MS = 1000;

interface Waiting {
  spotifyID: string;
  name: string;
  imageURL: string | null;
}

const describeTrack = (track: SpotifyPlayedTrack) => `${track.name} by ${track.artists.map(artist => artist.name).join(", ")}`;

export const PlayedTrackLookupService = {
  /**
   * Looks up everything waiting on Spotify, 50 at a time and one request a second:
   * each played track not looked up yet, then the ISRC of each reviewed track, then the photo of each played artist.
   * Then it groups the copies of each recording and album, so the stats count them as one.
   * A Spotify failure, such as a 429, stops the run, and the next run carries on. A track Spotify doesn't have is marked, so it isn't looked up again.
   * The progress counts across the whole run. Each batch sends a progress event before its request, and another with the last result's image after it.
   */
  async lookUp(emit: JobEmit): Promise<void> {
    const accessToken = await SpotifyTokenCache.getAccessToken();
    const tracks = await PlayedTrackModel.getTracksToLookUp();
    const reviewedTracks = await PlayedTrackModel.getReviewedTracksToLookUp();
    // The tracks bring in new artists, so the artists are read once the tracks are saved, and the total grows then
    let total = tracks.length + reviewedTracks.length + (await PlayedTrackModel.countArtistsToLookUp());
    let done = 0;
    let requestCount = 0;

    const beforeRequest = async (batch: Waiting[]) => {
      emit("progress", { index: done + 1, total, spotifyID: batch[0].spotifyID, artistName: batch[0].name, artistImage: batch[0].imageURL ?? undefined });
      if (requestCount > 0) await sleep(REQUEST_GAP_MS);
      requestCount++;
    };
    const afterRequest = (batchSize: number, last: { spotifyID: string; name: string; imageURL: string | null } | undefined) => {
      done += batchSize;
      if (last) emit("progress", { index: done, total, spotifyID: last.spotifyID, artistName: last.name, artistImage: last.imageURL ?? undefined });
    };

    for (const batch of chunks(tracks, LOOKUP_BATCH_SIZE)) {
      await beforeRequest(batch);
      const { found, missingIDs } = await SpotifyClient.getTracks(
        batch.map(track => track.spotifyID),
        accessToken
      );
      await PlayedTrackModel.saveTracks(found);
      await PlayedTrackModel.markUnavailable(missingIDs);

      for (const [position, track] of found.entries()) {
        emit("changed", { index: done + position + 1, total, spotifyID: track.id, artistName: describeTrack(track), artistImage: mediumImageURL(track.album.images) ?? undefined });
      }
      for (const [position, spotifyID] of missingIDs.entries()) {
        const name = batch.find(track => track.spotifyID === spotifyID)?.name ?? spotifyID;
        emit("failed", { index: done + found.length + position + 1, total, spotifyID, artistName: name, message: "Spotify no longer has this track" });
      }
      const last = found[found.length - 1];
      afterRequest(batch.length, last && { spotifyID: last.id, name: describeTrack(last), imageURL: mediumImageURL(last.album.images) });
    }

    for (const batch of chunks(reviewedTracks, LOOKUP_BATCH_SIZE)) {
      await beforeRequest(batch);
      const batchIDs = batch.map(track => track.spotifyID);
      const { found } = await SpotifyClient.getTracks(batchIDs, accessToken);
      await PlayedTrackModel.saveReviewedISRCs(batchIDs, found);
      const last = batch[batch.length - 1];
      afterRequest(batch.length, last);
    }

    const artists = await PlayedTrackModel.getArtistsToLookUp();
    total = done + artists.length;
    for (const batch of chunks(artists, LOOKUP_BATCH_SIZE)) {
      await beforeRequest(batch);
      const batchIDs = batch.map(artist => artist.spotifyID);
      const found = (await SpotifyClient.getSeveralArtists(batchIDs, accessToken)).filter(artist => artist !== null);
      await PlayedTrackModel.savePhotos(batchIDs, found);

      for (const [position, artist] of found.entries()) {
        const progress = { index: done + position + 1, total, spotifyID: artist.id, artistName: artist.name, artistImage: mediumImageURL(artist.images) ?? undefined };
        emit(artist.images.length > 0 ? "changed" : "same", progress);
      }
      const last = found[found.length - 1];
      afterRequest(batch.length, last && { spotifyID: last.id, name: last.name, imageURL: mediumImageURL(last.images) });
    }

    await PlayedGroupModel.groupAll();
  },
};
