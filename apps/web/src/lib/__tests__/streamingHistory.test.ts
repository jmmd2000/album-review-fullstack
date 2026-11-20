import { describe, expect, it } from "vitest";
import { readStreamingHistory, summariseStreamingHistory } from "@/lib/streamingHistory";

// Shaped like the rows in Spotify's extended streaming history export
const exportRow = (overrides: Record<string, unknown> = {}) => ({
  ts: "2024-03-02T18:04:11Z",
  platform: "android",
  ms_played: 201000,
  conn_country: "IE",
  ip_addr: "203.0.113.4",
  master_metadata_track_name: "Yellow",
  master_metadata_album_artist_name: "Coldplay",
  master_metadata_album_album_name: "Parachutes",
  spotify_track_uri: "spotify:track:3AJwUDP919kvQ9QcozQPxg",
  episode_name: null,
  episode_show_name: null,
  spotify_episode_uri: null,
  reason_start: "trackdone",
  reason_end: "trackdone",
  shuffle: false,
  skipped: false,
  offline: false,
  offline_timestamp: 1709402451,
  incognito_mode: false,
  ...overrides,
});

describe("readStreamingHistory", () => {
  it("turns a track row into a play with only the fields the import sends", () => {
    const { plays, skippedCount } = readStreamingHistory([{ name: "Streaming_History_Audio_2024.json", rows: [exportRow()] }]);

    expect(plays).toEqual([{ playedAt: "2024-03-02T18:04:11.000Z", msPlayed: 201000, trackSpotifyID: "3AJwUDP919kvQ9QcozQPxg", trackName: "Yellow" }]);
    expect(skippedCount).toBe(0);
  });

  it("skips podcasts, rows with no track or name, and rows it can't read", () => {
    const rows = [
      exportRow({ master_metadata_track_name: null, spotify_track_uri: null, episode_name: "An episode", spotify_episode_uri: "spotify:episode:abc" }),
      exportRow({ spotify_track_uri: null }),
      exportRow({ master_metadata_track_name: null }),
      exportRow({ ts: "yesterday" }),
      "not a row",
    ];

    const { plays, skippedCount } = readStreamingHistory([{ name: "history.json", rows }]);

    expect(plays).toEqual([]);
    expect(skippedCount).toBe(5);
  });

  it("keeps one play when the same track at the same time is in two files", () => {
    const { plays } = readStreamingHistory([
      { name: "one.json", rows: [exportRow()] },
      { name: "two.json", rows: [exportRow(), exportRow({ ts: "2024-03-02T18:08:00Z" })] },
    ]);

    expect(plays).toHaveLength(2);
  });

  it("keeps a play of 0 milliseconds", () => {
    const { plays } = readStreamingHistory([{ name: "history.json", rows: [exportRow({ ms_played: 0 })] }]);

    expect(plays[0].msPlayed).toBe(0);
  });

  it("refuses a file that isn't a list of rows", () => {
    expect(() => readStreamingHistory([{ name: "Userdata.json", rows: { username: "james" } }])).toThrow("Userdata.json");
  });
});

describe("summariseStreamingHistory", () => {
  it("gives the range and counts plays of 30 seconds or more as streams", () => {
    const { plays } = readStreamingHistory([
      {
        name: "history.json",
        rows: [exportRow({ ts: "2024-05-01T10:00:00Z", ms_played: 30000 }), exportRow({ ts: "2023-01-01T10:00:00Z", ms_played: 29999 }), exportRow({ ts: "2024-01-01T10:00:00Z" })],
      },
    ]);

    expect(summariseStreamingHistory(plays)).toEqual({ from: "2023-01-01T10:00:00.000Z", to: "2024-05-01T10:00:00.000Z", playCount: 3, streamCount: 2 });
  });

  it("gives null when there are no plays", () => {
    expect(summariseStreamingHistory([])).toBeNull();
  });
});
