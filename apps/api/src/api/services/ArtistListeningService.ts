import { AlbumModel } from "@/api/models/Album";
import { ConcertModel } from "@/api/models/Concert";
import { ListeningStatsModel } from "@/api/models/ListeningStats";
import { TrackModel } from "@/api/models/Track";
import { monthsBetween } from "@/helpers/monthsBetween";

export interface ListeningMonth {
  /** YYYY-MM */
  month: string;
  plays: number;
  /** The artist's rank among every artist played that month, or null when they weren't played */
  rank: number | null;
}

export const ArtistListeningService = {
  /**
   * The admin's listening to a reviewed artist: all-time plays and first play, plays and rank in each month
   * from the first play to now, the dates of their gigs, and the plays of each reviewed track and album.
   */
  async getArtistListening(artistID: string, now: Date = new Date()) {
    const allTime = { from: null, to: now };
    const [plays, firstPlayedAt, playedMonths, albums, tracks, gigs] = await Promise.all([
      ListeningStatsModel.countEntryPlays("artists", artistID, allTime),
      ListeningStatsModel.getFirstPlay("artists", artistID),
      ListeningStatsModel.getArtistMonths(artistID),
      AlbumModel.getAlbumsByArtist(artistID),
      TrackModel.getTracksByArtist(artistID),
      ConcertModel.getByArtist(artistID),
    ]);
    const [trackPlays, albumPlays] = await Promise.all([
      ListeningStatsModel.getTrackPlays(tracks.map(track => track.spotifyID)),
      ListeningStatsModel.getAlbumPlays(albums.map(album => album.spotifyID)),
    ]);

    const thisMonth = now.toLocaleDateString("en-CA", { timeZone: "Europe/Dublin" }).slice(0, 7);
    const playedByMonth = new Map(playedMonths.map(row => [row.month, row]));
    const months: ListeningMonth[] =
      playedMonths.length === 0
        ? []
        : monthsBetween(playedMonths[0].month, thisMonth).map(month => ({ month, plays: playedByMonth.get(month)?.plays ?? 0, rank: playedByMonth.get(month)?.rank ?? null }));

    return {
      plays,
      firstPlayedAt,
      months,
      gigDates: gigs.map(gig => gig.date),
      trackPlays: Object.fromEntries(tracks.map(track => [track.spotifyID, trackPlays.get(track.spotifyID) ?? 0])),
      albumPlays: Object.fromEntries(albums.map(album => [album.spotifyID, albumPlays.get(album.spotifyID) ?? 0])),
    };
  },
};
