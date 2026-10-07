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
    .filter(colour => /^#[0-9a-f]{6}$/i.test(colour.hex))
    .map(colour => ({ hex: colour.hex, oklab: toOKLab(colour.hex) }))
    .filter(colour => themes.every(pageTheme => showsOn(colour.oklab, pageTheme)));

  return usable.sort((first, second) => chroma(second.oklab) - chroma(first.oklab)).map(colour => colour.hex);
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
    if (usable.length === 1) usable.push(usable[0]!);
    return usable.map((hex, index) => [`--cover-${theme}-${index + 1}`, hex]);
  });
  return Object.fromEntries(properties);
}
