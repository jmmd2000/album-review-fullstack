import type { CSSProperties } from "react";

/** An album cover or an artist photo, which can fly between pages when the page changes */
export type MorphKind = "album" | "artist";

/** The view transition name each kind shares between the old page and the new one */
const transitionNames: Record<MorphKind, string> = {
  album: "album-cover",
  artist: "artist-photo",
};

/** The album and the artist whose images fly in the current page change */
const morphing: Record<MorphKind, string | null> = { album: null, artist: null };

/** The element the pointer last pressed, to tell which of two copies of a cover was clicked */
let lastPressed: Element | null = null;

if (typeof document !== "undefined") {
  document.addEventListener("pointerdown", event => (lastPressed = event.target instanceof Element ? event.target : null), { capture: true });
}

interface MorphProps {
  "data-morph": string;
  "data-morph-lands"?: "";
  decoding?: "sync";
  style?: CSSProperties;
}

/**
 * The props for an album cover or an artist photo that can fly to or from another page.
 * Every copy is tagged so it can be the image that flies away. Only an image that can land
 * gets the transition name when it renders, and a page must have at most one of each.
 *
 * @param kind An album cover or an artist photo.
 * @param spotifyID The album or artist the image shows.
 * @param canLand False for a duplicate copy, or an image too small to land on.
 */
export function morphProps(kind: MorphKind, spotifyID: string, canLand = true): MorphProps {
  const lands = canLand && morphing[kind] === spotifyID;
  return {
    "data-morph": `${kind}:${spotifyID}`,
    "data-morph-lands": canLand ? "" : undefined,
    // The browser's picture of the new page shows an image only once it's decoded, so the landing one decodes straight away
    decoding: lands ? "sync" : undefined,
    style: lands ? { viewTransitionName: transitionNames[kind] } : undefined,
  };
}

/** The album or artist ID in a page's path, such as "/albums/abc". Other pages under it, such as edit, don't count. */
function pageID(pathname: string | undefined, section: "albums" | "artists"): string | null {
  const match = pathname?.match(new RegExp(`^/${section}/([^/]+)$`));
  return match?.[1] ?? null;
}

/**
 * Gives the transition name to the one image on the old page that should fly away: the one that was clicked,
 * or with nothing clicked, such as going back, the page's main copy of it.
 */
function nameLeavingImage(kind: MorphKind, spotifyID: string | null) {
  if (!spotifyID) return;
  const copies = [...document.querySelectorAll<HTMLElement>(`[data-morph="${kind}:${spotifyID}"]`)];
  const pressed = copies.find(copy => {
    const link = copy.closest("a") ?? copy;
    return link.contains(lastPressed) || link === document.activeElement;
  });
  const leaving = pressed ?? copies.find(copy => copy.hasAttribute("data-morph-lands"));
  if (!leaving) return;
  leaving.style.viewTransitionName = transitionNames[kind];
  // globals.css reshapes the flying image from this shape to the landing one
  document.documentElement.style.setProperty(`--${transitionNames[kind]}-from-radius`, getComputedStyle(leaving).borderRadius);
}

/**
 * Picks the album cover and the artist photo that fly in a page change, and names the ones on the old page.
 * Opening an album or an artist flies its image in, and leaving one flies it back to wherever it shows on the next page.
 * The router calls this just before the browser takes its picture of the old page.
 *
 * @returns The view transition types, such as "album-grows" or "artist-shrinks", which globals.css uses to show the sharper picture.
 */
export function prepareMorph(fromPathname: string | undefined, toPathname: string): string[] {
  morphing.album = pageID(toPathname, "albums") ?? pageID(fromPathname, "albums");
  morphing.artist = pageID(toPathname, "artists") ?? pageID(fromPathname, "artists");

  // A name left from the last page change would clash with the new one, and a clash cancels the whole transition
  for (const element of document.querySelectorAll<HTMLElement>("[data-morph]")) element.style.viewTransitionName = "";
  nameLeavingImage("album", morphing.album);
  nameLeavingImage("artist", morphing.artist);

  const types: string[] = [];
  if (morphing.album) types.push(pageID(toPathname, "albums") ? "album-grows" : "album-shrinks");
  if (morphing.artist) types.push(pageID(toPathname, "artists") ? "artist-grows" : "artist-shrinks");
  return types;
}

/**
 * Reads the shape of each image a flight lands on, so globals.css can reshape the flying image to match.
 * The router calls this once the new page has rendered, because the landing image doesn't exist before then.
 */
export function measureLandings() {
  if (typeof document === "undefined") return;
  for (const name of Object.values(transitionNames)) {
    const landing = [...document.querySelectorAll<HTMLElement>("[data-morph]")].find(element => element.style.viewTransitionName === name);
    if (landing) document.documentElement.style.setProperty(`--${name}-to-radius`, getComputedStyle(landing).borderRadius);
  }
}

/** The longest a page change waits for its big image before it goes ahead without it */
const IMAGE_WAIT_IN_MILLISECONDS = 300;

/**
 * Loads a page's big image before the page opens, so the image that flies in lands on a real picture, not an empty box.
 * It gives up after a short wait, so a slow image never holds the page up. It does nothing on the server.
 */
export async function preloadImage(url: string | undefined) {
  if (!url || typeof window === "undefined") return;
  const image = new Image();
  image.src = url;
  const timeout = new Promise(resolve => setTimeout(resolve, IMAGE_WAIT_IN_MILLISECONDS));
  await Promise.race([image.decode().catch(() => undefined), timeout]);
}
