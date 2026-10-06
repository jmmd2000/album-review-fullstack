import type { ExtractedColor } from "@shared/types";

interface OKLab {
  lightness: number;
  a: number;
  b: number;
}

/** Below this an OKLab colour reads as grey, which only shows as haze */
const MINIMUM_CHROMA = 0.025;
/** Closer than this to the page and a colour disappears into it */
const MINIMUM_PAGE_DISTANCE = 0.12;

// The light and dark page colours from tokens.css, in OKLab. Checking against both keeps
// the result the same in either theme, so the server and browser always agree.
const pageColours: OKLab[] = [
  { lightness: 0.965, a: -0.001, b: -0.003 },
  { lightness: 0.19, a: 0.002, b: 0.006 },
];

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

/**
 * The cover colours that can light the page, most vivid first.
 * Greys are dropped, and so is anything close to the light or dark page colour,
 * so a black-and-white cover gets no colour at all rather than a muddy one.
 *
 * @param colours The colours stored for an album's cover.
 * @returns Hex colours, or an empty list when none stand out.
 */
export function usableCoverColours(colours: ExtractedColor[]): string[] {
  const usable = colours
    .filter(colour => /^#[0-9a-f]{6}$/i.test(colour.hex))
    .map(colour => ({ hex: colour.hex, oklab: toOKLab(colour.hex) }))
    .filter(colour => chroma(colour.oklab) >= MINIMUM_CHROMA)
    .filter(colour => pageColours.every(page => distance(colour.oklab, page) >= MINIMUM_PAGE_DISTANCE));

  return usable.sort((first, second) => chroma(second.oklab) - chroma(first.oklab)).map(colour => colour.hex);
}
