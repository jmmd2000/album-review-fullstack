/** Picks the image closest to 300px wide without going over, or the only image there is. Spotify lists images largest first. */
export function mediumImageURL(images: { url: string; width: number }[]): string | null {
  const medium = images.find(image => image.width <= 300);
  return (medium ?? images[0])?.url ?? null;
}
