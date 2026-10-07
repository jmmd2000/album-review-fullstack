import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { expect, type Locator, type Page } from "@playwright/test";
import { calculateAlbumScore } from "../../../packages/shared/src/helpers/calculateAlbumScore";
import { capturedAlbum, ratingFor, type ReviewFixture } from "../../api/src/db/fixtures/fixtures";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env") });

/** Opens the lock menu in the nav, retrying until hydration has wired up the button. */
export async function openAdminMenu(page: Page, expected: Locator): Promise<void> {
  await expect(async () => {
    await page.getByRole("button", { name: "Admin" }).click();
    await expect(expected).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
}

/** Logs in through the lock menu and waits for the admin links to appear. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/");
  await openAdminMenu(page, page.getByLabel("Password"));
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("link", { name: "Review an album" })).toBeVisible();
}

/** The album or artist card whose link names the given album or artist. */
export const cardFor = (page: Page, name: string): Locator =>
  page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ has: page.getByRole("link", { name }) });

/** Every card link in the page's grid, in order, without the separator tiles. */
export const cardLinks = (page: Page): Locator => page.getByRole("main").getByRole("listitem").getByRole("link");

/**
 * Rates every track in the review form, by its place in the list.
 * Pressing a track's current rating clears it, so a rating that's already set is left alone.
 */
export async function rateTracks(page: Page, ratings: number[]): Promise<void> {
  const rows = page.getByRole("list", { name: "Rate each track" }).getByRole("listitem");
  await expect(rows).toHaveCount(ratings.length);
  for (const [index, rating] of ratings.entries()) {
    const step = rows.nth(index).getByRole("button", { name: `${rating} out of 10`, exact: true });
    if ((await step.getAttribute("aria-pressed")) !== "true") await step.click();
    await expect(step).toHaveAttribute("aria-pressed", "true");
  }
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

/** The score the site shows for a list of rated tracks. Scores are rounded up for display. */
export const shownScoreOf = (tracks: Parameters<typeof calculateAlbumScore>[0]): number => Math.ceil(calculateAlbumScore(tracks).finalScore);

/** The score the site shows for a seeded review. */
export const shownScoreFor = (review: ReviewFixture): number => shownScoreOf(ratedTracksFor(review));
