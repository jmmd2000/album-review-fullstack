import { and, count, desc, eq, inArray, min, ne, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { albumArtists, albumGenres, artistListenerLinks, reviewedAlbums, reviewedArtists } from "@/db/schema";
import { db } from "@/db/client";
import type { GenreAlbumCandidate, LinkedAlbumCandidate } from "@/helpers/similarAlbums";

const otherAlbumArtists = alias(albumArtists, "other_album_artists");

/** True for an album that has none of these artists */
function hasNoneOfArtists(artistSpotifyIDs: string[]) {
  return notExists(
    db
      .select({ albumSpotifyID: otherAlbumArtists.albumSpotifyID })
      .from(otherAlbumArtists)
      .where(and(eq(otherAlbumArtists.albumSpotifyID, reviewedAlbums.spotifyID), inArray(otherAlbumArtists.artistSpotifyID, artistSpotifyIDs)))
  );
}

/** The queries behind the More from the artist and Similar albums rows on an album page */
export class RelatedAlbumModel {
  /** The artist's reviewed albums other than this one, newest first. */
  static async getOtherAlbumsByArtist(artistSpotifyID: string, albumSpotifyID: string, limit: number) {
    return db
      .select({ album: reviewedAlbums })
      .from(reviewedAlbums)
      .innerJoin(albumArtists, eq(albumArtists.albumSpotifyID, reviewedAlbums.spotifyID))
      .where(and(eq(albumArtists.artistSpotifyID, artistSpotifyID), ne(reviewedAlbums.spotifyID, albumSpotifyID)))
      .orderBy(desc(reviewedAlbums.releaseYear), desc(reviewedAlbums.createdAt))
      .limit(limit)
      .then(rows => rows.map(row => row.album));
  }

  /** The albums by artists that listeners link to these artists, with each album's closest link. Albums by these artists are left out. */
  static async getLinkedAlbums(artistSpotifyIDs: string[]): Promise<LinkedAlbumCandidate[]> {
    if (artistSpotifyIDs.length === 0) return [];
    return db
      .select({ albumSpotifyID: reviewedAlbums.spotifyID, position: min(artistListenerLinks.position).mapWith(Number), finalScore: reviewedAlbums.finalScore })
      .from(artistListenerLinks)
      .innerJoin(reviewedArtists, eq(reviewedArtists.deezerID, artistListenerLinks.linkedDeezerID))
      .innerJoin(albumArtists, eq(albumArtists.artistSpotifyID, reviewedArtists.spotifyID))
      .innerJoin(reviewedAlbums, eq(reviewedAlbums.spotifyID, albumArtists.albumSpotifyID))
      .where(and(inArray(artistListenerLinks.artistSpotifyID, artistSpotifyIDs), hasNoneOfArtists(artistSpotifyIDs)))
      .groupBy(reviewedAlbums.spotifyID, reviewedAlbums.finalScore);
  }

  /** The albums that share a genre with these genres, with the genres they share. Albums by these artists are left out. */
  static async getAlbumsSharingGenres(genreIDs: number[], artistSpotifyIDs: string[]): Promise<GenreAlbumCandidate[]> {
    if (genreIDs.length === 0) return [];
    const rows = await db
      .select({ albumSpotifyID: reviewedAlbums.spotifyID, genreID: albumGenres.genreID, finalScore: reviewedAlbums.finalScore })
      .from(albumGenres)
      .innerJoin(reviewedAlbums, eq(reviewedAlbums.spotifyID, albumGenres.albumSpotifyID))
      .where(and(inArray(albumGenres.genreID, genreIDs), hasNoneOfArtists(artistSpotifyIDs)));

    const candidates = new Map<string, GenreAlbumCandidate>();
    for (const row of rows) {
      const candidate = candidates.get(row.albumSpotifyID) ?? { albumSpotifyID: row.albumSpotifyID, sharedGenreIDs: [], finalScore: row.finalScore };
      candidates.set(row.albumSpotifyID, { ...candidate, sharedGenreIDs: [...candidate.sharedGenreIDs, row.genreID] });
    }
    return [...candidates.values()];
  }

  /** How many albums have each of these genres. */
  static async getGenreAlbumCounts(genreIDs: number[]): Promise<Map<number, number>> {
    if (genreIDs.length === 0) return new Map();
    const rows = await db.select({ genreID: albumGenres.genreID, albumCount: count() }).from(albumGenres).where(inArray(albumGenres.genreID, genreIDs)).groupBy(albumGenres.genreID);
    return new Map(rows.map(row => [row.genreID, row.albumCount]));
  }
}
