import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { expect, type Page } from "@playwright/test";
import { calculateAlbumScore } from "../../../packages/shared/src/helpers/calculateAlbumScore";
import { capturedAlbum, ratingFor, type ReviewFixture } from "../../api/src/db/fixtures/fixtures";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

/** Logs in through the admin dropdown and waits for the admin nav to appear. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/");
  // The navbar arrives server rendered, so the button is visible before
  // hydration wires up its handler. Retry the click until the dropdown opens
  await expect(async () => {
    await page.getByTestId("admin-dropdown-desktop").getByTestId("admin-dropdown-button").click();
    await expect(page.getByTestId("admin-password-input")).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await page.getByTestId("admin-password-input").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("link", { name: "Search" }).first()).toBeVisible();
}

/** Rebuilds the rated track list the seeder stored for a review, in seeder order. */
export const ratedTracksFor = (review: ReviewFixture) => {
  const captured = capturedAlbum(review.spotifyID);
  return captured.tracks.map((track, index) => ({
    spotifyID: track.spotifyID,
    name: track.name,
    artistName: track.artistName,
    artistSpotifyID: track.artistSpotifyID,
    duration: track.duration,
    features: track.features,
    rating: ratingFor(index, review.offset),
  }));
};

/** The exact final score the seeder stored for a review. */
export const finalScoreFor = (review: ReviewFixture): number => calculateAlbumScore(ratedTracksFor(review)).finalScore;
