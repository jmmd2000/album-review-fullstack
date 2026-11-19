import { asc, desc, eq, inArray } from "drizzle-orm";
import { albumArtists, artistListenerLinks, reviewedAlbums, reviewedArtists } from "@/db/schema";
import { db } from "@/db/client";

/** A reviewed artist with the fields the listener links job reads */
export interface LinkableArtist {
  spotifyID: string;
  name: string;
  deezerID: number | null;
  imageURLs: { url: string }[];
}

export interface NewListenerLink {
  linkedDeezerID: number;
  linkedName: string;
}

const linkableArtistColumns = {
  spotifyID: reviewedArtists.spotifyID,
  name: reviewedArtists.name,
  deezerID: reviewedArtists.deezerID,
  imageURLs: reviewedArtists.imageURLs,
};

export class ListenerLinkModel {
  static async getAllArtists(): Promise<LinkableArtist[]> {
    return db.select(linkableArtistColumns).from(reviewedArtists).orderBy(asc(reviewedArtists.name));
  }

  static async getArtistsBySpotifyIDs(spotifyIDs: string[]): Promise<LinkableArtist[]> {
    if (spotifyIDs.length === 0) return [];
    return db.select(linkableArtistColumns).from(reviewedArtists).where(inArray(reviewedArtists.spotifyID, spotifyIDs));
  }

  /** The names of an artist's reviewed albums, newest first. */
  static async getAlbumNames(artistSpotifyID: string, limit: number): Promise<string[]> {
    const rows = await db
      .select({ name: reviewedAlbums.name })
      .from(albumArtists)
      .innerJoin(reviewedAlbums, eq(albumArtists.albumSpotifyID, reviewedAlbums.spotifyID))
      .where(eq(albumArtists.artistSpotifyID, artistSpotifyID))
      .orderBy(desc(reviewedAlbums.releaseYear))
      .limit(limit);
    return rows.map(row => row.name);
  }

  static async setDeezerID(artistSpotifyID: string, deezerID: number): Promise<void> {
    await db.update(reviewedArtists).set({ deezerID }).where(eq(reviewedArtists.spotifyID, artistSpotifyID));
  }

  /** The Deezer IDs of an artist's saved links, in Deezer's order. */
  static async getLinkedDeezerIDs(artistSpotifyID: string): Promise<number[]> {
    const rows = await db
      .select({ linkedDeezerID: artistListenerLinks.linkedDeezerID })
      .from(artistListenerLinks)
      .where(eq(artistListenerLinks.artistSpotifyID, artistSpotifyID))
      .orderBy(asc(artistListenerLinks.position));
    return rows.map(row => row.linkedDeezerID);
  }

  /**
   * Replaces an artist's saved links with these, in this order.
   * It locks the artist's row first, so two runs for the same artist save one after the other.
   * @returns False when the artist no longer exists, and nothing is saved.
   */
  static async replaceLinks(artistSpotifyID: string, links: NewListenerLink[], fetchedAt: Date): Promise<boolean> {
    return db.transaction(async tx => {
      const locked = await tx.select({ spotifyID: reviewedArtists.spotifyID }).from(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistSpotifyID)).for("update");
      if (locked.length === 0) return false;

      await tx.delete(artistListenerLinks).where(eq(artistListenerLinks.artistSpotifyID, artistSpotifyID));
      if (links.length > 0) {
        await tx.insert(artistListenerLinks).values(links.map((link, index) => ({ artistSpotifyID, position: index + 1, ...link, fetchedAt })));
      }
      return true;
    });
  }
}
