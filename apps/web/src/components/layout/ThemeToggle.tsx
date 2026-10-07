import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { currentTheme, pickTheme, subscribeToTheme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  // Unknown until hydrated, because the server can't see the visitor's theme
  const theme = useSyncExternalStore(subscribeToTheme, currentTheme, () => null);

  const toggle = () => pickTheme(currentTheme() === "dark" ? "light" : "dark");

  return (
    <IconButton className={styles.toggle} aria-label="Dark mode" aria-pressed={theme === null ? undefined : theme === "dark"} onClick={toggle}>
      <SunIcon className={styles.sun} weight="bold" aria-hidden="true" />
      <MoonIcon className={styles.moon} weight="fill" aria-hidden="true" />
    </IconButton>
  );
}
