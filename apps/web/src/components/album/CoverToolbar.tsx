import { useSyncExternalStore } from "react";
import { toolbarColour } from "@/lib/coverColours";
import { currentTheme, subscribeToTheme } from "@/lib/theme";

import type { ExtractedColor } from "@shared/types";

interface CoverToolbarProps {
  colours: ExtractedColor[];
}

/**
 * Colours the browser's own toolbar with the album's cover colour, through the theme-color meta tag.
 * The server can't know a theme picked with the toggle, so it sends one tag for each system theme, and the browser swaps to the picked theme once it loads.
 */
export function CoverToolbar({ colours }: CoverToolbarProps) {
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, () => null);

  if (theme) {
    const colour = toolbarColour(colours, theme);
    return colour ? <meta name="theme-color" content={colour} /> : null;
  }

  const light = toolbarColour(colours, "light");
  const dark = toolbarColour(colours, "dark");
  return (
    <>
      {light && <meta name="theme-color" media="(prefers-color-scheme: light)" content={light} />}
      {dark && <meta name="theme-color" media="(prefers-color-scheme: dark)" content={dark} />}
    </>
  );
}
