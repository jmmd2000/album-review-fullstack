import { test, expect } from "@playwright/test";
import { BOOKMARKED_IDS, REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { cardFor } from "../helpers";

// Count how often each artist appears across the whole fixture set, bookmarks
// included, then pick an album whose artists appear nowhere else. Deleting it
// must remove those artists entirely.
const artistAlbumCounts = new Map<string, number>();
for (const spotifyID of [...REVIEWED.map(review => review.spotifyID), ...BOOKMARKED_IDS]) {
  for (const artist of capturedAlbum(spotifyID).artists) {
    artistAlbumCounts.set(artist.spotifyID, (artistAlbumCounts.get(artist.spotifyID) ?? 0) + 1);
  }
}
const target = REVIEWED.find(review => capturedAlbum(review.spotifyID).artists.every(artist => artistAlbumCounts.get(artist.spotifyID) === 1))!;
const targetAlbum = capturedAlbum(target.spotifyID);

test("deleting a review removes the album and its orphaned artist", async ({ page }) => {
  await page.goto(`/albums/${target.spotifyID}`);
  // The album page arrives server rendered, so retry the click until
  // hydration has wired up the Delete button
  await expect(async () => {
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("alertdialog", { name: "Delete this review?" })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await page.getByRole("button", { name: "Delete review" }).click();

  // Deleting opens the library, where the album is gone. The delete can
  // queue behind another spec's transaction, hence the allowance
  await expect(page).toHaveURL(/\/albums$/, { timeout: 15000 });
  await expect(page.getByText("Review deleted")).toBeVisible();
  await expect(cardFor(page, targetAlbum.name)).toHaveCount(0);

  // The artist had no other reviews, so they leave the leaderboard too
  await page.goto("/artists");
  await expect(page.getByRole("heading", { name: "Artists", level: 1 })).toBeVisible();
  for (const artist of targetAlbum.artists) {
    await expect(cardFor(page, artist.name)).toHaveCount(0);
  }
});
