import { test, expect } from "@playwright/test";
import { REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";

const allArtists = new Map<string, string>();
for (const review of REVIEWED) {
  for (const artist of capturedAlbum(review.spotifyID).artists) {
    allArtists.set(artist.spotifyID, artist.name);
  }
}

test("the leaderboard lists every seeded artist, best first", async ({ page }) => {
  await page.goto("/artists");

  for (const name of allArtists.values()) {
    await expect(page.getByTestId("artist-card").filter({ hasText: name }).first()).toBeVisible();
  }
  await expect(page.getByTestId("artist-card").first()).toContainText("#1");
});

test("a score-excluded artist shows as unrated", async ({ page }) => {
  const review = REVIEWED.find(candidate => candidate.scoreExcludedArtistIndexes?.length)!;
  const excluded = capturedAlbum(review.spotifyID).artists[review.scoreExcludedArtistIndexes![0]];

  await page.goto("/artists");

  const card = page.getByTestId("artist-card").filter({ hasText: excluded.name }).first();
  await expect(card).toContainText("UNRATED");
});

test("an artist page lists all their reviewed albums", async ({ page }) => {
  const byPrimary = new Map<string, { name: string; albums: string[] }>();
  for (const review of REVIEWED) {
    const captured = capturedAlbum(review.spotifyID);
    const primary = captured.artists[0];
    const entry = byPrimary.get(primary.spotifyID) ?? { name: primary.name, albums: [] };
    entry.albums.push(captured.name);
    byPrimary.set(primary.spotifyID, entry);
  }
  const [artistID, artist] = [...byPrimary.entries()].find(([, entry]) => entry.albums.length > 1)!;

  await page.goto(`/artists/${artistID}`);

  await expect(page.getByText(artist.name).first()).toBeVisible();
  for (const albumName of artist.albums) {
    await expect(page.getByText(albumName).first()).toBeVisible();
  }
});
