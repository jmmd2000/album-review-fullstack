import { test, expect } from "@playwright/test";
import { BOOKMARKED_IDS, capturedAlbum } from "../../../api/src/db/fixtures/fixtures";
import { buildSpotifyAlbumResponse } from "../spotifyAlbumMock";

import type { Page } from "@playwright/test";

// A seeded album's tracks under an ID and name no other spec uses, so this spec's drafts can't clash with theirs
const album = { ...capturedAlbum(BOOKMARKED_IDS[0]), spotifyID: "DraftSpecAlbum00000001", name: "Draft Spec Album" };
const createPage = `/albums/${album.spotifyID}/create`;

async function answerAlbumRequest(page: Page, draft: { formValues: unknown; updatedAt: string } | null) {
  // The client adds a "?" to the URL, so this matches the path and not the whole URL
  await page.route(
    url => url.pathname === `/api/spotify/albums/${album.spotifyID}`,
    route => route.fulfill({ json: buildSpotifyAlbumResponse(album, draft) })
  );
}

test.afterEach(async ({ page }) => {
  await page.request.delete(`/api/drafts/${album.spotifyID}`);
});

test("opening the form saves nothing, and the first change saves a draft that shows above the bookmarks", async ({ page }) => {
  await answerAlbumRequest(page, null);
  const draftSaves: string[] = [];
  page.on("request", request => {
    if (request.method() === "PUT" && request.url().includes(`/api/drafts/${album.spotifyID}`)) draftSaves.push(request.url());
  });

  await page.goto(createPage);
  await expect(page.getByRole("heading", { name: album.name, level: 1 })).toBeVisible();
  await page.waitForTimeout(1500);
  expect(draftSaves).toHaveLength(0);

  await page.getByRole("list", { name: "Rate each track" }).getByRole("listitem").first().getByRole("button", { name: "7 out of 10", exact: true }).click();

  await expect(page.getByText("Draft saved just now")).toBeVisible();
  expect(draftSaves).toHaveLength(1);

  await page.goto("/bookmarks");
  const draftsRow = page.locator("section", { has: page.getByRole("heading", { name: "Drafts" }) });
  await expect(draftsRow.getByRole("link", { name: album.name })).toHaveAttribute("href", createPage);
});

test("a saved draft loads into the form, and discarding it starts the form again", async ({ page }) => {
  const firstTrack = album.tracks[0];
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  await answerAlbumRequest(page, {
    formValues: {
      tracks: [
        {
          spotifyID: firstTrack.spotifyID,
          artistSpotifyID: firstTrack.artistSpotifyID,
          artistName: firstTrack.artistName,
          name: firstTrack.name,
          duration: firstTrack.duration,
          features: [],
          rating: 8,
          pick: null,
        },
      ],
      reviewContent: "Half written",
      bonus: 0,
      colours: album.colors,
      genres: [],
      affectsArtistScore: true,
      creditedArtistIDs: [album.artists[0].spotifyID],
      scoreArtistIDs: [album.artists[0].spotifyID],
    },
    updatedAt: twoHoursAgo,
  });

  await page.goto(createPage);

  await expect(page.getByText("Loaded your draft, saved 2 hours ago.")).toBeVisible();
  const firstRow = page.getByRole("list", { name: "Rate each track" }).getByRole("listitem").first();
  await expect(firstRow.getByRole("button", { name: "8 out of 10", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Half written")).toBeVisible();

  await page.getByRole("button", { name: "Discard", exact: true }).click();
  await page.getByRole("button", { name: "Discard draft" }).click();

  await expect(page.getByText("Loaded your draft")).toBeHidden();
  await expect(page.getByText("Half written")).toBeHidden();
  await expect(firstRow.getByRole("button", { name: "8 out of 10", exact: true })).toHaveAttribute("aria-pressed", "false");
});
