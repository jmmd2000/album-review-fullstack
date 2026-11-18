import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { PAGE_SIZE } from "@shared/constants";
import type { DisplayArtist } from "@shared/types";

import { db, closeDatabase, query } from "@/db/client";
import { reviewedArtists } from "../db/schema";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";

interface ArtistPage {
  artists: DisplayArtist[];
  furtherPages: boolean;
  totalCount: number;
}

const TIED_ARTIST_COUNT = PAGE_SIZE + 4;

// Every artist gets the same score, and they go in in reverse name order,
// so the database's own row order differs from the order the page should show.
const tiedArtistNames = Array.from({ length: TIED_ARTIST_COUNT }, (_, index) => `Tied Artist ${String(index + 1).padStart(2, "0")}`);

async function seedTiedArtists() {
  const rows = [...tiedArtistNames].reverse().map(name => ({ name, spotifyID: name.toLowerCase().replace(/ /g, "-"), imageURLs: [], totalScore: 50 }));
  await db.insert(reviewedArtists).values(rows);
}

async function getPage(queryString: string): Promise<ArtistPage> {
  const res = await api.get(`/api/artists?${queryString}`);
  expect(res.status).toBe(200);
  return (await res.json()) as ArtistPage;
}

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("tied artists show once each across the page boundary, in name order", async () => {
  await seedTiedArtists();

  const firstPage = await getPage("page=1&orderBy=totalScore&order=desc");
  const secondPage = await getPage("page=2&orderBy=totalScore&order=desc");

  expect(firstPage.artists).toHaveLength(PAGE_SIZE);
  expect(firstPage.furtherPages).toBe(true);
  const shownNames = [...firstPage.artists, ...secondPage.artists].map(artist => artist.name);
  expect(shownNames).toEqual(tiedArtistNames);
});

test("a search counts only the artists that match", async () => {
  await seedTiedArtists();
  await db.insert(reviewedArtists).values([
    { name: "Search Match One", spotifyID: "search-match-one", imageURLs: [] },
    { name: "Search Match Two", spotifyID: "search-match-two", imageURLs: [] },
  ]);

  const page = await getPage("search=search%20match");

  expect(page.totalCount).toBe(2);
  expect(page.furtherPages).toBe(false);
  expect(page.artists.map(artist => artist.name)).toEqual(["Search Match One", "Search Match Two"]);
});
