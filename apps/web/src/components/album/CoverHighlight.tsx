import { isHexColour, usableCoverColours } from "@/lib/coverColours";

import type { ExtractedColor } from "@shared/types";

interface CoverHighlightProps {
  colours: ExtractedColor[];
}

/**
 * Tints selected text anywhere on the page, the navbar included, with the album's most vivid cover colour for each theme.
 */
export function CoverHighlight({ colours }: CoverHighlightProps) {
  const light = usableCoverColours(colours, "light").find(isHexColour);
  const dark = usableCoverColours(colours, "dark").find(isHexColour);
  if (!light && !dark) return null;

  const properties = [light ? `--selection-light: ${light};` : "", dark ? `--selection-dark: ${dark};` : ""].join(" ");
  return <style>{`:root { ${properties} }`}</style>;
}
