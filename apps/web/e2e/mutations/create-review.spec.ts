import { test, expect } from "@playwright/test";
import { BOOKMARKED_IDS, capturedAlbum, ratingFor } from "../../../api/src/db/fixtures/fixtures";
import { buildSpotifyAlbumResponse } from "../spotifyAlbumMock";
import { cardFor, rateTracks, shownScoreOf } from "../helpers";

const REVIEW_TEXT = "great album, I enjoyed it";

// channel ORANGE, seeded as a bookmark and never reviewed
const album = capturedAlbum(BOOKMARKED_IDS[0]);
const artist = album.artists[0];

// The same rating pattern the seeder uses, so the score this review will get
// is known before the test runs
const ratings = album.tracks.map((track, index) => ratingFor(index, 0));
const score = shownScoreOf(
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
  // The client adds a "?" to the URL, so this matches the path and not the whole URL
  await page.route(
    url => url.pathname === `/api/spotify/albums/${album.spotifyID}`,
    route => route.fulfill({ json: buildSpotifyAlbumResponse(album) })
  );

  // The seeded bookmark is the unreviewed entry point
  await page.goto("/bookmarks");
  await cardFor(page, album.name).getByRole("link").click();

  await expect(page).toHaveURL(new RegExp(`/albums/${album.spotifyID}/create`));
  await expect(page.getByRole("heading", { name: album.name, level: 1 })).toBeVisible();

  await rateTracks(page, ratings);
  const trackRows = page.getByRole("list", { name: "Rate each track" }).getByRole("listitem");
  await trackRows.nth(0).getByRole("button", { name: "Best" }).click();
  await trackRows.nth(1).getByRole("button", { name: "Worst" }).click();

  await page.getByLabel("Review", { exact: true }).fill(REVIEW_TEXT);

  const genre = page.getByLabel("Add a genre");
  await genre.fill("r&b");
  await genre.press("Enter");
  await genre.fill("soul");
  await genre.press("Enter");
  await expect(page.getByRole("button", { name: "Remove soul" })).toBeVisible();

  await page.getByRole("button", { name: "Add a colour" }).click();
  await expect(page.getByRole("checkbox", { name: "Counts towards the artist's score" })).toBeChecked();

  await page.getByRole("button", { name: "Save review" }).click();

  // Saving opens the album page. Under parallel mutations the save can queue
  // behind another spec's leaderboard-updating transaction, so give it room
  await expect(page).toHaveURL(new RegExp(`/albums/${album.spotifyID}$`), { timeout: 15000 });
  await expect(page.getByText("Review saved")).toBeVisible();
  await expect(page.getByText(REVIEW_TEXT)).toBeVisible();
  await expect(page.getByText(String(score), { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "soul", exact: true })).toBeVisible();

  const tracklist = page.getByRole("region", { name: `${album.tracks.length} tracks` }).getByRole("listitem");
  await expect(tracklist.nth(0)).toContainText("Best");
  await expect(tracklist.nth(1)).toContainText("Worst");

  // Through to the artist page
  await page.getByRole("link", { name: artist.name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/artists/${artist.spotifyID}`));
  await expect(page.getByRole("heading", { name: artist.name, level: 1 })).toBeVisible();

  // And the artist appears in the leaderboard
  await page.goto("/artists");
  const search = page.getByRole("searchbox", { name: "Search artists" });
  await search.fill(artist.name);
  await search.press("Enter");
  await cardFor(page, artist.name).getByRole("link").click();
  await expect(page).toHaveURL(new RegExp(`/artists/${artist.spotifyID}`));
});
