import { test, expect } from "@playwright/test";
import { BOOKMARKED_IDS, REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";

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
  await page.getByTestId("admin-dropdown-desktop").getByTestId("admin-dropdown-button").click();
  await page.getByRole("button", { name: "Delete Album" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  // Deleting navigates back to the library, where the album is gone
  await expect(page).toHaveURL(/\/albums$/);
  await expect(page.getByTestId("album-card").filter({ hasText: targetAlbum.name })).toHaveCount(0);

  // The artist had no other reviews, so they leave the leaderboard too
  await page.goto("/artists");
  await expect(page.getByTestId("artist-card").first()).toBeVisible();
  for (const artist of targetAlbum.artists) {
    await expect(page.getByTestId("artist-card").filter({ hasText: artist.name })).toHaveCount(0);
  }
});
