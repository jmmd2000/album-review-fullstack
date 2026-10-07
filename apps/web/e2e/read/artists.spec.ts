import { test, expect } from "@playwright/test";
import { REVIEWED, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { cardFor, cardLinks } from "../helpers";

const allArtists = new Map<string, string>();
for (const review of REVIEWED) {
  for (const artist of capturedAlbum(review.spotifyID).artists) {
    allArtists.set(artist.spotifyID, artist.name);
  }
}

test("the leaderboard lists every seeded artist, best first", async ({ page }) => {
  await page.goto("/artists");

  for (const name of allArtists.values()) {
    await expect(cardFor(page, name)).toBeVisible();
  }
  await expect(cardLinks(page).first()).toContainText("#1");
});

test("a score-excluded artist shows as unrated", async ({ page }) => {
  const review = REVIEWED.find(candidate => candidate.scoreExcludedArtistIndexes?.length);
  if (!review?.scoreExcludedArtistIndexes) throw new Error("No seeded review leaves an artist out of the score");
  const excluded = capturedAlbum(review.spotifyID).artists[review.scoreExcludedArtistIndexes[0]];

  await page.goto("/artists");

  // An unrated artist has no rank, and its score chip is the Unrated dash
  const card = cardFor(page, excluded.name);
  await expect(card.getByTitle("Unrated")).toHaveText("-");
  await expect(card).not.toContainText("#");
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
  const artistWithAlbums = [...byPrimary.entries()].find(([, entry]) => entry.albums.length > 1);
  if (!artistWithAlbums) throw new Error("No seeded artist has more than one album");
  const [artistID, artist] = artistWithAlbums;

  await page.goto(`/artists/${artistID}`);

  await expect(page.getByRole("heading", { name: artist.name, level: 1 })).toBeVisible();
  for (const albumName of artist.albums) {
    await expect(page.getByText(albumName).first()).toBeVisible();
  }
});
