import { test, expect } from "@playwright/test";
import { REVIEWED, capturedAlbum, ratingFor } from "../../../api/src/db/fixtures/fixtures";
import { rateTracks, shownScoreOf } from "../helpers";

// This spec owns the second reviewed album. No other spec touches it, so it
// arrives here exactly as the seeder wrote it.
const review = REVIEWED[1];
const album = capturedAlbum(review.spotifyID);

// Re-rate every track three steps further along the rating pattern
const newRatings = album.tracks.map((track, index) => ratingFor(index, review.offset + 3));
const newScore = shownScoreOf(
  album.tracks.map((track, index) => ({
    spotifyID: track.spotifyID,
    name: track.name,
    artistName: track.artistName,
    artistSpotifyID: track.artistSpotifyID,
    duration: track.duration,
    features: track.features,
    rating: newRatings[index],
  }))
);

test("editing a review recalculates the score", async ({ page }) => {
  await page.goto(`/albums/${review.spotifyID}/edit`);
  await expect(page.getByRole("heading", { name: album.name, level: 1 })).toBeVisible();

  await rateTracks(page, newRatings);
  await page.getByRole("button", { name: "Save review" }).click();

  // Saving opens the album page with the recalculated score. Same allowance as
  // the create spec, saves can queue behind another spec's transaction
  await expect(page).toHaveURL(new RegExp(`/albums/${review.spotifyID}$`), { timeout: 15000 });
  await expect(page.getByText("Review saved")).toBeVisible();
  await expect(page.getByText(String(newScore), { exact: true }).first()).toBeVisible();
});
