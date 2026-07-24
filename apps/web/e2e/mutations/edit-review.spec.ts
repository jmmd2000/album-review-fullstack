import { test, expect } from "@playwright/test";
import { REVIEWED, capturedAlbum, ratingFor } from "../../../api/src/db/fixtures/fixtures";
import { calculateAlbumScore } from "../../../../packages/shared/src/helpers/calculateAlbumScore";

// This spec owns the second reviewed album. No other spec touches it, so it
// arrives here exactly as the seeder wrote it.
const review = REVIEWED[1];
const album = capturedAlbum(review.spotifyID);

// Re-rate every track three steps further along the rating pattern. The score
// only depends on the set of ratings, so the form's track order doesn't matter.
const newRatings = album.tracks.map((track, index) => ratingFor(index, review.offset + 3));
const { finalScore: newScore } = calculateAlbumScore(
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
  await expect(page.getByTestId("album-review-form")).toBeVisible();

  const ratingSelects = page.getByTestId("track-rating-select");
  await expect(ratingSelects).toHaveCount(album.tracks.length);
  for (let index = 0; index < album.tracks.length; index++) {
    await ratingSelects.nth(index).selectOption(String(newRatings[index]));
  }

  await page.getByTestId("album-review-form").getByRole("button", { name: "Submit" }).click();
  // Same allowance as the create spec, submits can queue behind another
  // spec's leaderboard-updating transaction under parallel mutations
  await expect(page.getByText("Review submitted successfully!")).toBeVisible({ timeout: 15000 });

  // The album page now shows the recalculated score
  await page.goto(`/albums/${review.spotifyID}`);
  await expect(page.getByText(String(newScore)).first()).toBeVisible();
});
