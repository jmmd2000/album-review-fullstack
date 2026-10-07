export type Theme = "light" | "dark";

/** The localStorage key holding a picked theme. No value means follow the system. */
export const THEME_STORAGE_KEY = "theme";

/**
 * Runs in the document head before the page paints, so a picked theme shows with no flash
 */
export const themeScript = `
  try {
    const theme = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
  } catch {}
`;

/** The theme on screen: the picked one, or the system's when nothing is picked. */
export function currentTheme(): Theme {
  const picked = document.documentElement.dataset.theme;
  if (picked === "light" || picked === "dark") return picked;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Shows a theme and remembers it for the next visit. */
export function pickTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked, the theme still applies until the page closes
  }
}
