import { and, asc, avg, count, eq, notExists } from "drizzle-orm";
import { albumArtists, bookmarkedAlbums, dismissedAlbums, reviewedAlbums, reviewedArtists, suggestedAlbums } from "@/db/schema";
import { db } from "@/db/client";

export type SuggestionRow = (typeof suggestedAlbums.$inferSelect)["row"];
export type NewSuggestedAlbum = Omit<typeof suggestedAlbums.$inferInsert, "row" | "rank">;

/** A reviewed artist with the average final score of their reviewed albums */
export interface ArtistWithAverage {
  spotifyID: string;
  name: string;
  imageURLs: { url: string }[];
  averageScore: number;
  albumCount: number;
}

export class SuggestedAlbumModel {
  /** Every reviewed artist that has at least one reviewed album, with their average album score. */
  static async getArtistsWithAverage(): Promise<ArtistWithAverage[]> {
    return db
      .select({
        spotifyID: reviewedArtists.spotifyID,
        name: reviewedArtists.name,
        imageURLs: reviewedArtists.imageURLs,
        averageScore: avg(reviewedAlbums.finalScore).mapWith(Number),
        albumCount: count(reviewedAlbums.spotifyID),
      })
      .from(reviewedArtists)
      .innerJoin(albumArtists, eq(albumArtists.artistSpotifyID, reviewedArtists.spotifyID))
      .innerJoin(reviewedAlbums, eq(reviewedAlbums.spotifyID, albumArtists.albumSpotifyID))
      .groupBy(reviewedArtists.spotifyID, reviewedArtists.name, reviewedArtists.imageURLs)
      .orderBy(asc(reviewedArtists.name));
  }

  /** The average final score of every reviewed album. */
  static async getOverallAverage(): Promise<number> {
    const [row] = await db.select({ averageScore: avg(reviewedAlbums.finalScore).mapWith(Number) }).from(reviewedAlbums);
    return row?.averageScore ?? 0;
  }

  /** The Spotify IDs of every reviewed, bookmarked and dismissed album. */
  static async getTakenAlbumIDs(): Promise<Set<string>> {
    const [reviewed, bookmarked, dismissed] = await Promise.all([
      db.select({ spotifyID: reviewedAlbums.spotifyID }).from(reviewedAlbums),
      db.select({ spotifyID: bookmarkedAlbums.spotifyID }).from(bookmarkedAlbums),
      db.select({ spotifyID: dismissedAlbums.spotifyID }).from(dismissedAlbums),
    ]);
    return new Set([...reviewed, ...bookmarked, ...dismissed].map(row => row.spotifyID));
  }

  /**
   * Dismisses an album, so no row suggests it again, and takes it out of the saved rows now.
   */
  static async dismiss(spotifyID: string): Promise<void> {
    await db.transaction(async tx => {
      await tx.insert(dismissedAlbums).values({ spotifyID }).onConflictDoNothing();
      await tx.delete(suggestedAlbums).where(eq(suggestedAlbums.spotifyID, spotifyID));
    });
  }

  /** Every album saved in a row, in rank order. */
  static async getAll(row: SuggestionRow) {
    return db.select().from(suggestedAlbums).where(eq(suggestedAlbums.row, row)).orderBy(asc(suggestedAlbums.rank));
  }

  /** A row's albums in rank order, leaving out any that were reviewed or bookmarked since the job saved them. */
  static async getShown(row: SuggestionRow, limit: number) {
    return db
      .select()
      .from(suggestedAlbums)
      .where(
        and(
          eq(suggestedAlbums.row, row),
          notExists(db.select({ spotifyID: reviewedAlbums.spotifyID }).from(reviewedAlbums).where(eq(reviewedAlbums.spotifyID, suggestedAlbums.spotifyID))),
          notExists(db.select({ spotifyID: bookmarkedAlbums.spotifyID }).from(bookmarkedAlbums).where(eq(bookmarkedAlbums.spotifyID, suggestedAlbums.spotifyID)))
        )
      )
      .orderBy(asc(suggestedAlbums.rank))
      .limit(limit);
  }

  /** Replaces a row's albums with these, ranked in this order. */
  static async replaceRow(row: SuggestionRow, albums: NewSuggestedAlbum[]): Promise<void> {
    await db.transaction(async tx => {
      await tx.delete(suggestedAlbums).where(eq(suggestedAlbums.row, row));
      if (albums.length > 0) {
        await tx.insert(suggestedAlbums).values(albums.map((album, index) => ({ ...album, row, rank: index + 1 })));
      }
    });
  }
}
