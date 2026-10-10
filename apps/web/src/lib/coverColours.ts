import type { CSSProperties } from "react";
import type { ExtractedColor } from "@shared/types";

interface OKLab {
  lightness: number;
  a: number;
  b: number;
}

/** The page a colour has to show up against. Leave it out for a colour that suits both. */
export type PageTheme = "light" | "dark";

/** Below this an OKLab colour reads as grey, which only shows as haze */
const MINIMUM_CHROMA = 0.025;
/** On the dark page a grey this light or lighter glows like white light, so it's kept */
const MINIMUM_GLOWING_LIGHTNESS = 0.75;
/** Closer than this to the page and a colour disappears into it */
const MINIMUM_PAGE_DISTANCE = 0.12;

// The light and dark page colours from tokens.css, in OKLab
const pageColours: Record<PageTheme, OKLab> = {
  light: { lightness: 0.965, a: -0.001, b: -0.003 },
  dark: { lightness: 0.19, a: 0.002, b: 0.006 },
};

/** True for a "#rrggbb" colour, the only form that's safe to put into CSS text. */
export function isHexColour(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Converts a "#rrggbb" colour to OKLab, where distances roughly match how different colours look. */
function toOKLab(hex: string): OKLab {
  const [red, green, blue] = [1, 3, 5].map(start => {
    const channel = parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return {
    lightness: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  };
}

/** Converts an OKLab colour back to "#rrggbb", clipping anything outside sRGB to its edge. */
function toHex(colour: OKLab): string {
  const long = Math.pow(colour.lightness + 0.3963377774 * colour.a + 0.2158037573 * colour.b, 3);
  const medium = Math.pow(colour.lightness - 0.1055613458 * colour.a - 0.0638541728 * colour.b, 3);
  const short = Math.pow(colour.lightness - 0.0894841775 * colour.a - 1.291485548 * colour.b, 3);
  const linear = [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
  return (
    "#" +
    linear
      .map(channel => {
        const clipped = Math.min(Math.max(channel, 0), 1);
        const encoded = clipped <= 0.0031308 ? clipped * 12.92 : 1.055 * Math.pow(clipped, 1 / 2.4) - 0.055;
        return Math.round(encoded * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

function chroma(colour: OKLab): number {
  return Math.hypot(colour.a, colour.b);
}

function distance(first: OKLab, second: OKLab): number {
  return Math.hypot(first.lightness - second.lightness, first.a - second.a, first.b - second.b);
}

function showsOn(colour: OKLab, theme: PageTheme): boolean {
  if (distance(colour, pageColours[theme]) < MINIMUM_PAGE_DISTANCE) return false;
  if (chroma(colour) >= MINIMUM_CHROMA) return true;
  return theme === "dark" && colour.lightness >= MINIMUM_GLOWING_LIGHTNESS;
}

/**
 * The cover colours that can light the page, most vivid first.
 * Greys are dropped, apart from light ones on the dark page, which glow like white light.
 * So is anything close to the page colour, so a muddy colour never shows.
 *
 * @param colours The colours stored for an album's cover.
 * @param theme The page they'll sit on. Without one, a colour has to suit both.
 * @returns Hex colours, or an empty list when none stand out.
 */
export function usableCoverColours(colours: ExtractedColor[], theme?: PageTheme): string[] {
  const themes: PageTheme[] = theme ? [theme] : ["light", "dark"];
  const usable = colours
    .filter(colour => isHexColour(colour.hex))
    .map(colour => ({ hex: colour.hex, oklab: toOKLab(colour.hex) }))
    .filter(colour => themes.every(pageTheme => showsOn(colour.oklab, pageTheme)));

  return usable.sort((first, second) => chroma(second.oklab) - chroma(first.oklab)).map(colour => colour.hex);
}

/** How much of the cover colour goes into the browser's toolbar. The rest is the page colour, as at the top of the backdrop. */
const TOOLBAR_COVER_SHARE = 0.45;

/**
 * The colour for the browser's own toolbar on an album page: the cover's most vivid colour for the theme, mixed into the page colour.
 *
 * @param colours The colours stored for an album's cover.
 * @param theme The theme on screen.
 * @returns A "#rrggbb" colour, or null when no cover colour stands out on that theme.
 */
export function toolbarColour(colours: ExtractedColor[], theme: PageTheme): string | null {
  const [vivid] = usableCoverColours(colours, theme);
  if (!vivid) return null;
  const cover = toOKLab(vivid);
  const page = pageColours[theme];
  const mix = (coverValue: number, pageValue: number) => coverValue * TOOLBAR_COVER_SHARE + pageValue * (1 - TOOLBAR_COVER_SHARE);
  return toHex({ lightness: mix(cover.lightness, page.lightness), a: mix(cover.a, page.a), b: mix(cover.b, page.b) });
}

/** The backdrop has five pools, one for each colour a cover can store */
const MAXIMUM_COVER_COLOURS = 5;

/**
 * Hands a page its cover colours for each theme, as --cover-light-1 to 5 and --cover-dark-1 to 5,
 * most vivid first. The coverColours class in styles/coverColours.module.css picks the set that matches the theme.
 */
export function coverColourStyle(colours: ExtractedColor[]): CSSProperties {
  const themes: PageTheme[] = ["light", "dark"];
  const properties = themes.flatMap(theme => {
    const usable = usableCoverColours(colours, theme).slice(0, MAXIMUM_COVER_COLOURS);
    // A single colour fills the second pool too, so the backdrop isn't lopsided
    if (usable.length === 1) usable.push(usable[0]);
    return usable.map((hex, index) => [`--cover-${theme}-${index + 1}`, hex]);
  });
  return Object.fromEntries(properties);
}
