import "dotenv/config";
import { eq } from "drizzle-orm";
import { ReviewedTrack } from "@shared/types";
import { reviewedTracks } from "../../db/schema";
import { db } from "../../index";

export class Track {
  static async getAlbumTracks(albumID: string) {
    const tracks = await db
      .select()
      .from(reviewedTracks)
      .where(eq(reviewedTracks.albumSpotifyID, albumID))
      .then((results) => results);

    return tracks as ReviewedTrack[];
  }

  static async deleteAlbumTracks(albumID: string) {
    await db.delete(reviewedTracks).where(eq(reviewedTracks.albumSpotifyID, albumID));
  }
}
