import "dotenv/config";
import { eq } from "drizzle-orm";
import { reviewedArtists } from "../../db/schema";
import { db } from "../../index";
import { ReviewedArtist } from "@shared/types";

export class Artist {
  static async getAllArtists() {
    return (await db.select().from(reviewedArtists)) as ReviewedArtist[];
  }

  static async getArtistByID(artistID: string) {
    return (await db.select().from(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID)))[0] as ReviewedArtist;
  }

  static async deleteArtist(artistID: string) {
    await db.delete(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID));
  }
}
