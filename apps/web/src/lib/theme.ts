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

const pickListeners = new Set<() => void>();

/** Shows a theme and remembers it for the next visit. */
export function pickTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked, the theme still applies until the page closes
  }
  for (const listener of pickListeners) listener();
}

/**
 * Calls onChange whenever the theme on screen changes: a theme is picked, or the system theme changes.
 *
 * @returns A function that stops the calls.
 */
export function subscribeToTheme(onChange: () => void): () => void {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  pickListeners.add(onChange);
  systemDark.addEventListener("change", onChange);
  return () => {
    pickListeners.delete(onChange);
    systemDark.removeEventListener("change", onChange);
  };
}
