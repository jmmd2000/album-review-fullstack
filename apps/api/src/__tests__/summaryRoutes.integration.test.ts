import { afterAll, afterEach, beforeEach, describe, expect, test } from "vitest";
import { app } from "@/app";
import { env } from "@/config/env";
import { closeDatabase, query } from "@/db/client";
import { resetTables } from "./testUtils";
import { adminCookie } from "./adminCookie";
import { PlayModel } from "@/api/models/Play";

const TOKEN = "a-made-up-summary-token-of-40-characters";
const originalToken = env.SUMMARY_TOKEN;

const getDays = (search: string, headers: Record<string, string> = { Authorization: `Bearer ${TOKEN}` }) => app.request(`/api/summary/days?${search}`, { headers });

beforeEach(async () => {
  env.SUMMARY_TOKEN = TOKEN;
  await resetTables(query);
});

afterEach(() => {
  env.SUMMARY_TOKEN = originalToken;
});

afterAll(async () => {
  await resetTables(query);
  await closeDatabase();
});

describe("GET /api/summary/days", () => {
  test("gives the days with plays to the right token", async () => {
    await PlayModel.savePlays([
      {
        played_at: "2026-07-01T10:00:00Z",
        track: {
          id: "song",
          name: "Song",
          duration_ms: 180000,
          artists: [{ id: "artist", name: "Artist" }],
          album: { id: "album", name: "Album", release_date: "2024-01-01", images: [], artists: [{ id: "artist", name: "Artist" }] },
        },
      },
    ]);

    const response = await getDays("from=2026-07-01&to=2026-07-31");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      days: [
        {
          date: "2026-07-01",
          plays: 1,
          minutes: 3,
          topArtist: { name: "Artist", plays: 1 },
          topAlbum: { name: "Album", artist: "Artist", plays: 1 },
          topTrack: { name: "Song", artist: "Artist", plays: 1 },
          reviews: [],
          gigs: [],
        },
      ],
    });
  });

  test("refuses no token, a wrong token and the admin cookie alike, and everything when no token is set", async () => {
    expect((await getDays("from=2026-07-01&to=2026-07-01", {})).status).toBe(401);
    expect((await getDays("from=2026-07-01&to=2026-07-01", { Authorization: "Bearer wrong" })).status).toBe(401);
    expect((await getDays("from=2026-07-01&to=2026-07-01", { Cookie: adminCookie() })).status).toBe(401);
    env.SUMMARY_TOKEN = undefined;
    expect((await getDays("from=2026-07-01&to=2026-07-01")).status).toBe(401);
  });

  test("the token reads nothing else", async () => {
    expect((await app.request("/api/listening", { headers: { Authorization: `Bearer ${TOKEN}` } })).status).toBe(401);
  });

  test("refuses bad dates, a reversed range and more than 31 days", async () => {
    expect((await getDays("from=2026-07-01")).status).toBe(400);
    expect((await getDays("from=1%20July&to=2026-07-02")).status).toBe(400);
    expect((await getDays("from=2026-07-02&to=2026-07-01")).status).toBe(400);
    expect((await getDays("from=2026-07-01&to=2026-08-01")).status).toBe(400);
    expect((await getDays("from=2026-07-01&to=2026-07-31")).status).toBe(200);
  });
});
