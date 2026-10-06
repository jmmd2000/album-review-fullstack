import type { ExtractedColor } from "@shared/types";

/** Picks black or white text for legibility against a given background colour. */
export function readableOn(hex: string): "#f7f7f7" | "#141414" {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 150 ? "#141414" : "#f7f7f7";
}

/** Creates a gradient from the extracted cover colours. */
export function heroBackground(colours: ExtractedColor[], ink: string): string {
  if (colours.length >= 2) {
    return `linear-gradient(135deg, ${colours.map(colour => colour.hex).join(", ")})`;
  }
  if (colours.length === 1) {
    const hex = colours[0]!.hex;
    if (ink === "#141414") {
      const soft = `color-mix(in srgb, ${hex} 65%, #fff)`;
      const softer = `color-mix(in srgb, ${hex} 82%, #fff)`;
      return `linear-gradient(135deg, ${hex} 0%, ${soft} 55%, ${softer} 100%)`;
    }
    const light = `color-mix(in srgb, ${hex} 85%, #fff)`;
    const dark = `color-mix(in srgb, ${hex} 60%, #000)`;
    const deep = `color-mix(in srgb, ${hex} 35%, #000)`;
    return `linear-gradient(135deg, ${light} 0%, ${hex} 30%, ${dark} 70%, ${deep} 100%)`;
  }
  return "var(--colour-background)";
}
