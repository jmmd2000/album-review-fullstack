import { execSync } from "child_process";
import path from "path";
import { beforeEach, afterEach, afterAll, test, expect } from "vitest";
import { calculateAlbumScore } from "@shared/helpers/calculateAlbumScore";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { BookmarkedAlbumModel } from "@/api/models/BookmarkedAlbum";
import { BOOKMARKED_IDS, REVIEWED, capturedAlbum, ratingFor } from "@/db/fixtures/fixtures";

// The seed and wipe scripts run on import, so they are driven here as child
// processes, the same way the e2e global setup runs them. The child inherits
// this worker's env and therefore lands in this worker's database.
const API_ROOT = path.resolve(__dirname, "../..");
const runSeed = () => execSync("pnpm run db:seed", { cwd: API_ROOT, stdio: "pipe" });
const runWipe = () => execSync("pnpm run db:wipe", { cwd: API_ROOT, stdio: "pipe" });

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

test("seeds the fixture library into an empty database", async () => {
  runSeed();

  const albums = await AlbumModel.getAllAlbums();
  expect(albums).toHaveLength(REVIEWED.length);

  const bookmarks = await BookmarkedAlbumModel.getAllBookmarkedAlbums();
  expect(bookmarks.map(b => b.spotifyID).sort()).toEqual([...BOOKMARKED_IDS].sort());

  // The seeded score must match what the app's own scoring helper produces
  const review = REVIEWED[0];
  const captured = capturedAlbum(review.spotifyID);
  const { finalScore } = calculateAlbumScore(
    captured.tracks.map((track, index) => ({
      spotifyID: track.spotifyID,
      name: track.name,
      artistName: track.artistName,
      artistSpotifyID: track.artistSpotifyID,
      duration: track.duration,
      features: track.features,
      rating: ratingFor(index, review.offset),
    })),
    0
  );
  const seeded = await AlbumModel.findBySpotifyID(review.spotifyID);
  expect(seeded.finalScore).toBe(finalScore);

  // Every rated artist gets a competition-ranked position, ties share one and
  // the next position skips accordingly
  const artists = await ArtistModel.getAllArtists();
  const rated = artists.filter(artist => !artist.unrated);
  expect(rated.length).toBeGreaterThan(0);
  for (const artist of rated) {
    const higher = rated.filter(other => other.totalScore > artist.totalScore).length;
    expect(artist.leaderboardPosition).toBe(higher + 1);
  }
}, 60000);

test("keeps a score-excluded artist unrated", async () => {
  runSeed();

  const review = REVIEWED.find(candidate => candidate.scoreExcludedArtistIndexes?.length);
  if (!review?.scoreExcludedArtistIndexes) throw new Error("No seeded review leaves an artist out of the score");

  const excludedIndex = review.scoreExcludedArtistIndexes[0];
  const excludedID = capturedAlbum(review.spotifyID).artists[excludedIndex].spotifyID;
  const artist = await ArtistModel.getArtistBySpotifyID(excludedID);

  expect(artist.unrated).toBe(true);
  expect(artist.totalScore).toBe(0);
  expect(artist.reviewCount).toBeGreaterThan(0);
}, 60000);

test("refuses to seed a database that already has reviews", async () => {
  runSeed();

  let failed = false;
  try {
    runSeed();
  } catch (error) {
    failed = true;
    expect(String((error as { stderr: Buffer }).stderr)).toContain("already has");
  }
  expect(failed).toBe(true);
}, 60000);

test("wipe clears everything the seeder created", async () => {
  runSeed();
  runWipe();

  expect(await AlbumModel.getAllAlbums()).toHaveLength(0);
  expect(await ArtistModel.getAllArtists()).toHaveLength(0);
  expect(await BookmarkedAlbumModel.getAllBookmarkedAlbums()).toHaveLength(0);
}, 60000);
