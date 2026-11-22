import { ListeningStatsModel } from "@/api/models/ListeningStats";
import { ListeningSummaryModel, type DayTop } from "@/api/models/ListeningSummary";

interface TopEntry {
  name: string;
  plays: number;
}

/** One day's listening, reviews and gigs, in Irish time */
export interface DaySummary {
  date: string;
  plays: number;
  minutes: number;
  topArtist: TopEntry | null;
  topAlbum: (TopEntry & { artist: string | null }) | null;
  topTrack: (TopEntry & { artist: string | null }) | null;
  reviews: { album: string; artist: string }[];
  gigs: { artist: string; venue: string; city: string }[];
}

const byDate = <T extends { date: string }>(rows: T[]) => new Map(rows.map(row => [row.date, row]));

const withArtist = (top: DayTop | undefined) => (top ? { name: top.name, artist: top.artist, plays: top.plays } : null);

export class ListeningSummaryService {
  /**
   * One summary per day from `from` to `to`, both YYYY-MM-DD and included, in Irish time. Days with no plays, reviews
   * or gigs are left out.
   */
  static async getDays(from: string, to: string): Promise<DaySummary[]> {
    const period = await ListeningStatsModel.resolvePeriod("custom", new Date(), from, to);
    const [totals, artists, albums, tracks, reviews, gigs] = await Promise.all([
      ListeningSummaryModel.getTotals(period),
      ListeningSummaryModel.getTopArtists(period),
      ListeningSummaryModel.getTopAlbums(period),
      ListeningSummaryModel.getTopTracks(period),
      ListeningSummaryModel.getReviews(period),
      ListeningSummaryModel.getGigs(period),
    ]);

    const totalsByDate = byDate(totals);
    const artistByDate = byDate(artists);
    const albumByDate = byDate(albums);
    const trackByDate = byDate(tracks);
    const dates = [...new Set([...totals, ...reviews, ...gigs].map(row => row.date))].sort();

    return dates.map(date => {
      const artist = artistByDate.get(date);
      return {
        date,
        plays: totalsByDate.get(date)?.plays ?? 0,
        minutes: totalsByDate.get(date)?.minutes ?? 0,
        topArtist: artist ? { name: artist.name, plays: artist.plays } : null,
        topAlbum: withArtist(albumByDate.get(date)),
        topTrack: withArtist(trackByDate.get(date)),
        reviews: reviews.filter(review => review.date === date).map(review => ({ album: review.album, artist: review.artist })),
        gigs: gigs.filter(gig => gig.date === date).map(gig => ({ artist: gig.artist, venue: gig.venue, city: gig.city })),
      };
    });
  }
}
