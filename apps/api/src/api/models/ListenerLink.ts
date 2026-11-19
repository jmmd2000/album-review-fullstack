import { and, asc, eq, inArray, notExists } from "drizzle-orm";
import { artistListenerLinks, reviewedArtists } from "@/db/schema";
import { db } from "@/db/client";

/** A reviewed artist with the fields the listener links job reads */
export interface LinkableArtist {
  spotifyID: string;
  name: string;
  imageURLs: { url: string }[];
}

export interface NewListenerLink {
  linkedName: string;
  /** How close Last.fm says the link is, from 0 to 1 */
  match: number;
}

const linkableArtistColumns = {
  spotifyID: reviewedArtists.spotifyID,
  name: reviewedArtists.name,
  imageURLs: reviewedArtists.imageURLs,
};

export class ListenerLinkModel {
  static async getAllArtists(): Promise<LinkableArtist[]> {
    return db.select(linkableArtistColumns).from(reviewedArtists).orderBy(asc(reviewedArtists.name));
  }

  /** The artists among these that have no saved links. */
  static async getArtistsWithoutLinks(spotifyIDs: string[]): Promise<LinkableArtist[]> {
    if (spotifyIDs.length === 0) return [];
    return db
      .select(linkableArtistColumns)
      .from(reviewedArtists)
      .where(
        and(
          inArray(reviewedArtists.spotifyID, spotifyIDs),
          notExists(db.select({ spotifyID: artistListenerLinks.artistSpotifyID }).from(artistListenerLinks).where(eq(artistListenerLinks.artistSpotifyID, reviewedArtists.spotifyID)))
        )
      );
  }

  /** The names of an artist's saved links, in Last.fm's order. */
  static async getLinkedNames(artistSpotifyID: string): Promise<string[]> {
    const rows = await db
      .select({ linkedName: artistListenerLinks.linkedName })
      .from(artistListenerLinks)
      .where(eq(artistListenerLinks.artistSpotifyID, artistSpotifyID))
      .orderBy(asc(artistListenerLinks.position));
    return rows.map(row => row.linkedName);
  }

  /** The saved links of these artists, with each link's place in its list. */
  static async getLinks(artistSpotifyIDs: string[]): Promise<{ linkedName: string; position: number }[]> {
    if (artistSpotifyIDs.length === 0) return [];
    return db
      .select({ linkedName: artistListenerLinks.linkedName, position: artistListenerLinks.position })
      .from(artistListenerLinks)
      .where(inArray(artistListenerLinks.artistSpotifyID, artistSpotifyIDs));
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
