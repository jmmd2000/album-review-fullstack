import type { InferResponseType } from "hono/client";
import type { client } from "@/lib/client";

export type ListeningKind = "artists" | "tracks" | "albums" | "genres";
export type ListeningPeriod = "4-weeks" | "6-months" | "year" | "all" | "custom";

export type TopListening = InferResponseType<typeof client.api.listening.top.$get, 200>;
export type TopEntry = TopListening["entries"][number];

export const KIND_LABELS: Record<ListeningKind, string> = {
  artists: "Artists",
  tracks: "Tracks",
  albums: "Albums",
  genres: "Genres",
};

export const PERIOD_LABELS: Record<ListeningPeriod, string> = {
  "4-weeks": "4 weeks",
  "6-months": "6 months",
  year: "Year",
  all: "All time",
  custom: "Custom",
};

const day = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Dublin" });

/** The end of the totals sentence, such as "in the last 4 weeks" or "from 1 July 2026 to 31 July 2026". */
export function describePeriod(period: ListeningPeriod, from?: string, to?: string): string {
  if (period === "4-weeks") return "in the last 4 weeks";
  if (period === "6-months") return "in the last 6 months";
  if (period === "year") return "in the last year";
  if (period === "all") return "in all";
  if (!from || !to) return "";
  return from === to ? `on ${day(from)}` : `from ${day(from)} to ${day(to)}`;
}

/** The muted line under an entry's name: an artist's album count, or the track or album's artists. */
export function describeEntry(kind: ListeningKind, entry: TopEntry): string {
  if (kind === "artists") return entry.albumCount === 1 ? "1 album played" : `${entry.albumCount ?? 0} albums played`;
  return entry.artistNames.join(", ");
}

/** A round number at or just above the most plays, so the chart's top line reads cleanly. */
export function roundedTop(most: number): number {
  if (most <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(most));
  for (const step of [1, 2, 5, 10]) {
    if (most <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

/** A chart label for a bucket starting on a YYYY-MM-DD day: "3 Mar" for days and weeks, "Mar 26" for months. `full` adds the year. */
export function bucketLabel(start: string, unit: "day" | "week" | "month", full: boolean): string {
  const date = new Date(`${start}T12:00:00Z`);
  if (unit === "month") return date.toLocaleDateString("en-GB", { month: "short", year: full ? "numeric" : "2-digit", timeZone: "UTC" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(full ? { year: "numeric" } : {}), timeZone: "UTC" });
}
