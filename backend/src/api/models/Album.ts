import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { ReviewedAlbum } from "../../../types";
import { reviewedAlbums, reviewedArtists } from "../../db/schema";

const db = drizzle(process.env.DATABASE_URL!);

export class Album {
  static async getAlbumByID(id: string) {
    const album = await db
      .select()
      .from(reviewedAlbums)
      .innerJoin(reviewedArtists, eq(reviewedAlbums.artistDBID, reviewedArtists.id))
      .where(eq(reviewedAlbums.spotifyID, id))
      .then((results) => results[0]);
    console.log({ album });
    return album;
  }
}
