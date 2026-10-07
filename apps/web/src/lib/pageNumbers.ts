/**
 * The page numbers a page list shows: the first, the last, and the current
 * page with one either side. A "gap" stands in for the pages between them,
 * unless it would only hide one page, which is shown instead.
 */
export function pageNumbers(current: number, total: number): (number | "gap")[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])].filter(page => page >= 1 && page <= total).sort((a, b) => a - b);

  const result: (number | "gap")[] = [];
  for (const page of pages) {
    const previous = result.at(-1);
    if (typeof previous === "number" && page - previous === 2) result.push(previous + 1);
    if (typeof previous === "number" && page - previous > 2) result.push("gap");
    result.push(page);
  }
  return result;
}
