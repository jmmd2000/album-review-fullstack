import { test, expect } from "@playwright/test";
import { REVIEWED, REVIEW_CONTENT, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { cardFor, cardLinks, ratedTracksFor, shownScoreFor } from "../helpers";

const scored = REVIEWED.map(review => ({ name: capturedAlbum(review.spotifyID).name, score: shownScoreFor(review) }));
const topScore = Math.max(...scored.map(album => album.score));
const bottomScore = Math.min(...scored.map(album => album.score));

test("the album library shows every seeded review", async ({ page }) => {
  await page.goto("/albums");

  for (const review of REVIEWED) {
    await expect(cardFor(page, capturedAlbum(review.spotifyID).name)).toBeVisible();
  }
});

test("score sorting from the url orders the grid both ways", async ({ page }) => {
  // Scores can tie, so the first card must be one of the albums on the
  // boundary score rather than a single predicted name
  await page.goto("/albums?orderBy=finalScore&order=desc");
  const topNames = scored.filter(album => album.score === topScore).map(album => album.name);
  const firstDesc = await cardLinks(page).first().textContent();
  expect(topNames.some(name => firstDesc?.includes(name))).toBe(true);
  expect(firstDesc).toContain(String(topScore));

  await page.goto("/albums?orderBy=finalScore&order=asc");
  const bottomNames = scored.filter(album => album.score === bottomScore).map(album => album.name);
  const firstAsc = await cardLinks(page).first().textContent();
  expect(bottomNames.some(name => firstAsc?.includes(name))).toBe(true);
  expect(firstAsc).toContain(String(bottomScore));
});

test("an album page shows the score, review and every track", async ({ page }) => {
  const review = REVIEWED[0];
  const tracks = ratedTracksFor(review);
  const byRating = [...tracks].sort((a, b) => b.rating - a.rating);

  await page.goto(`/albums/${review.spotifyID}`);

  await expect(page.getByText(String(shownScoreFor(review)), { exact: true }).first()).toBeVisible();
  await expect(page.getByText(REVIEW_CONTENT).first()).toBeVisible();

  const trackRows = page.getByRole("region", { name: `${tracks.length} tracks` }).getByRole("listitem");
  await expect(trackRows).toHaveCount(tracks.length);
  for (const track of tracks) {
    await expect(trackRows.filter({ hasText: track.name })).toBeVisible();
  }

  // The best and worst marks mirror the seeder's pick
  await expect(trackRows.filter({ hasText: byRating[0].name })).toContainText("Best");
  await expect(trackRows.filter({ hasText: byRating[byRating.length - 1].name })).toContainText("Worst");
});
