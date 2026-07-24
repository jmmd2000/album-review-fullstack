import { test, expect, type Page } from "@playwright/test";
import { REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { finalScoreFor } from "../helpers";

const reviewedAlbums = REVIEWED.map(review => capturedAlbum(review.spotifyID));
const albumCount = REVIEWED.length;
const trackCount = reviewedAlbums.reduce((sum, album) => sum + album.tracks.length, 0);
const artistCount = new Set(reviewedAlbums.flatMap(album => album.artists.map(artist => artist.spotifyID))).size;
const genreCount = new Set(REVIEWED.flatMap(review => review.genres)).size;

// The stat box renders the value in the paragraph right before its label
const statValue = (page: Page, label: string) =>
  page
    .locator("p", { hasText: new RegExp(`^${label}$`) })
    .locator("xpath=preceding-sibling::p[1]")
    .first();

test("the stat boxes show the seeded totals", async ({ page }) => {
  await page.goto("/stats");

  await expect(statValue(page, "Albums")).toHaveText(String(albumCount));
  await expect(statValue(page, "Artists")).toHaveText(String(artistCount));
  await expect(statValue(page, "Tracks")).toHaveText(String(trackCount));
  await expect(statValue(page, "Genres")).toHaveText(String(genreCount));
});

test("the favourites reflect the seeded scores", async ({ page }) => {
  const scored = REVIEWED.map(review => ({ name: capturedAlbum(review.spotifyID).name, score: finalScoreFor(review) }));
  const topScore = Math.max(...scored.map(album => album.score));
  const bottomScore = Math.min(...scored.map(album => album.score));
  const topNames = scored.filter(album => album.score === topScore).map(album => album.name);
  const bottomNames = scored.filter(album => album.score === bottomScore).map(album => album.name);

  await page.goto("/stats");
  await expect(page.getByText("Favourite Genre").first()).toBeVisible();

  const content = await page.textContent("body");
  expect(topNames.some(name => content?.includes(name))).toBe(true);
  expect(bottomNames.some(name => content?.includes(name))).toBe(true);
});
