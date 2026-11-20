/** Keeps one item for each key. A later item with the same key replaces an earlier one. */
export function uniqueBy<Item>(items: Item[], key: (item: Item) => string): Item[] {
  const byKey = new Map<string, Item>();
  for (const item of items) byKey.set(key(item), item);
  return [...byKey.values()];
}
