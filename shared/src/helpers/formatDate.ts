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

    return `${formattedDate.replace(`${dayOfMonth}`, `${dayOfMonth}${daySuffix}`)}`;
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
