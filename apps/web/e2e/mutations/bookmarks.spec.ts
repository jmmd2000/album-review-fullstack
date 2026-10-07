import { test, expect } from "@playwright/test";
import { BOOKMARKED_IDS, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { cardFor } from "../helpers";

// This spec owns the second seeded bookmark. The create spec owns the first.
const reserved = capturedAlbum(BOOKMARKED_IDS[1]);

// The album card expects the three image sizes spotify always sends
const fakeAlbum = {
  spotifyID: "e2e-fake-album",
  name: "E2E Fixture Album",
  artistName: "E2E Fixture Artist",
  artistSpotifyID: "e2e-fake-artist",
  releaseYear: 2024,
  imageURLs: [
    { url: "https://example.com/cover-640.jpg", height: 640, width: 640 },
    { url: "https://example.com/cover-300.jpg", height: 300, width: 300 },
    { url: "https://example.com/cover-64.jpg", height: 64, width: 64 },
  ],
  finalScore: null,
  bookmarked: false,
  affectsArtistScore: true,
};

test("a seeded bookmark can be removed", async ({ page }) => {
  await page.goto("/bookmarks");
  const button = cardFor(page, reserved.name).getByRole("button", { name: `Bookmark ${reserved.name}` });
  await expect(button).toHaveAttribute("aria-pressed", "true");

  await Promise.all([page.waitForResponse(response => response.url().includes("/remove") && response.ok()), button.click()]);

  // Reload rather than trusting the cache, the list must really have lost it
  await page.reload();
  await expect(page.getByRole("heading", { name: "Bookmarks", level: 1 })).toBeVisible();
  await expect(cardFor(page, reserved.name)).toHaveCount(0);
});

test("an album can be bookmarked from search", async ({ page }) => {
  // The search page talks to spotify through the api proxy, answer that one
  // call from the fixture so the run never touches spotify
  await page.route("**/api/spotify/albums/search**", route => route.fulfill({ json: [fakeAlbum] }));

  await page.goto("/search");
  const search = page.getByRole("searchbox", { name: "Search Spotify albums" });
  await search.fill(fakeAlbum.name);
  await search.press("Enter");

  const button = cardFor(page, fakeAlbum.name).getByRole("button", { name: `Bookmark ${fakeAlbum.name}` });
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await Promise.all([page.waitForResponse(response => response.url().includes("/add") && response.ok()), button.click()]);
  await expect(button).toHaveAttribute("aria-pressed", "true");

  await page.goto("/bookmarks");
  await expect(cardFor(page, fakeAlbum.name)).toBeVisible();
});
