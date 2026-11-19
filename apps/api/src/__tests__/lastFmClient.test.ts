import { afterEach, describe, expect, test, vi } from "vitest";
import { LastFmClient, LastFmLimitError } from "@/api/models/LastFmClient";

vi.mock("@/helpers/sleep", () => ({ sleep: vi.fn(() => Promise.resolve()) }));

const jsonResponse = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) }) as Response;
const stubFetch = (body: unknown, status = 200) => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, status)));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LastFmClient.getSimilarArtists", () => {
  test("gives the similar artists in Last.fm's order, with each match as a number", async () => {
    stubFetch({
      similarartists: {
        artist: [
          { name: "MJ Lenderman", match: "1" },
          { name: "feeble little horse", match: "0.549918" },
        ],
      },
    });

    expect(await LastFmClient.getSimilarArtists("Wednesday")).toEqual([
      { name: "MJ Lenderman", match: 1 },
      { name: "feeble little horse", match: 0.549918 },
    ]);
  });

  test("gives null for an artist Last.fm doesn't know, which comes as an error with a 200 status", async () => {
    stubFetch({ error: 6, message: "The artist you supplied could not be found", links: [] });
    expect(await LastFmClient.getSimilarArtists("Nobody At All")).toBeNull();
  });

  test("throws a LastFmLimitError when the app sent too many requests", async () => {
    stubFetch({ error: 29, message: "Rate Limit Exceeded" }, 429);
    await expect(LastFmClient.getSimilarArtists("Wednesday")).rejects.toBeInstanceOf(LastFmLimitError);
  });

  test("throws with Last.fm's message for any other error, such as a bad key", async () => {
    stubFetch({ error: 10, message: "Invalid API key - You must be granted a valid key by last.fm" }, 403);
    await expect(LastFmClient.getSimilarArtists("Wednesday")).rejects.toThrow("Invalid API key");
  });

  test("throws when the reply is missing the fields the app reads", async () => {
    stubFetch({ similarartists: { artist: [{ name: "MJ Lenderman" }] } });
    await expect(LastFmClient.getSimilarArtists("Wednesday")).rejects.toThrow("can't read");
  });
});
