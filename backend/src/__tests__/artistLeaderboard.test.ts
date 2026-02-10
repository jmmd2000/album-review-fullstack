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
import { ArtistService } from "../api/services/artistService";
import type { ReviewedArtist } from "@shared/types";

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

describe("Artist Leaderboard Position Updates", () => {
  test("should update all leaderboard positions correctly", async () => {
    // Create multiple artists with different scores
    const artist1Data = { ...mockReviewData, affectsArtistScore: true };
    artist1Data.album = { ...mockReviewData.album, id: "unique_album_lb_1" };
    artist1Data.album.artists = [
      { ...mockReviewData.album.artists[0], id: "artist1", name: "Artist 1" },
    ];
    artist1Data.ratedTracks = artist1Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_lb_1_${index}`,
      rating: 9,
    })); // High scores
    // Also update the tracks.items array
    artist1Data.album.tracks.items = artist1Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_lb_1_${index}`,
      })
    );

    const artist2Data = { ...mockReviewData, affectsArtistScore: true };
    artist2Data.album = { ...mockReviewData.album, id: "unique_album_lb_2" };
    artist2Data.album.artists = [
      { ...mockReviewData.album.artists[0], id: "artist2", name: "Artist 2" },
    ];
    artist2Data.ratedTracks = artist2Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_lb_2_${index}`,
      rating: 7,
    })); // Medium scores
    // Also update the tracks.items array
    artist2Data.album.tracks.items = artist2Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_lb_2_${index}`,
      })
    );

    const artist3Data = { ...mockReviewData, affectsArtistScore: true };
    artist3Data.album = { ...mockReviewData.album, id: "unique_album_lb_3" };
    artist3Data.album.artists = [
      { ...mockReviewData.album.artists[0], id: "artist3", name: "Artist 3" },
    ];
    artist3Data.ratedTracks = artist3Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_lb_3_${index}`,
      rating: 5,
    })); // Low scores
    // Also update the tracks.items array
    artist3Data.album.tracks.items = artist3Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_lb_3_${index}`,
      })
    );

    // Create the artists
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(artist1Data);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(artist2Data);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(artist3Data);

    // Update all leaderboard positions
    await ArtistService.updateAllLeaderboardPositions();

    // Verify the positions were updated correctly
    const result = await query(
      "SELECT * FROM reviewed_artists ORDER BY total_score DESC"
    );
    const artists = result.rows;

    expect(artists).toHaveLength(3);

    // Check that leaderboard positions are assigned correctly
    expect(artists[0].leaderboard_position).toBe(1);
    expect(artists[1].leaderboard_position).toBe(2);
    expect(artists[2].leaderboard_position).toBe(3);

    // Check that peak and latest leaderboard positions are also assigned
    expect(artists[0].peak_leaderboard_position).toBe(1);
    expect(artists[1].peak_leaderboard_position).toBe(2);
    expect(artists[2].peak_leaderboard_position).toBe(3);

    expect(artists[0].latest_leaderboard_position).toBe(1);
    expect(artists[1].latest_leaderboard_position).toBe(2);
    expect(artists[2].latest_leaderboard_position).toBe(3);
  });

  test("should handle tied scores correctly", async () => {
    // Create two artists with identical scores
    const artist1Data = { ...mockReviewData, affectsArtistScore: true };
    artist1Data.album = { ...mockReviewData.album, id: "unique_album_tie_1" };
    artist1Data.album.artists = [
      { ...mockReviewData.album.artists[0], id: "artist1", name: "Artist 1" },
    ];
    artist1Data.ratedTracks = artist1Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_tie_1_${index}`,
      rating: 8,
    }));
    // Also update the tracks.items array
    artist1Data.album.tracks.items = artist1Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_tie_1_${index}`,
      })
    );

    const artist2Data = { ...mockReviewData, affectsArtistScore: true };
    artist2Data.album = { ...mockReviewData.album, id: "unique_album_tie_2" };
    artist2Data.album.artists = [
      { ...mockReviewData.album.artists[0], id: "artist2", name: "Artist 2" },
    ];
    artist2Data.ratedTracks = artist2Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_tie_2_${index}`,
      rating: 8,
    }));
    // Also update the tracks.items array
    artist2Data.album.tracks.items = artist2Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_tie_2_${index}`,
      })
    );

    // Create the artists
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(artist1Data);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(artist2Data);

    // Update all leaderboard positions
    await ArtistService.updateAllLeaderboardPositions();

    // Verify the positions were updated correctly
    const result = await query(
      "SELECT * FROM reviewed_artists ORDER BY total_score DESC"
    );
    const artists = result.rows;

    expect(artists).toHaveLength(2);

    // Both artists should have the same leaderboard position (tied for 1st)
    expect(artists[0].leaderboard_position).toBe(1);
    expect(artists[1].leaderboard_position).toBe(1);
  });

  test("should only update rated artists", async () => {
    // Create one rated artist and one unrated artist
    const ratedArtistData = { ...mockReviewData, affectsArtistScore: true };
    ratedArtistData.album = {
      ...mockReviewData.album,
      id: "unique_album_rated",
    };
    ratedArtistData.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "rated_artist",
        name: "Rated Artist",
      },
    ];
    ratedArtistData.ratedTracks = ratedArtistData.ratedTracks.map(
      (track, index) => ({
        ...track,
        id: `unique_track_rated_${index}`,
        rating: 8,
      })
    );
    // Also update the tracks.items array
    ratedArtistData.album.tracks.items = ratedArtistData.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_rated_${index}`,
      })
    );

    const unratedArtistData = { ...mockReviewData, affectsArtistScore: false };
    unratedArtistData.album = {
      ...mockReviewData.album,
      id: "unique_album_unrated",
    };
    unratedArtistData.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "unrated_artist",
        name: "Unrated Artist",
      },
    ];
    unratedArtistData.ratedTracks = unratedArtistData.ratedTracks.map(
      (track, index) => ({
        ...track,
        id: `unique_track_unrated_${index}`,
        rating: 0,
      })
    ); // Unrated
    // Also update the tracks.items array
    unratedArtistData.album.tracks.items =
      unratedArtistData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_unrated_${index}`,
      }));

    // Create the artists
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(ratedArtistData);
    await request(app)
      .post("/api/albums/create")
      .set("Cookie", authCookie)
      .send(unratedArtistData);

    // Update all leaderboard positions
    await ArtistService.updateAllLeaderboardPositions();

    // Verify only the rated artist got a position
    const result = await query(
      "SELECT * FROM reviewed_artists ORDER BY total_score DESC"
    );
    const artists = result.rows;

    expect(artists).toHaveLength(2);

    const ratedArtist = artists.find(
      (a: any) => a.spotify_id === "rated_artist"
    );
    const unratedArtist = artists.find(
      (a: any) => a.spotify_id === "unrated_artist"
    );

    expect(ratedArtist.leaderboard_position).toBe(1);
    expect(ratedArtist.peak_leaderboard_position).toBe(1);
    expect(ratedArtist.latest_leaderboard_position).toBe(1);

    expect(unratedArtist.leaderboard_position).toBeNull();
    expect(unratedArtist.peak_leaderboard_position).toBeNull();
    expect(unratedArtist.latest_leaderboard_position).toBeNull();
  });

  test("should handle empty artist list", async () => {
    // Update leaderboard positions with no artists
    await ArtistService.updateAllLeaderboardPositions();

    // Should not throw an error
    const result = await query("SELECT * FROM reviewed_artists");
    expect(result.rows).toHaveLength(0);
  });
});

describe("Artist Score Calculation Integration", () => {
  test("should calculate peak and latest scores correctly for artist with multiple albums", async () => {
    // Create an artist with multiple albums of different scores and years
    const album1Data = { ...mockReviewData, affectsArtistScore: true };
    album1Data.album = {
      ...mockReviewData.album,
      id: "unique_album_integration_1",
    };
    album1Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist",
        name: "Test Artist",
      },
    ];
    album1Data.album.name = "Album 1";
    album1Data.album.release_date = "2020-01-01";
    album1Data.ratedTracks = album1Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_integration_1_${index}`,
      rating: 9,
    })); // High scores
    album1Data.album.tracks.items = album1Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_integration_1_${index}`,
      })
    );

    const album2Data = { ...mockReviewData, affectsArtistScore: true };
    album2Data.album = {
      ...mockReviewData.album,
      id: "unique_album_integration_2",
    };
    album2Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist",
        name: "Test Artist",
      },
    ];
    album2Data.album.name = "Album 2";
    album2Data.album.release_date = "2021-01-01";
    album2Data.ratedTracks = album2Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_integration_2_${index}`,
      rating: 7,
    })); // Medium scores
    album2Data.album.tracks.items = album2Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_integration_2_${index}`,
      })
    );

    const album3Data = { ...mockReviewData, affectsArtistScore: true };
    album3Data.album = {
      ...mockReviewData.album,
      id: "unique_album_integration_3",
    };
    album3Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist",
        name: "Test Artist",
      },
    ];
    album3Data.album.name = "Album 3";
    album3Data.album.release_date = "2022-01-01";
    album3Data.ratedTracks = album3Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_integration_3_${index}`,
      rating: 5,
    })); // Low scores
    album3Data.album.tracks.items = album3Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_integration_3_${index}`,
      })
    );

    // Add a 4th album to make peak and latest scores different
    const album4Data = { ...mockReviewData, affectsArtistScore: true };
    album4Data.album = {
      ...mockReviewData.album,
      id: "unique_album_integration_4",
    };
    album4Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "test_artist",
        name: "Test Artist",
      },
    ];
    album4Data.album.name = "Album 4";
    album4Data.album.release_date = "2019-01-01"; // Older than others
    album4Data.ratedTracks = album4Data.ratedTracks.map((track, index) => ({
      ...track,
      id: `unique_track_integration_4_${index}`,
      rating: 8, // High score but older
    }));
    album4Data.album.tracks.items = album4Data.album.tracks.items.map(
      (track, index) => ({
        ...track,
        id: `unique_track_integration_4_${index}`,
      })
    );

    // Create the albums
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

    // Get the artist details
    const response = await request(app).get("/api/artists/test_artist");
    const artist: ReviewedArtist = response.body;

    expect(response.status).toBe(200);
    expect(artist.peakScore).toBeGreaterThan(0);
    expect(artist.latestScore).toBeGreaterThan(0);
    expect(artist.totalScore).toBeGreaterThan(0);

    // Peak score should be higher than latest score (top 3 vs latest 3)
    expect(artist.peakScore).toBeGreaterThan(artist.latestScore);
  });

  test("should have identical scores for artist with exactly 3 albums", async () => {
    // Create an artist with exactly 3 albums
    const album1Data = { ...mockReviewData };
    album1Data.album.artists[0].id = "three_album_artist";
    album1Data.album.artists[0].name = "Three Album Artist";
    album1Data.album.name = "Album 1";
    album1Data.album.release_date = "2020-01-01";
    album1Data.ratedTracks = album1Data.ratedTracks.map(track => ({
      ...track,
      rating: 8,
    }));

    const album2Data = { ...mockReviewData };
    album2Data.album.artists[0].id = "three_album_artist";
    album2Data.album.artists[0].name = "Three Album Artist";
    album2Data.album.name = "Album 2";
    album2Data.album.release_date = "2021-01-01";
    album2Data.ratedTracks = album2Data.ratedTracks.map(track => ({
      ...track,
      rating: 7,
    }));

    const album3Data = { ...mockReviewData };
    album3Data.album.artists[0].id = "three_album_artist";
    album3Data.album.artists[0].name = "Three Album Artist";
    album3Data.album.name = "Album 3";
    album3Data.album.release_date = "2022-01-01";
    album3Data.ratedTracks = album3Data.ratedTracks.map(track => ({
      ...track,
      rating: 6,
    }));

    // Create the albums
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

    // Get the artist details
    const response = await request(app).get("/api/artists/three_album_artist");
    const artist: ReviewedArtist = response.body;

    expect(response.status).toBe(200);

    // For exactly 3 albums, all scores should be identical
    expect(artist.totalScore).toBe(artist.peakScore);
    expect(artist.peakScore).toBe(artist.latestScore);
    expect(artist.latestScore).toBe(artist.totalScore);
  });
});
