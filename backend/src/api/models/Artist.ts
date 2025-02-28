import "dotenv/config";
import { eq } from "drizzle-orm";
import { reviewedArtists } from "../../db/schema";
import { db } from "../../index";
import { ReviewedArtist } from "@shared/types";

export class Artist {
  static async getArtists() {
    return (await db.select().from(reviewedArtists)) as ReviewedArtist[];
  }

  static async deleteArtist(artistID: string) {
    await db.delete(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID));
  }
}
