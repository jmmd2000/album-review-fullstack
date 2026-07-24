import { test, expect } from "@playwright/test";
import { BOOKMARKED_IDS, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";

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
  affectsArtistScore: true,
};

test("a seeded bookmark can be removed", async ({ page }) => {
  await page.goto("/bookmarks");
  const card = page.getByTestId("album-card").filter({ hasText: reserved.name });
  await expect(card).toBeVisible();

  // The card's entrance animation can drift a coordinate click onto the card
  // link, so dispatch the click straight to the button, and wait for the
  // remove request to land before reloading
  await Promise.all([page.waitForResponse(response => response.url().includes("/remove") && response.ok()), card.getByTestId("bookmark-button").dispatchEvent("click")]);

  // Reload rather than trusting the cache, the list must really have lost it
  await page.reload();
  await expect(page.getByTestId("album-card").first()).toBeVisible();
  await expect(page.getByTestId("album-card").filter({ hasText: reserved.name })).toHaveCount(0);
});

test("an album can be bookmarked from search", async ({ page }) => {
  // The search page talks to spotify through the api proxy, answer that one
  // call from the fixture so the run never touches spotify
  await page.route("**/api/spotify/albums/search**", route => route.fulfill({ json: [fakeAlbum] }));

  await page.goto("/search");
  await page.getByTestId("search-input").fill(fakeAlbum.name);
  await page.getByTestId("search-input").press("Enter");

  const result = page.getByTestId("album-card").filter({ hasText: fakeAlbum.name });
  await expect(result).toBeVisible();

  await Promise.all([page.waitForResponse(response => response.url().includes("/add") && response.ok()), result.getByTestId("bookmark-button").dispatchEvent("click")]);

  await page.goto("/bookmarks");
  await expect(page.getByTestId("album-card").filter({ hasText: fakeAlbum.name })).toBeVisible();
});
