import { DeezerClient, DeezerLimitError } from "@/api/models/DeezerClient";
import { ListenerLinkModel, type LinkableArtist } from "@/api/models/ListenerLink";
import type { DeezerAlbumSearchHit } from "@/api/schemas/deezerSchema";
import type { JobEmit } from "@/api/services/JobService";

/** How many of an artist's reviewed albums the match tries before it gives up */
const MAX_ALBUMS_TO_TRY = 3;

/** How a refresh of one artist's links went */
export type LinkRefreshOutcome = "changed" | "same" | "unmatched";

/**
 * Makes an artist name comparable across services: lower case, no accents, "&" as "and", straight apostrophes and single spaces.
 * For example, "Beyoncé & Jay‐Z" and "beyonce and jay-z" give the same text.
 */
export function normaliseArtistName(name: string): string {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[‘’]/g, "'").replace(/[‐‑]/g, "-").replace(/&/g, " and ").replace(/\s+/g, " ").trim();
}

/** The Deezer ID of the first search hit whose artist has this name, or null when no hit does. */
export function findMatchingArtist(hits: DeezerAlbumSearchHit[], artistName: string): number | null {
  const wanted = normaliseArtistName(artistName);
  const match = hits.find(hit => normaliseArtistName(hit.artist.name) === wanted);
  return match ? match.artist.id : null;
}

/** Saves, for each reviewed artist, the artists Deezer listeners play alongside them. */
export const ListenerLinkService = {
  /**
   * Finds the artist on Deezer through their reviewed albums. A search by name alone finds the wrong artist for common names.
   * @returns The Deezer artist ID, or null when none of the albums gives a match.
   */
  async findDeezerID(artist: LinkableArtist): Promise<number | null> {
    const albumNames = await ListenerLinkModel.getAlbumNames(artist.spotifyID, MAX_ALBUMS_TO_TRY);
    for (const albumName of albumNames) {
      const match = findMatchingArtist(await DeezerClient.searchAlbums(albumName, artist.name), artist.name);
      if (match !== null) return match;
    }
    return null;
  },

  /**
   * Matches the artist to Deezer if they have no match yet and saves the match, then replaces their saved links with Deezer's current list.
   * When Deezer has no related artists, the saved links stay.
   * @throws When Deezer fails, and the saved links stay.
   */
  async refreshArtist(artist: LinkableArtist): Promise<LinkRefreshOutcome> {
    let deezerID = artist.deezerID;
    if (deezerID === null) {
      deezerID = await this.findDeezerID(artist);
      if (deezerID === null) return "unmatched";
      await ListenerLinkModel.setDeezerID(artist.spotifyID, deezerID);
    }

    const related = await DeezerClient.getRelatedArtists(deezerID);
    if (related.length === 0) return "same";

    const savedIDs = await ListenerLinkModel.getLinkedDeezerIDs(artist.spotifyID);
    const relatedIDs = related.map(relatedArtist => relatedArtist.id);
    const isSame = savedIDs.length === relatedIDs.length && savedIDs.every((id, index) => id === relatedIDs[index]);

    await ListenerLinkModel.replaceLinks(
      artist.spotifyID,
      related.map(relatedArtist => ({ linkedDeezerID: relatedArtist.id, linkedName: relatedArtist.name })),
      new Date()
    );
    return isSame ? "same" : "changed";
  },

  /**
   * Refreshes the links of every reviewed artist and reports each one through `emit`.
   * An artist that fails or has no match is reported and skipped.
   * @throws DeezerLimitError when Deezer refuses more requests, which stops the run.
   */
  async refreshAllArtists(emit: JobEmit): Promise<void> {
    const artists = await ListenerLinkModel.getAllArtists();
    const total = artists.length;

    for (const [index, artist] of artists.entries()) {
      const progress = { index: index + 1, total, spotifyID: artist.spotifyID, artistName: artist.name, artistImage: artist.imageURLs[0]?.url };
      emit("progress", progress);
      try {
        const outcome = await this.refreshArtist(artist);
        if (outcome === "unmatched") emit("failed", { ...progress, message: "No match on Deezer" });
        else emit(outcome, progress);
      } catch (error) {
        if (error instanceof DeezerLimitError) throw error;
        emit("failed", { ...progress, message: (error as Error).message });
      }
    }
  },
};
