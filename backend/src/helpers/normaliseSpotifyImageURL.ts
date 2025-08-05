// Utility function to normalize URLs for comparison
export function normalizeSpotifyImageUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    if (urlObj.hostname.includes("spotifycdn.com")) {
      urlObj.hostname = "image-cdn-ak.spotifycdn.com"; // Normalize to one CDN
    }

    // Remove common cache-busting parameters
    urlObj.searchParams.delete("_");
    urlObj.searchParams.delete("t");
    urlObj.searchParams.delete("timestamp");
    urlObj.searchParams.delete("cache");

    // Ensure https
    urlObj.protocol = "https:";

    // Sort search params for consistent comparison
    urlObj.searchParams.sort();

    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

export function areImageUrlsSame(
  currentUrls: string[],
  fetchedUrls: string[]
): boolean {
  if (currentUrls.length !== fetchedUrls.length) {
    return false;
  }

  // Normalize and sort both arrays
  const normalizedCurrent = currentUrls.map(normalizeSpotifyImageUrl).sort();
  const normalizedFetched = fetchedUrls.map(normalizeSpotifyImageUrl).sort();

  // Compare each normalized URL
  return normalizedCurrent.every((url, idx) => url === normalizedFetched[idx]);
}
