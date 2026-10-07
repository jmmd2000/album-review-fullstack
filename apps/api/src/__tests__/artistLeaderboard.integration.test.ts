import { beforeEach, afterEach, afterAll, test, expect, vi, describe } from "vitest";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { mockReviewData } from "./constants";
import { ArtistScoreService } from "../api/services/ArtistScoreService";
import type { ReviewedArtist } from "@shared/types";
import { api } from "./apiRequest";
import { adminCookie } from "./adminCookie";

// Mock Puppeteer header fetcher to avoid launch errors
vi.mock("../helpers/fetchArtistHeaderFromSpotify", () => ({
  fetchArtistHeaderFromSpotify: vi.fn(() => Promise.resolve(null)),
}));

// Mock Spotify artist fetcher
vi.mock("../helpers/fetchArtistFromSpotify", () => ({
  fetchArtistFromSpotify: vi.fn((id: string) =>
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

const authCookie = adminCookie();

beforeEach(async () => {
  await resetTables(query);
});

afterEach(async () => {
  await resetTables(query);
});

afterAll(async () => {
  await closeDatabase();
});

describe("Artist Leaderboard Position Updates", () => {
  test("should update all leaderboard positions correctly", async () => {
    // Create multiple artists with different scores
    const artist1Data = { ...mockReviewData, affectsArtistScore: true };
    artist1Data.album = { ...mockReviewData.album, id: "unique_album_lb_1" };
    artist1Data.album.artists = [{ ...mockReviewData.album.artists[0], id: "artist1", name: "Artist 1" }];
    artist1Data.ratedTracks = artist1Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_lb_1_${index}`,
      rating: 9,
    })); // High scores
    artist1Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_lb_1_${index}`,
      })),
    };

    const artist2Data = { ...mockReviewData, affectsArtistScore: true };
    artist2Data.album = { ...mockReviewData.album, id: "unique_album_lb_2" };
    artist2Data.album.artists = [{ ...mockReviewData.album.artists[0], id: "artist2", name: "Artist 2" }];
    artist2Data.ratedTracks = artist2Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_lb_2_${index}`,
      rating: 7,
    })); // Medium scores
    artist2Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_lb_2_${index}`,
      })),
    };

    const artist3Data = { ...mockReviewData, affectsArtistScore: true };
    artist3Data.album = { ...mockReviewData.album, id: "unique_album_lb_3" };
    artist3Data.album.artists = [{ ...mockReviewData.album.artists[0], id: "artist3", name: "Artist 3" }];
    artist3Data.ratedTracks = artist3Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_lb_3_${index}`,
      rating: 5,
    })); // Low scores
    artist3Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_lb_3_${index}`,
      })),
    };

    for (const albumData of [artist1Data, artist2Data, artist3Data]) {
      expect((await api.post("/api/albums/create", albumData, authCookie)).status).toBe(201);
    }

    // Update all leaderboard positions
    await ArtistScoreService.updateAllLeaderboardPositions();

    // Verify the positions were updated correctly
    const result = await query("SELECT * FROM reviewed_artists ORDER BY total_score DESC");
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
    artist1Data.album.artists = [{ ...mockReviewData.album.artists[0], id: "artist1", name: "Artist 1" }];
    artist1Data.ratedTracks = artist1Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_tie_1_${index}`,
      rating: 8,
    }));
    artist1Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_tie_1_${index}`,
      })),
    };

    const artist2Data = { ...mockReviewData, affectsArtistScore: true };
    artist2Data.album = { ...mockReviewData.album, id: "unique_album_tie_2" };
    artist2Data.album.artists = [{ ...mockReviewData.album.artists[0], id: "artist2", name: "Artist 2" }];
    artist2Data.ratedTracks = artist2Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_tie_2_${index}`,
      rating: 8,
    }));
    artist2Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_tie_2_${index}`,
      })),
    };

    for (const albumData of [artist1Data, artist2Data]) {
      expect((await api.post("/api/albums/create", albumData, authCookie)).status).toBe(201);
    }

    // Update all leaderboard positions
    await ArtistScoreService.updateAllLeaderboardPositions();

    // Verify the positions were updated correctly
    const result = await query("SELECT * FROM reviewed_artists ORDER BY total_score DESC");
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
    ratedArtistData.ratedTracks = ratedArtistData.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_rated_${index}`,
      rating: 8,
    }));
    ratedArtistData.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_rated_${index}`,
      })),
    };

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
    unratedArtistData.ratedTracks = unratedArtistData.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_unrated_${index}`,
      rating: 0,
    })); // Unrated
    unratedArtistData.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_unrated_${index}`,
      })),
    };

    for (const albumData of [ratedArtistData, unratedArtistData]) {
      expect((await api.post("/api/albums/create", albumData, authCookie)).status).toBe(201);
    }

    // Update all leaderboard positions
    await ArtistScoreService.updateAllLeaderboardPositions();

    // Verify only the rated artist got a position
    const result = await query("SELECT * FROM reviewed_artists ORDER BY total_score DESC");
    const artists = result.rows;

    expect(artists).toHaveLength(2);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ratedArtist = artists.find((a: any) => a.spotify_id === "rated_artist");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unratedArtist = artists.find((a: any) => a.spotify_id === "unrated_artist");

    expect(ratedArtist.leaderboard_position).toBe(1);
    expect(ratedArtist.peak_leaderboard_position).toBe(1);
    expect(ratedArtist.latest_leaderboard_position).toBe(1);

    expect(unratedArtist.leaderboard_position).toBeNull();
    expect(unratedArtist.peak_leaderboard_position).toBeNull();
    expect(unratedArtist.latest_leaderboard_position).toBeNull();
  });

  test("should handle empty artist list", async () => {
    // Update leaderboard positions with no artists
    await ArtistScoreService.updateAllLeaderboardPositions();

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
        id: "integrationTestArtist1",
        name: "Test Artist",
      },
    ];
    album1Data.album.name = "Album 1";
    album1Data.album.release_date = "2020-01-01";
    album1Data.ratedTracks = album1Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_integration_1_${index}`,
      rating: 9,
    })); // High scores
    album1Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_integration_1_${index}`,
      })),
    };

    const album2Data = { ...mockReviewData, affectsArtistScore: true };
    album2Data.album = {
      ...mockReviewData.album,
      id: "unique_album_integration_2",
    };
    album2Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "integrationTestArtist1",
        name: "Test Artist",
      },
    ];
    album2Data.album.name = "Album 2";
    album2Data.album.release_date = "2021-01-01";
    album2Data.ratedTracks = album2Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_integration_2_${index}`,
      rating: 7,
    })); // Medium scores
    album2Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_integration_2_${index}`,
      })),
    };

    const album3Data = { ...mockReviewData, affectsArtistScore: true };
    album3Data.album = {
      ...mockReviewData.album,
      id: "unique_album_integration_3",
    };
    album3Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "integrationTestArtist1",
        name: "Test Artist",
      },
    ];
    album3Data.album.name = "Album 3";
    album3Data.album.release_date = "2022-01-01";
    album3Data.ratedTracks = album3Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_integration_3_${index}`,
      rating: 5,
    })); // Low scores
    album3Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_integration_3_${index}`,
      })),
    };

    // Add a 4th album to make peak and latest scores different
    const album4Data = { ...mockReviewData, affectsArtistScore: true };
    album4Data.album = {
      ...mockReviewData.album,
      id: "unique_album_integration_4",
    };
    album4Data.album.artists = [
      {
        ...mockReviewData.album.artists[0],
        id: "integrationTestArtist1",
        name: "Test Artist",
      },
    ];
    album4Data.album.name = "Album 4";
    album4Data.album.release_date = "2019-01-01"; // Older than others
    album4Data.ratedTracks = album4Data.ratedTracks.map((track, index) => ({
      ...track,
      spotifyID: `unique_track_integration_4_${index}`,
      rating: 8, // High score but older
    }));
    album4Data.album.tracks = {
      ...mockReviewData.album.tracks,
      items: mockReviewData.album.tracks.items.map((track, index) => ({
        ...track,
        id: `unique_track_integration_4_${index}`,
      })),
    };

    for (const albumData of [album1Data, album2Data, album3Data, album4Data]) {
      expect((await api.post("/api/albums/create", albumData, authCookie)).status).toBe(201);
    }

    // Get the artist details
    const response = await api.get("/api/artists/integrationTestArtist1");
    const artist: ReviewedArtist = await response.json();

    expect(response.status).toBe(200);
    // Best first, every album the same length: (90 + 80 x 0.6 + 70 x 0.36 + 50 x 0.216) / 2.176
    expect(artist.totalScore).toBeCloseTo(79.96, 1);
    expect(artist.peakScore).toBe(90);
    // The latest three are 2022 (50), 2021 (70) and 2020 (90)
    expect(artist.latestScore).toBeCloseTo(70);
  });
});
