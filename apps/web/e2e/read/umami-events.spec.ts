import { test, expect, type Page } from "@playwright/test";
import { REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";

const album = capturedAlbum(REVIEWED[0].spotifyID);

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
