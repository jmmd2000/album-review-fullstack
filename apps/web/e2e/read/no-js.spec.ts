import { test, expect } from "@playwright/test";
import { REVIEWED, REVIEW_CONTENT, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { cardFor, shownScoreFor } from "../helpers";

// The whole file runs with javascript disabled, so anything visible here had
// to come from the server. This is the ticket's acceptance check, kept
// permanent so a future change can't quietly break the crawler view.
test.use({ javaScriptEnabled: false });

const reviewedAlbums = REVIEWED.map(review => capturedAlbum(review.spotifyID));
const albumCount = REVIEWED.length;
const artistCount = new Set(reviewedAlbums.flatMap(album => album.artists.map(artist => artist.spotifyID))).size;
const primaryArtist = reviewedAlbums[0].artists[0];

test("the home page shows the name, real totals and covers", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "James Reviews Music", level: 1 })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Search albums and artists" })).toHaveAttribute("placeholder", `Search ${albumCount} albums and ${artistCount} artists`);
  await expect(page.getByRole("link", { name: `${reviewedAlbums[0].name} by ${primaryArtist.name}` }).first()).toBeVisible();
});

test("the album library shows every review, actually visible", async ({ page }) => {
  await page.goto("/albums");

  for (const album of reviewedAlbums) {
    await expect(cardFor(page, album.name)).toBeVisible();
  }

  // Playwright counts opacity zero as visible, so pin the computed style too.
  // Entrance animations once left the server HTML fully transparent
  const cardOpacity = await cardFor(page, reviewedAlbums[0].name)
    .getByRole("link")
    .evaluate(element => getComputedStyle(element).opacity);
  expect(cardOpacity).toBe("1");
});

test("an album page shows the score, review and tracks", async ({ page }) => {
  const review = REVIEWED[0];
  const album = capturedAlbum(review.spotifyID);

  await page.goto(`/albums/${review.spotifyID}`);

  await expect(page.getByRole("heading", { name: album.name, level: 1 })).toBeVisible();
  await expect(page.getByText(String(shownScoreFor(review)), { exact: true }).first()).toBeVisible();
  await expect(page.getByText(REVIEW_CONTENT).first()).toBeVisible();
  await expect(page.getByText(album.tracks[0].name, { exact: true }).first()).toBeVisible();
});

test("the artist leaderboard and an artist page show their content", async ({ page }) => {
  await page.goto("/artists");
  await expect(cardFor(page, primaryArtist.name)).toBeVisible();

  await page.goto(`/artists/${primaryArtist.spotifyID}`);
  await expect(page.getByRole("heading", { name: primaryArtist.name, level: 1 })).toBeVisible();
  await expect(page.getByText(reviewedAlbums[0].name).first()).toBeVisible();
});

test("the stats page shows the seeded totals", async ({ page }) => {
  await page.goto("/stats");

  await expect(page.getByText(`${albumCount} albums from ${artistCount} artists`)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Highs and lows" })).toBeVisible();
});

test("an admin page still serves the navbar shell", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByRole("link", { name: "Stats" }).first()).toBeVisible();
});

test("an album page serves its unfurl tags", async ({ page }) => {
  const review = REVIEWED[0];
  const album = capturedAlbum(review.spotifyID);

  await page.goto(`/albums/${review.spotifyID}`);

  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
  expect(ogTitle).toContain(album.name);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /i\.scdn\.co/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary");
});

test("an artist page and the home page serve their unfurl tags", async ({ page }) => {
  await page.goto(`/artists/${primaryArtist.spotifyID}`);
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
  expect(ogTitle).toContain(primaryArtist.name);

  await page.goto("/");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /album review blog/);
});
