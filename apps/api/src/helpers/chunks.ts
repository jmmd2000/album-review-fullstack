/** Splits a list into lists of at most `size` items. */
export function chunks<Item>(items: Item[], size: number): Item[][] {
  const result: Item[][] = [];
  for (let start = 0; start < items.length; start += size) result.push(items.slice(start, start + size));
  return result;
}
