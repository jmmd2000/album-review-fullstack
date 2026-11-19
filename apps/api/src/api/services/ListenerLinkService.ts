import { LastFmClient, LastFmLimitError } from "@/api/models/LastFmClient";
import { ListenerLinkModel, type LinkableArtist } from "@/api/models/ListenerLink";
import { AlbumModel } from "@/api/models/Album";
import { reportError } from "@/config/errorReporting";
import type { JobEmit } from "@/api/services/JobService";

/** How a refresh of one artist's links went */
export type LinkRefreshOutcome = "changed" | "same" | "unmatched";

/** Saves, for each reviewed artist, the artists Last.fm listeners play alongside them. */
export const ListenerLinkService = {
  /**
   * Replaces the artist's saved links with Last.fm's current list of similar artists.
   * When Last.fm doesn't know the artist or has no similar artists, the saved links stay.
   * @throws When Last.fm fails, and the saved links stay.
   */
  async refreshArtist(artist: LinkableArtist): Promise<LinkRefreshOutcome> {
    const similar = await LastFmClient.getSimilarArtists(artist.name);
    if (similar === null) return "unmatched";
    if (similar.length === 0) return "same";

    const savedNames = await ListenerLinkModel.getLinkedNames(artist.spotifyID);
    const isSame = savedNames.length === similar.length && savedNames.every((name, index) => name === similar[index].name);

    await ListenerLinkModel.replaceLinks(
      artist.spotifyID,
      similar.map(similarArtist => ({ linkedName: similarArtist.name, match: similarArtist.match })),
      new Date()
    );
    return isSame ? "same" : "changed";
  },

  /**
   * Refreshes the links of every reviewed artist and reports each one through `emit`.
   * An artist that fails or that Last.fm doesn't know is reported and skipped.
   * @throws LastFmLimitError when Last.fm refuses more requests, which stops the run.
   */
  async refreshAllArtists(emit: JobEmit): Promise<void> {
    const artists = await ListenerLinkModel.getAllArtists();
    const total = artists.length;

    for (const [index, artist] of artists.entries()) {
      const progress = { index: index + 1, total, spotifyID: artist.spotifyID, artistName: artist.name, artistImage: artist.imageURLs[0]?.url };
      emit("progress", progress);
      try {
        const outcome = await this.refreshArtist(artist);
        if (outcome === "unmatched") emit("failed", { ...progress, message: "No match on Last.fm" });
        else emit(outcome, progress);
      } catch (error) {
        if (error instanceof LastFmLimitError) throw error;
        emit("failed", { ...progress, message: (error as Error).message });
      }
    }
  },

  /**
   * Fetches links for the album's artists that have no saved links yet. Call it without await after a review saves.
   * It never throws. A failure is reported, and the next scheduled run tries the artist again.
   */
  async linkNewArtists(albumSpotifyID: string): Promise<void> {
    try {
      const artists = await ListenerLinkModel.getArtistsWithoutLinks(await AlbumModel.getAlbumArtistIDs(albumSpotifyID));
      for (const artist of artists) {
        await this.refreshArtist(artist);
      }
    } catch (error) {
      reportError(error, { job: "listener-links" });
    }
  },
};
