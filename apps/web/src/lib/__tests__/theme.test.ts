import { afterEach, describe, expect, it } from "vitest";
import { THEME_STORAGE_KEY, currentTheme, pickTheme, themeScript } from "@/lib/theme";

const runThemeScript = () => new Function(themeScript)();

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("themeScript", () => {
  it("applies the theme picked on an earlier visit", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("leaves the system theme in charge when nothing was picked", () => {
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("ignores a stored value that isn't a theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "purple");
    runThemeScript();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});

describe("pickTheme", () => {
  it("survives a reload", () => {
    pickTheme("dark");
    delete document.documentElement.dataset.theme;
    runThemeScript();
    expect(currentTheme()).toBe("dark");
  });
});
