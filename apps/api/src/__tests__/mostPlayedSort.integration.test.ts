import { afterAll, beforeEach, expect, test } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";
import { AlbumModel } from "@/api/models/Album";
import { ArtistModel } from "@/api/models/Artist";
import { PlayModel } from "@/api/models/Play";
import { PlayedGroupModel } from "@/api/models/PlayedGroup";
import type { SpotifyPlay } from "@/api/schemas/spotifySchema";

const authCookie = adminCookie();

async function reviewAlbum(albumID: string, artistID: string) {
  await AlbumModel.createAlbum({
    spotifyID: albumID,
    name: albumID,
    artistSpotifyID: artistID,
    artistName: artistID,
    releaseDate: "2024-01-01",
    releaseYear: 2024,
    imageURLs: [],
    runtime: "40 minutes",
    reviewContent: "",
    reviewScore: 70,
    bonus: 0,
    finalScore: 70,
    affectsArtistScore: true,
    colors: [],
    genres: [],
  });
}

const play = (trackID: string, albumID: string, artistID: string, minute: number, albumName = albumID, albumType = "album"): SpotifyPlay => ({
  played_at: new Date(Date.UTC(2026, 0, 1, 0, minute)).toISOString(),
  track: {
    id: trackID,
    name: trackID,
    duration_ms: 200000,
    artists: [{ id: artistID, name: artistID }],
    album: { id: albumID, name: albumName, album_type: albumType, release_date: "2024-01-01", images: [], artists: [{ id: artistID, name: artistID }] },
  },
});

beforeEach(async () => {
  await resetTables(query);
  for (const artistID of ["quiet", "loud"]) {
    await ArtistModel.createArtist({ spotifyID: artistID, name: artistID, imageURLs: [], headerImage: null, totalScore: 70, reviewCount: 1, unrated: false, leaderboardPosition: null });
  }
  await reviewAlbum("quiet-album", "quiet");
  await reviewAlbum("loud-album", "loud");
  await PlayModel.savePlays([
    play("loud-1", "loud-album", "loud", 1),
    play("loud-2", "loud-album", "loud", 2),
    play("quiet-1", "quiet-album", "quiet", 3),
    // The same artist's single counts for the artist, but not for the album
    play("loud-single", "loud-single-release", "loud", 4, "Something Else", "single"),
    play("loud-single", "loud-single-release", "loud", 5, "Something Else", "single"),
    // Another copy of the reviewed album, such as its clean version, counts for the album
    play("loud-copy-1", "loud-album-clean", "loud", 6, "loud-album"),
  ]);
  await PlayedGroupModel.groupAll();
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

test("albums sort by plays of the album and its copies, but not the artist's other releases", async () => {
  const body = await (await api.get("/api/albums?orderBy=plays", authCookie)).json();

  expect(body.albums.map((album: { spotifyID: string; plays: number }) => [album.spotifyID, album.plays])).toEqual([
    ["loud-album", 3],
    ["quiet-album", 1],
  ]);
});

test("artists sort by every play credited to them", async () => {
  const body = await (await api.get("/api/artists?orderBy=plays", authCookie)).json();

  expect(body.artists.map((artist: { spotifyID: string; plays: number }) => [artist.spotifyID, artist.plays])).toEqual([
    ["loud", 5],
    ["quiet", 1],
  ]);
});

test("albums and artists sort by minutes, counted the same way as plays", async () => {
  // A long play of the quiet album gives it more minutes than the loud album, though it has fewer plays
  const longPlay = play("quiet-long", "quiet-album", "quiet", 7);
  await PlayModel.savePlays([{ ...longPlay, track: { ...longPlay.track, duration_ms: 1200000 } }]);

  const albums = await (await api.get("/api/albums?orderBy=minutes", authCookie)).json();
  const artists = await (await api.get("/api/artists?orderBy=minutes", authCookie)).json();

  expect(albums.albums.map((album: { spotifyID: string; minutes: number }) => [album.spotifyID, album.minutes])).toEqual([
    ["quiet-album", 23],
    ["loud-album", 10],
  ]);
  expect(artists.artists.map((artist: { spotifyID: string; minutes: number }) => [artist.spotifyID, artist.minutes])).toEqual([
    ["quiet", 23],
    ["loud", 17],
  ]);
});

test("only the admin can sort by plays or minutes, and other sorts carry neither", async () => {
  expect((await api.get("/api/albums?orderBy=plays")).status).toBe(401);
  expect((await api.get("/api/artists?orderBy=plays")).status).toBe(401);
  expect((await api.get("/api/albums?orderBy=minutes")).status).toBe(401);
  expect((await api.get("/api/artists?orderBy=minutes")).status).toBe(401);

  const body = await (await api.get("/api/albums?orderBy=name")).json();
  expect(body.albums[0]).not.toHaveProperty("plays");
  expect(body.albums[0]).not.toHaveProperty("minutes");
});
