/**
 * Formats a date string into a human-readable format
 * @param {string} inputDate The date to be formatted i.e. '2023-09-22'
 * @returns {string} The formatted date i.e. 'September 22nd, 2023'
 */
export function formatDate(inputDate: string): string {
  //* Some release dates from spotify are just the year, so we need to check for that
  if (inputDate.length < 5) {
    return inputDate;
  } else {
    // Parse the input date string into a Date object
    const dateParts = inputDate.split("-").map(Number);
    const [year, month, day] = dateParts;
    const parsedDate = new Date(year!, month! - 1, day);

    // Format the date using Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedDate = formatter.format(parsedDate);

    // Extract day and add the appropriate suffix (e.g., "1st", "2nd", "3rd", "4th")
    const dayOfMonth = parsedDate.getDate();
    let daySuffix = "th";

    if (dayOfMonth === 1 || dayOfMonth === 21 || dayOfMonth === 31) {
      daySuffix = "st";
    } else if (dayOfMonth === 2 || dayOfMonth === 22) {
      daySuffix = "nd";
    } else if (dayOfMonth === 3 || dayOfMonth === 23) {
      daySuffix = "rd";
    }

    return `${formattedDate.replace(
      `${dayOfMonth}`,
      `${dayOfMonth}${daySuffix}`
    )}`;
  }
}

/**
 * Converts a formatted date like 'September 22nd, 2023' into a parseable ISO string.
 * If the date is just a year, returns 'YYYY-01-01'.
 */
export function toSortableDate(dateStr: string, fallbackYear: number): string {
  // If it's just a year (e.g. "2004"), default to Jan 1st of that year
  if (/^\d{4}$/.test(dateStr)) return `${dateStr}-01-01`;

  // Remove ordinal suffixes: "22nd" → "22"
  const cleaned = dateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");

  const parsed = new Date(cleaned);
  if (isNaN(parsed.getTime())) {
    // Fallback to just the year if the full date isn't valid
    return `${fallbackYear}-01-01`;
  }

  return parsed.toISOString().split("T")[0]; // e.g. '2023-09-22'
}

/**
 * Returns a “time ago” string for the given date.
 * @param dateInput A Date object or ISO-parseable string
 * @returns
 *   - "just now"                 if < 60s ago
 *   - "1 minute ago"             if 1m–<2m ago
 *   - "x minutes ago"            if < 60m ago
 *   - "1 hour ago"               if 1h–<2h ago
 *   - "x hours ago"              if < 24h ago
 *   - "yesterday"                if 24h–<48h ago
 *   - "September 22nd, 2023 at 3:05 PM" otherwise
 */
export function timeAgo(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return "yesterday";
  }

  // older than yesterday: full date + time
  const isoDate = date.toISOString().split("T")[0];
  const prettyDate = formatDate(isoDate);
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${prettyDate} at ${timePart}`;
}
