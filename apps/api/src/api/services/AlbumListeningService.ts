import { ListeningStatsModel } from "@/api/models/ListeningStats";
import { TrackModel } from "@/api/models/Track";
import { monthsBetween } from "@/helpers/monthsBetween";

export const AlbumListeningService = {
  /**
   * The admin's listening to a reviewed album, counting its merged copies: all-time plays, minutes and first play,
   * plays and minutes in each month from the first play to now, and the plays of each of its tracks.
   */
  async getAlbumListening(albumID: string, now: Date = new Date()) {
    const [playedMonths, firstPlayedAt, tracks] = await Promise.all([
      ListeningStatsModel.getAlbumMonths(albumID),
      ListeningStatsModel.getAlbumFirstPlay(albumID),
      TrackModel.getTracksByAlbumID(albumID),
    ]);
    const trackPlays = await ListeningStatsModel.getTrackPlays(tracks.map(track => track.spotifyID));

    const thisMonth = now.toLocaleDateString("en-CA", { timeZone: "Europe/Dublin" }).slice(0, 7);
    const playedByMonth = new Map(playedMonths.map(row => [row.month, row]));
    const months =
      playedMonths.length === 0
        ? []
        : monthsBetween(playedMonths[0].month, thisMonth).map(month => {
            const played = playedByMonth.get(month);
            return { month, plays: played?.plays ?? 0, minutes: played ? Math.round(played.ms / 60000) : 0 };
          });

    return {
      plays: playedMonths.reduce((total, row) => total + row.plays, 0),
      minutes: Math.round(playedMonths.reduce((total, row) => total + row.ms, 0) / 60000),
      firstPlayedAt,
      months,
      trackPlays: Object.fromEntries(tracks.map(track => [track.spotifyID, trackPlays.get(track.spotifyID) ?? 0])),
    };
  },
};
