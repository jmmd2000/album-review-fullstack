const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
const URI_PREFIX = "spotify:album:";

/**
 * Reads the album ID from a Spotify album link, such as `https://open.spotify.com/album/<id>?si=…`,
 * or from a `spotify:album:<id>` URI. Returns null for any other text.
 */
export function albumIDFromLink(text: string): string | null {
  const trimmed = text.trim();

  if (trimmed.startsWith(URI_PREFIX)) {
    const id = trimmed.slice(URI_PREFIX.length);
    return SPOTIFY_ID.test(id) ? id : null;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.hostname !== "open.spotify.com") return null;

  // Links shared from some countries have a language part first, such as /intl-de/album/<id>
  const parts = url.pathname.split("/").filter(part => part !== "");
  const path = parts[0]?.startsWith("intl-") ? parts.slice(1) : parts;
  if (path.length !== 2 || path[0] !== "album") return null;
  return SPOTIFY_ID.test(path[1]) ? path[1] : null;
}
