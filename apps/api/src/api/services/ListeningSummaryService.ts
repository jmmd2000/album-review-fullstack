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
  /** Up to 5, the most played first */
  topArtists: (TopEntry & { imageURL: string | null })[];
  /** Up to 5, the most played first */
  topAlbums: (TopEntry & { artist: string | null; imageURL: string | null })[];
  reviews: { album: string; artist: string }[];
  gigs: { artist: string; venue: string; city: string }[];
}

/** Rows by their date, keeping each date's rows in the order they came */
function groupByDate<T extends { date: string }>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const row of rows) groups.set(row.date, [...(groups.get(row.date) ?? []), row]);
  return groups;
}

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

    const totalsByDate = groupByDate(totals);
    const artistsByDate = groupByDate(artists);
    const albumsByDate = groupByDate(albums);
    const tracksByDate = groupByDate(tracks);
    const dates = [...new Set([...totals, ...reviews, ...gigs].map(row => row.date))].sort();

    return dates.map(date => {
      const dayArtists = artistsByDate.get(date) ?? [];
      const dayAlbums = albumsByDate.get(date) ?? [];
      const dayTotals = totalsByDate.get(date)?.[0];
      return {
        date,
        plays: dayTotals?.plays ?? 0,
        minutes: dayTotals?.minutes ?? 0,
        topArtist: dayArtists[0] ? { name: dayArtists[0].name, plays: dayArtists[0].plays } : null,
        topAlbum: withArtist(dayAlbums[0]),
        topTrack: withArtist(tracksByDate.get(date)?.[0]),
        topArtists: dayArtists.map(artist => ({ name: artist.name, plays: artist.plays, imageURL: artist.imageURL })),
        topAlbums: dayAlbums.map(album => ({ name: album.name, artist: album.artist, plays: album.plays, imageURL: album.imageURL })),
        reviews: reviews.filter(review => review.date === date).map(review => ({ album: review.album, artist: review.artist })),
        gigs: gigs.filter(gig => gig.date === date).map(gig => ({ artist: gig.artist, venue: gig.venue, city: gig.city })),
      };
    });
  }
}
