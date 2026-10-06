/**
 * Converts dates to UK format, from "February 19th, 2008" to "19 February 2008"
 */
export function ukReleaseDate(releaseDate: string): string {
  const match = releaseDate.match(/^([A-Za-z]+) (\d{1,2})(?:st|nd|rd|th), (\d{4})$/);
  if (!match) return releaseDate;
  const [, month, day, year] = match;
  return `${day} ${month} ${year}`;
}

/** "1 hour 2 minutes 30 seconds" becomes "62 min". */
export function shortRuntime(runtime: string): string {
  const hours = runtime.match(/(\d+) hours?/);
  const minutes = runtime.match(/(\d+) minutes?/);
  if (!hours && !minutes) return runtime;
  const totalMinutes = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0);
  return `${totalMinutes} min`;
}

const reviewedFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });

/** When a review was written, as "2 August 2025". */
export function reviewedDate(createdAt: string): string {
  return reviewedFormat.format(new Date(createdAt));
}
