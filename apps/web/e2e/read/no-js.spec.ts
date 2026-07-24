import { test, expect, type Page } from "@playwright/test";
import { REVIEWED, REVIEW_CONTENT, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { finalScoreFor } from "../helpers";

// The whole file runs with javascript disabled, so anything visible here had
// to come from the server. This is the ticket's acceptance check, kept
// permanent so a future change can't quietly break the crawler view.
test.use({ javaScriptEnabled: false });

const reviewedAlbums = REVIEWED.map(review => capturedAlbum(review.spotifyID));
const albumCount = REVIEWED.length;
const primaryArtist = reviewedAlbums[0].artists[0];

// The stat box renders the value in the paragraph right before its label
const statValue = (page: Page, label: string) =>
  page
    .locator("p", { hasText: new RegExp(`^${label}$`) })
    .locator("xpath=preceding-sibling::p[1]")
    .first();

test("the home page shows the intro and real totals", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("This is my album review blog").first()).toBeVisible();
  await expect(statValue(page, "Albums")).toHaveText(String(albumCount));
});

test("the album library shows every review, actually visible", async ({ page }) => {
  await page.goto("/albums");

  for (const album of reviewedAlbums) {
    await expect(page.getByTestId("album-card").filter({ hasText: album.name })).toBeVisible();
  }

  // Playwright counts opacity zero as visible, so pin the computed style too.
  // Entrance animations once left the server HTML fully transparent
  const cardOpacity = await page
    .locator("[data-testid='album-card'] > div")
    .first()
    .evaluate(element => getComputedStyle(element).opacity);
  expect(cardOpacity).toBe("1");
});

test("an album page shows the score, review and tracks", async ({ page }) => {
  const review = REVIEWED[0];
  const album = capturedAlbum(review.spotifyID);

  await page.goto(`/albums/${review.spotifyID}`);

  await expect(page.getByText(album.name).first()).toBeVisible();
  await expect(page.getByText(String(finalScoreFor(review))).first()).toBeVisible();
  await expect(page.getByText(REVIEW_CONTENT).first()).toBeVisible();
  await expect(page.getByText(album.tracks[0].name, { exact: true }).first()).toBeVisible();
});

test("the artist leaderboard and an artist page show their content", async ({ page }) => {
  await page.goto("/artists");
  await expect(page.getByTestId("artist-card").filter({ hasText: primaryArtist.name }).first()).toBeVisible();

  await page.goto(`/artists/${primaryArtist.spotifyID}`);
  await expect(page.getByText(primaryArtist.name).first()).toBeVisible();
  await expect(page.getByText(reviewedAlbums[0].name).first()).toBeVisible();
});

test("the stats page shows the seeded totals", async ({ page }) => {
  await page.goto("/stats");

  await expect(statValue(page, "Albums")).toHaveText(String(albumCount));
  await expect(page.getByText("Favourite Genre").first()).toBeVisible();
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
