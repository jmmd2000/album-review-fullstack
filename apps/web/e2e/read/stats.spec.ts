import { test, expect, type Page } from "@playwright/test";
import { REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { shownScoreFor } from "../helpers";

const reviewedAlbums = REVIEWED.map(review => capturedAlbum(review.spotifyID));
const albumCount = REVIEWED.length;
const trackCount = reviewedAlbums.reduce((sum, album) => sum + album.tracks.length, 0);
const artistCount = new Set(reviewedAlbums.flatMap(album => album.artists.map(artist => artist.spotifyID))).size;
const genreCount = new Set(REVIEWED.flatMap(review => review.genres)).size;

/** The ranked list under a highs and lows heading, such as "Best albums" */
const highsList = (page: Page, title: string) => page.getByRole("heading", { name: title, level: 3 }).locator("xpath=following-sibling::ol[1]");

test("the summary gives the seeded totals", async ({ page }) => {
  await page.goto("/stats");

  await expect(page.getByText(`${albumCount} albums from ${artistCount} artists across ${genreCount} genres, with ${trackCount} tracks rated.`)).toBeVisible();
  await expect(page.getByText(`All ${albumCount} albums, averaging`)).toBeVisible();
});

test("the best and worst albums reflect the seeded scores", async ({ page }) => {
  const scored = REVIEWED.map(review => ({ name: capturedAlbum(review.spotifyID).name, score: shownScoreFor(review) }));
  const topScore = Math.max(...scored.map(album => album.score));
  const bottomScore = Math.min(...scored.map(album => album.score));
  const topNames = scored.filter(album => album.score === topScore).map(album => album.name);
  const bottomNames = scored.filter(album => album.score === bottomScore).map(album => album.name);

  await page.goto("/stats");

  const best = await highsList(page, "Best albums").getByRole("link").first().textContent();
  expect(topNames.some(name => best?.includes(name))).toBe(true);
  const worst = await highsList(page, "Worst albums").getByRole("link").first().textContent();
  expect(bottomNames.some(name => worst?.includes(name))).toBe(true);
});

test("every scored album is a dot on the chart", async ({ page }) => {
  await page.goto("/stats");

  for (const album of reviewedAlbums) {
    // Each dot's label is "<album> by <artist>, <score>"
    await expect(page.getByRole("link", { name: `${album.name} by ` })).toBeAttached();
  }
});
