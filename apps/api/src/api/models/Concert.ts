import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { concerts } from "@/db/schema";

export class ConcertModel {
  /** The artist's gigs, oldest first. */
  static async getByArtist(artistSpotifyID: string) {
    return db.select().from(concerts).where(eq(concerts.artistSpotifyID, artistSpotifyID)).orderBy(asc(concerts.date));
  }
}
