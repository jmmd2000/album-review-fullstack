import "dotenv/config";
import { count, desc, eq } from "drizzle-orm";
import { reviewedAlbums, reviewedArtists, reviewedTracks } from "../../db/schema";
import { db } from "../../index";
import { ReviewedAlbum, ReviewedArtist } from "@shared/types";

export class Artist {
  static async getAllArtists() {
    return (await db.select().from(reviewedArtists)) as ReviewedArtist[];
  }

  static async getArtistByID(artistID: string) {
    return (await db.select().from(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID)))[0] as ReviewedArtist;
  }

  static async getPersonalStats() {
    // returns top 5 artists, top 5 albums, number of albums, artists and tracks rated
    const topArtists = (await db
      .select()
      .from(reviewedArtists)
      .orderBy(desc(reviewedArtists.totalScore))
      .limit(5)
      .then((results) => results)) as ReviewedArtist[];

    const topAlbums = (await db
      .select()
      .from(reviewedAlbums)
      .orderBy(desc(reviewedAlbums.reviewScore))
      .limit(5)
      .then((results) => results)) as ReviewedAlbum[];

    const numArtists = await db.select({ count: count() }).from(reviewedArtists);
    const numAlbums = await db.select({ count: count() }).from(reviewedAlbums);
    const numTracks = await db.select({ count: count() }).from(reviewedTracks);

    return {
      topArtists,
      topAlbums,
      numArtists: numArtists[0].count,
      numAlbums: numAlbums[0].count,
      numTracks: numTracks[0].count,
    };
  }

  static async deleteArtist(artistID: string) {
    await db.delete(reviewedArtists).where(eq(reviewedArtists.spotifyID, artistID));
  }
}
