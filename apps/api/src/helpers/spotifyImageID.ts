const SPOTIFY_IMAGE_HOSTS = ["scdn.co", "spotifycdn.com"];
const SPOTIFY_IMAGE_PATH = /^\/image\/([0-9a-f]{40})$/;

/**
 * Gives the ID of the picture in a Spotify image URL.
 * Spotify serves one picture from several hosts and at several sizes. The 40-character ID in the URL starts with
 * "ab67" and a code for the image type and size, and its last 24 characters name the picture. Older IDs have no
 * such code, so the whole ID names the picture.
 *
 * @param url Any image URL.
 * @returns The picture's ID, or the URL unchanged if it isn't a Spotify image URL.
 */
export function spotifyImageID(url: string): string {
  let parsedURL: URL;
  try {
    parsedURL = new URL(url);
  } catch {
    return url;
  }

  const isSpotifyHost = SPOTIFY_IMAGE_HOSTS.some(host => parsedURL.hostname.endsWith(host));
  if (!isSpotifyHost) return url;

  const match = SPOTIFY_IMAGE_PATH.exec(parsedURL.pathname);
  if (!match) return url;

  const imageID = match[1];
  if (imageID.startsWith("ab67")) return imageID.slice(16);
  return imageID;
}

/**
 * Tells whether two image URLs show the same picture, whatever host or size Spotify serves it from.
 * Two missing images count as the same.
 */
export function isSameImage(currentURL: string | null | undefined, newURL: string | null | undefined): boolean {
  if (!currentURL && !newURL) return true;
  if (!currentURL || !newURL) return false;
  return spotifyImageID(currentURL) === spotifyImageID(newURL);
}
