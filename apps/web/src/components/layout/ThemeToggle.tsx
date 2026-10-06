import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/IconButton";
import { currentTheme, pickTheme, type Theme } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

export function ThemeToggle() {
  // Unknown until mounted, because the server can't see the visitor's theme
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => setTheme(currentTheme());
    systemDark.addEventListener("change", onSystemChange);
    return () => systemDark.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    pickTheme(next);
    setTheme(next);
  };

  return (
    <IconButton className={styles.toggle} aria-label="Dark mode" aria-pressed={theme === null ? undefined : theme === "dark"} onClick={toggle}>
      <SunIcon className={styles.sun} weight="bold" aria-hidden="true" />
      <MoonIcon className={styles.moon} weight="fill" aria-hidden="true" />
    </IconButton>
  );
}
