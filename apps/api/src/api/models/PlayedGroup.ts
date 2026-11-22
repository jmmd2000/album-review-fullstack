import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { groupAlbums, groupTracks, type AlbumToGroup, type Grouping, type ReviewedAlbumToGroup, type ReviewedTrackToGroup, type TrackToGroup } from "@/helpers/groupPlayed";

// A play counts when its length isn't known or it lasted 30 seconds or more, the same as in the stats
const STREAM_CONDITION = sql`(p.ms_played IS NULL OR p.ms_played >= 30000)`;

/** The grouping of copies of the same album or recording, which the stats count as one. */
export class PlayedGroupModel {
  /** Groups every played album and track again, and saves where each belongs. */
  static async groupAll(): Promise<void> {
    const [albums, reviewedAlbums, tracks, reviewedTracks] = await Promise.all([this.getAlbums(), this.getReviewedAlbums(), this.getTracks(), this.getReviewedTracks()]);
    const albumGroups = groupAlbums(albums, reviewedAlbums);
    const trackGroups = groupTracks(tracks, reviewedTracks, albumGroups);

    await db.transaction(async tx => {
      await tx.execute(sql`
        UPDATE played_albums SET main_spotify_id = grouped.main, reviewed_spotify_id = grouped.reviewed
        FROM jsonb_to_recordset(${toJSON(albumGroups)}::jsonb) AS grouped(id text, main text, reviewed text)
        WHERE played_albums.spotify_id = grouped.id`);
      await tx.execute(sql`
        UPDATE played_tracks SET main_spotify_id = grouped.main, reviewed_spotify_id = grouped.reviewed
        FROM jsonb_to_recordset(${toJSON(trackGroups)}::jsonb) AS grouped(id text, main text, reviewed text)
        WHERE played_tracks.spotify_id = grouped.id`);
    });
  }

  private static async getAlbums(): Promise<AlbumToGroup[]> {
    const result = await db.execute(sql`
      SELECT al.spotify_id, al.name, al.album_type, al.artist_spotify_id,
        coalesce((SELECT count(*) FROM plays p JOIN played_tracks pt ON pt.spotify_id = p.track_spotify_id WHERE pt.album_spotify_id = al.spotify_id AND ${STREAM_CONDITION}), 0)::int AS plays,
        array(SELECT DISTINCT t.isrc FROM played_tracks t WHERE t.album_spotify_id = al.spotify_id AND t.isrc IS NOT NULL) AS isrcs
      FROM played_albums al`);
    return (result.rows as unknown as { spotify_id: string; name: string; album_type: string | null; artist_spotify_id: string | null; plays: number; isrcs: string[] }[]).map(row => ({
      spotifyID: row.spotify_id,
      name: row.name,
      albumType: row.album_type,
      artistSpotifyID: row.artist_spotify_id,
      plays: row.plays,
      isrcs: row.isrcs,
    }));
  }

  private static async getReviewedAlbums(): Promise<ReviewedAlbumToGroup[]> {
    const result = await db.execute(sql`
      SELECT ra.spotify_id, ra.name, ra.artist_spotify_id,
        array(SELECT DISTINCT rt.isrc FROM reviewed_tracks rt WHERE rt.album_spotify_id = ra.spotify_id AND rt.isrc IS NOT NULL) AS isrcs
      FROM reviewed_albums ra`);
    return (result.rows as unknown as { spotify_id: string; name: string; artist_spotify_id: string; isrcs: string[] }[]).map(row => ({
      spotifyID: row.spotify_id,
      name: row.name,
      artistSpotifyID: row.artist_spotify_id,
      isrcs: row.isrcs,
    }));
  }

  private static async getTracks(): Promise<TrackToGroup[]> {
    const result = await db.execute(sql`
      SELECT t.spotify_id, t.name, t.isrc, t.album_spotify_id,
        (SELECT count(*) FROM plays p WHERE p.track_spotify_id = t.spotify_id AND ${STREAM_CONDITION})::int AS plays
      FROM played_tracks t`);
    return (result.rows as unknown as { spotify_id: string; name: string; isrc: string | null; album_spotify_id: string | null; plays: number }[]).map(row => ({
      spotifyID: row.spotify_id,
      name: row.name,
      isrc: row.isrc,
      albumSpotifyID: row.album_spotify_id,
      plays: row.plays,
    }));
  }

  private static async getReviewedTracks(): Promise<ReviewedTrackToGroup[]> {
    const result = await db.execute(sql`SELECT spotify_id, name, isrc, album_spotify_id FROM reviewed_tracks ORDER BY id`);
    return (result.rows as unknown as { spotify_id: string; name: string; isrc: string | null; album_spotify_id: string }[]).map(row => ({
      spotifyID: row.spotify_id,
      name: row.name,
      isrc: row.isrc,
      albumSpotifyID: row.album_spotify_id,
    }));
  }
}

function toJSON(groups: Map<string, Grouping>): string {
  return JSON.stringify([...groups].map(([id, grouping]) => ({ id, main: grouping.mainSpotifyID, reviewed: grouping.reviewedSpotifyID })));
}
