import {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  test,
  expect,
  jest,
  describe,
} from "@jest/globals";
import request from "supertest";
import { app } from "../index";
import { closeDatabase, query } from "../../db";
import { resetTables } from "./testUtils";
import { mockReviewData } from "./constants";

// Mock Puppeteer header fetcher to avoid launch errors
jest.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: jest.fn(() => Promise.resolve(null)),
}));

// Mock Spotify artist fetcher
jest.mock("../helpers/fetchArtistFromSpotify", () => ({
  fetchArtistFromSpotify: jest.fn((id: string) =>
    Promise.resolve({
      id: id,
      name: "Test Artist",
      images: [
        {
          url: "https://i.scdn.co/image/ab6761610000e5eb4a21b4760d2ecb7b0dcdc8da",
          height: 640,
          width: 640,
        },
      ],
    })
  ),
}));

let authCookie: string[];

beforeAll(async () => {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ password: process.env.ADMIN_PASSWORD! });
  expect(res.status).toBe(204);
  const setCookie = res.get("set-cookie");
  authCookie = Array.isArray(setCookie)
    ? setCookie
    : setCookie
    ? [setCookie]
    : [];
});

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await request(app).post("/api/auth/logout").set("Cookie", authCookie).send();
  await closeDatabase();
});

describe("Score Integration Tests", () => {
  test("should create artist with all three scores when album is created", async () => {
    const albumData = { ...mockReviewData, affectsArtistScore: true };
    albumData.album.id = "unique_album_1";
    albumData.album.artists = [
      { ...mockReviewData.album.artists[0], id: "unique_artist_1" },
    ];
    albumData.ratedTracks = albumData.ratedTracks.map(track => ({
      ...track,
      rating: 8,
    }));

    const response = await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(albumData);

    expect(response.status).toBe(201);

    // Check that artist was created with all three scores
    const result = await query(
      "SELECT * FROM reviewed_artists WHERE spotify_id = $1",
      [albumData.album.artists[0].id]
    );
    const artist = result.rows[0];

    console.log("Artist found:", artist);
    console.log("Response status:", response.status);
    console.log("Response body:", response.body);

    expect(artist).toBeDefined();
    expect(artist.total_score).toBeGreaterThan(0);
    expect(artist.peak_score).toBeGreaterThan(0);
    expect(artist.latest_score).toBeGreaterThan(0);
    expect(artist.peak_score).toBe(artist.total_score); // Should be same for single album
    expect(artist.latest_score).toBe(artist.total_score); // Should be same for single album
  });

  test("should update all scores when album is updated", async () => {
    // Create initial album
    const albumData = { ...mockReviewData, affectsArtistScore: true };
    albumData.album.id = "unique_album_2";
    albumData.album.artists = [
      { ...mockReviewData.album.artists[0], id: "unique_artist_2" },
    ];
    albumData.ratedTracks = albumData.ratedTracks.map(track => ({
      ...track,
      rating: 6,
    }));

    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(albumData);

    // Update album with higher ratings
    const updateData = { ...albumData };
    updateData.ratedTracks = updateData.ratedTracks.map(track => ({
      ...track,
      rating: 9,
    }));

    await request(app)
      .put(`/api/albums/${albumData.album.id}`)
      .set("Cookie", authCookie)
      .send(updateData);

    // Check that all scores were updated
    const result = await query(
      "SELECT * FROM reviewed_artists WHERE spotify_id = $1",
      [albumData.album.artists[0].id]
    );
    const artist = result.rows[0];

    expect(artist.total_score).toBeGreaterThan(60); // Should be higher than initial
    expect(artist.peak_score).toBeGreaterThan(60);
    expect(artist.latest_score).toBeGreaterThan(60);
  });

  test("should calculate different peak and latest scores for artist with multiple albums", async () => {
    // Create first album (older, lower score)
    const album1Data = { ...mockReviewData, affectsArtistScore: true };
    album1Data.album = { ...mockReviewData.album, id: "unique_album_3a" };
    album1Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist_3",
        name: "Test Artist 3",
      },
    ];
    album1Data.album.name = "Album 1";
    album1Data.album.release_date = "2020-01-01";
    album1Data.ratedTracks = album1Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_3a_${index}`,
      rating: 6,
    }));
    // Also update the tracks.items array
    album1Data.album.tracks.items = album1Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_3a_${index}`,
      })
    );

    // Create second album (newer, higher score)
    const album2Data = { ...mockReviewData, affectsArtistScore: true };
    album2Data.album = { ...mockReviewData.album, id: "unique_album_3b" };
    album2Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist_3",
        name: "Test Artist 3",
      },
    ];
    album2Data.album.name = "Album 2";
    album2Data.album.release_date = "2021-01-01";
    album2Data.ratedTracks = album2Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_3b_${index}`,
      rating: 8,
    }));
    // Also update the tracks.items array
    album2Data.album.tracks.items = album2Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_3b_${index}`,
      })
    );

    // Create third album (newest, medium score)
    const album3Data = { ...mockReviewData, affectsArtistScore: true };
    album3Data.album = { ...mockReviewData.album, id: "unique_album_3c" };
    album3Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist_3",
        name: "Test Artist 3",
      },
    ];
    album3Data.album.name = "Album 3";
    album3Data.album.release_date = "2022-01-01";
    album3Data.ratedTracks = album3Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_3c_${index}`,
      rating: 7,
    }));
    // Also update the tracks.items array
    album3Data.album.tracks.items = album3Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_3c_${index}`,
      })
    );

    // Create fourth album (oldest, highest score)
    const album4Data = { ...mockReviewData, affectsArtistScore: true };
    album4Data.album = { ...mockReviewData.album, id: "unique_album_3d" };
    album4Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist_3",
        name: "Test Artist 3",
      },
    ];
    album4Data.album.name = "Album 4";
    album4Data.album.release_date = "2019-01-01";
    album4Data.ratedTracks = album4Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_3d_${index}`,
      rating: 9,
    }));
    // Also update the tracks.items array
    album4Data.album.tracks.items = album4Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_3d_${index}`,
      })
    );

    // Create all albums
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(album1Data);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(album2Data);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(album3Data);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(album4Data);

    // Check that scores are different
    const result = await query(
      "SELECT * FROM reviewed_artists WHERE spotify_id = $1",
      [album1Data.album.artists[0].id]
    );
    const artist = result.rows[0];

    expect(artist.total_score).toBeGreaterThan(0);
    expect(artist.peak_score).toBeGreaterThan(0);
    expect(artist.latest_score).toBeGreaterThan(0);

    // Peak score should be higher than latest score (top 3 vs latest 3)
    expect(artist.peak_score).toBeGreaterThan(artist.latest_score);
  });

  test("should update leaderboard positions when scores change", async () => {
    // Create two artists with different scores
    const artist1Data = { ...mockReviewData, affectsArtistScore: true };
    artist1Data.album = { ...mockReviewData.album, id: "unique_album_4a" };
    artist1Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "artist_4a",
        name: "Artist 4A",
      },
    ];
    artist1Data.ratedTracks = artist1Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_4a_${index}`,
      rating: 8, // Lower initial score
    }));
    artist1Data.album.tracks.items = artist1Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_4a_${index}`,
      })
    );

    const artist2Data = { ...mockReviewData, affectsArtistScore: true };
    artist2Data.album = { ...mockReviewData.album, id: "unique_album_4b" };
    artist2Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "artist_4b",
        name: "Artist 4B",
      },
    ];
    artist2Data.ratedTracks = artist2Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_4b_${index}`,
      rating: 7,
    }));
    artist2Data.album.tracks.items = artist2Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_4b_${index}`,
      })
    );

    // Create both artists
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(artist1Data);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(artist2Data);

    // Check initial positions
    let result = await query(
      "SELECT * FROM reviewed_artists ORDER BY total_score DESC"
    );
    let artists = result.rows;

    expect(artists[0].leaderboard_position).toBe(1);
    expect(artists[1].leaderboard_position).toBe(2);

    // Create a new album for the second artist with higher score
    const newAlbumData = { ...mockReviewData, affectsArtistScore: true };
    newAlbumData.album = { ...mockReviewData.album, id: "unique_album_4b_new" };
    newAlbumData.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "artist_4b",
        name: "Artist 4B",
      },
    ];
    newAlbumData.ratedTracks = newAlbumData.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_4b_new_${index}`,
      rating: 10, // Higher score
    }));
    newAlbumData.album.tracks.items = newAlbumData.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_4b_new_${index}`,
      })
    );

    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(newAlbumData);

    // Check that positions were updated
    result = await query(
      "SELECT * FROM reviewed_artists ORDER BY total_score DESC"
    );
    artists = result.rows;

    // Artist 2 should now be first
    expect(artists[0].spotify_id).toBe("artist_4b");
    expect(artists[0].leaderboard_position).toBe(1);
    expect(artists[1].spotify_id).toBe("artist_4a");
    expect(artists[1].leaderboard_position).toBe(2);
  });

  test("should handle API endpoints with score type parameter", async () => {
    // Create an artist
    const albumData = { ...mockReviewData, affectsArtistScore: true };
    albumData.album.id = "unique_album_5";
    albumData.album.artists = [
      { ...mockReviewData.album.artists[0], id: "artist_5", name: "Artist 5" },
    ];
    albumData.ratedTracks = albumData.ratedTracks.map(track => ({
      ...track,
      rating: 8,
    }));

    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(albumData);

    // Test different score type parameters
    const overallResponse = await request(app).get(
      "/api/artists?orderBy=totalScore&order=desc&scoreType=overall"
    );
    const peakResponse = await request(app).get(
      "/api/artists?orderBy=totalScore&order=desc&scoreType=peak"
    );
    const latestResponse = await request(app).get(
      "/api/artists?orderBy=totalScore&order=desc&scoreType=latest"
    );

    expect(overallResponse.status).toBe(200);
    expect(peakResponse.status).toBe(200);
    expect(latestResponse.status).toBe(200);

    // All should return the same artist (since it's the only one)
    expect(overallResponse.body.artists).toHaveLength(1);
    expect(peakResponse.body.artists).toHaveLength(1);
    expect(latestResponse.body.artists).toHaveLength(1);
  });
});
