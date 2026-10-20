import { test, expect, type Page } from "@playwright/test";
import { REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";

const album = capturedAlbum(REVIEWED[0].spotifyID);
const artist = album.artists[0];

// Stands in for the Umami script, which does not load on the e2e domain
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const events: unknown[][] = [];
    Object.assign(window, { umamiEvents: events, umami: { track: (...args: unknown[]) => events.push(args) } });
  });
});

const trackedEvents = (page: Page) => page.evaluate(() => (window as unknown as { umamiEvents: unknown[][] }).umamiEvents);

test("opening a home search result with the keyboard sends the text typed and the kind of result", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search albums and artists" });

  // Hydration wires up the box, so the text is typed until it stays
  await expect(async () => {
    await search.fill(album.name);
    await expect(page.getByRole("option").first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await search.press("Enter");

  await expect(page).toHaveURL(/\/(albums|artists)\//);
  expect(await trackedEvents(page)).toEqual([["home-search", { query: album.name, result: expect.stringMatching(/^(album|artist)$/) }]]);
});

test("opening a home search result with a click sends the kind of result", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search albums and artists" });

  await expect(async () => {
    await search.fill(album.name);
    await expect(page.getByRole("option", { name: new RegExp(album.name) }).first()).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await page
    .getByRole("option", { name: new RegExp(album.name) })
    .first()
    .click();

  await expect(page).toHaveURL(/\/(albums|artists)\//);
  expect(await trackedEvents(page)).toHaveLength(1);
});

test("a search that finds nothing sends the text typed once, after it stops changing", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search albums and artists" });

  await expect(async () => {
    await search.fill("zzzzqqqq");
    await expect(page.getByText("Nothing called that yet.")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });

  await expect.poll(() => trackedEvents(page), { timeout: 5000 }).toEqual([["home-search", { query: "zzzzqqqq", result: "none" }]]);
  await page.waitForTimeout(2000);
  expect(await trackedEvents(page)).toHaveLength(1);
});

test("typing on past a search that found nothing does not send it", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Search albums and artists" });

  await expect(async () => {
    await search.fill("zzzzqqqq");
    await expect(page.getByText("Nothing called that yet.")).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 15000 });
  await search.fill(album.name);
  await page.waitForTimeout(2000);

  expect(await trackedEvents(page)).toEqual([]);
});

test("a page that does not exist sends not-found with its path", async ({ page }) => {
  await page.goto("/no-such-page");

  await expect(page.getByRole("heading", { name: "That page doesn't exist." })).toBeVisible();
  // The dev server runs effects twice, so the event can arrive twice here
  await expect.poll(() => trackedEvents(page)).toContainEqual(["not-found", { path: "/no-such-page", kind: "page" }]);
});

test("an album that has not been reviewed sends not-found as an album", async ({ page }) => {
  await page.goto("/albums/not-a-reviewed-album");

  await expect(page.getByRole("heading", { name: "Album not found" })).toBeVisible();
  await expect.poll(() => trackedEvents(page)).toContainEqual(["not-found", { path: "/albums/not-a-reviewed-album", kind: "album" }]);
});

test("switching the theme sends the theme that is now showing", async ({ page }) => {
  await page.goto("/");

  // Hydration wires up the button, so the click is repeated until it takes
  await expect(async () => {
    await page.getByRole("button", { name: "Dark mode" }).click();
    expect((await trackedEvents(page)).length).toBeGreaterThan(0);
  }).toPass({ timeout: 15000 });

  const shownTheme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(await trackedEvents(page)).toEqual([["theme-toggle", { theme: shownTheme }]]);
});

test("opening how scores work sends one event, and closing it sends none", async ({ page }) => {
  await page.goto(`/artists/${artist.spotifyID}`);
  const trigger = page.getByRole("button", { name: "How scores work" });

  await expect(async () => {
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();

  expect(await trackedEvents(page)).toEqual([["score-explainer-open"]]);
});

test("showing all of an artist's rated tracks sends one event", async ({ page }) => {
  await page.goto(`/artists/${artist.spotifyID}`);

  await expect(async () => {
    await page.getByRole("button", { name: /^Show the other \d+ tracks$/ }).click({ timeout: 1000 });
    await expect(page.getByRole("button", { name: /^Show the other \d+ tracks$/ })).toBeHidden({ timeout: 1000 });
  }).toPass({ timeout: 15000 });

  expect(await trackedEvents(page)).toEqual([["tracks-show-all"]]);
});
