/** Picks the largest image. Spotify lists images largest first. */
export function largestImageURL(images: { url: string }[]): string | null {
  return images[0]?.url ?? null;
}
