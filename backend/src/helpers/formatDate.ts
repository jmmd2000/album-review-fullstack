/**
 * Formats a date string into a human-readable format
 * @param {string} inputDate The date to be formatted i.e. '2023-09-22'
 * @returns {string} The formatted date i.e. 'September 22nd, 2023'
 */
export default function formatDate(inputDate: string): string {
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
