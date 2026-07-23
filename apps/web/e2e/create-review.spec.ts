import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { BOOKMARKED_IDS, capturedAlbum, ratingFor } from "../../api/src/db/fixtures/fixtures";
import { calculateAlbumScore } from "../../../packages/shared/src/helpers/calculateAlbumScore";
import { buildSpotifyAlbumResponse } from "./spotifyAlbumMock";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

const REVIEW_TEXT = "great album, I enjoyed it";

// channel ORANGE, seeded as a bookmark and never reviewed
const album = capturedAlbum(BOOKMARKED_IDS[0]);

// The same rating pattern the seeder uses, so the score this review will get
// is known before the test runs
const ratings = album.tracks.map((track, index) => ratingFor(index, 0));
const { finalScore } = calculateAlbumScore(
  album.tracks.map((track, index) => ({
    spotifyID: track.spotifyID,
    name: track.name,
    artistName: track.artistName,
    artistSpotifyID: track.artistSpotifyID,
    duration: track.duration,
    features: track.features,
    rating: ratings[index],
  }))
);

test("create album review flow", async ({ page }) => {
  // The create page fetches the album through the api's spotify proxy. Answer
  // that one call from the fixture so the run never touches spotify.
  await page.route(`**/api/spotify/albums/${album.spotifyID}`, route => route.fulfill({ json: buildSpotifyAlbumResponse(album) }));

  // Log in through the admin dropdown
  await page.goto("/");
  await page.getByTestId("admin-dropdown-desktop").getByTestId("admin-dropdown-button").click();
  await page.getByTestId("admin-password-input").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "Search" }).first()).toBeVisible();

  // The seeded bookmark is the unreviewed entry point
  await page.goto("/bookmarks");
  const bookmarkCard = page.getByTestId("album-card").filter({ hasText: album.name });
  await expect(bookmarkCard).toBeVisible();
  await bookmarkCard.click();

  await expect(page).toHaveURL(new RegExp(`/albums/${album.spotifyID}/create`));
  await expect(page.getByTestId("album-review-form")).toBeVisible();

  // Fill the review
  await page.getByPlaceholder("Best song...").fill(album.tracks[0].name);
  await page.getByPlaceholder("Worst song...").fill(album.tracks[1].name);
  await page.getByTestId("review-content-textarea").fill(REVIEW_TEXT);

  await page.getByRole("button", { name: /add genre/i }).click();
  await page.getByPlaceholder("Enter genre").fill("r&b");
  await page.getByRole("button", { name: /add genre/i }).click();
  await page.getByPlaceholder("Enter genre").nth(1).fill("soul");

  await page.getByTestId("color-picker-button").first().click();
  await page.locator("#aasToggle").check();

  // Deterministic ratings on every track
  const ratingSelects = page.getByTestId("track-rating-select");
  await expect(ratingSelects).toHaveCount(album.tracks.length);
  for (let index = 0; index < album.tracks.length; index++) {
    await ratingSelects.nth(index).selectOption(String(ratings[index]));
  }

  await page.getByTestId("album-review-form").getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Review submitted successfully!")).toBeVisible();

  // The album page shows the review with the score we predicted
  await page.goto("/albums");
  await page.getByTestId("search-input").fill(album.name);
  const reviewedCard = page.getByTestId("album-card").filter({ hasText: album.name });
  await expect(reviewedCard).toBeVisible();
  await reviewedCard.click();

  await expect(page).toHaveURL(new RegExp(`/albums/${album.spotifyID}$`));
  await expect(page.getByText(REVIEW_TEXT)).toBeVisible();
  await expect(page.getByText(String(finalScore)).first()).toBeVisible();

  // Through to the artist page
  await page.locator("a[href*='/artists/']").first().click();
  await expect(page).toHaveURL(/\/artists\//);
  await expect(page.getByText(album.artists[0].name).first()).toBeVisible();

  // And the artist appears in the leaderboard list
  await page.goto("/artists");
  await page.getByTestId("search-input").fill(album.artists[0].name);
  const artistCard = page.getByTestId("artist-card").filter({ hasText: album.artists[0].name });
  await expect(artistCard).toBeVisible();
  await artistCard.click();
  await expect(page).toHaveURL(new RegExp(`/artists/${album.artists[0].spotifyID}`));
});
