/**
 * Turns a string into a number, same string in, same number out. Used to
 * build a seed from stable inputs like album ids or colour hexes.
 */
export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 4294967296;
  }
  return hash;
}

/**
 * A predictable replacement for Math.random. The same seed always produces the
 * same sequence of numbers between 0 and 1, which is what lets the server
 * and the client agree on a "random" layout during SSR. Multiply, add, wrap,
 * scale down.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}
