import { afterEach, describe, expect, test, vi } from "vitest";
import { DeezerClient, DeezerLimitError } from "@/api/models/DeezerClient";
import { ListenerLinkModel, type LinkableArtist } from "@/api/models/ListenerLink";
import { ListenerLinkService, findMatchingArtist, normaliseArtistName } from "@/api/services/ListenerLinkService";
import type { JobEmit } from "@/api/services/JobService";
import { AlbumModel } from "@/api/models/Album";
import * as errorReporting from "@/config/errorReporting";

vi.mock("@/helpers/sleep", () => ({ sleep: vi.fn(() => Promise.resolve()) }));

const jsonResponse = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as Response;
const hit = (title: string, id: number, name: string) => ({ title, artist: { id, name } });
const artist = (spotifyID: string, deezerID: number | null = null): LinkableArtist => ({ spotifyID, name: spotifyID, deezerID, imageURLs: [] });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("normaliseArtistName", () => {
  test("ignores case, accents, curly apostrophes, & against and, and extra spaces", () => {
    expect(normaliseArtistName("  Beyoncé & JAY‐Z ")).toBe(normaliseArtistName("beyonce and jay-z"));
    expect(normaliseArtistName("Guns N’ Roses")).toBe(normaliseArtistName("guns n' roses"));
    expect(normaliseArtistName("Sigur Rós")).not.toBe(normaliseArtistName("Sigur Ros Band"));
  });
});

describe("findMatchingArtist", () => {
  test("picks the hit whose artist has the same name, not the first hit", () => {
    const hits = [hit("Wednesday (Original Soundtrack)", 1, "Wednesday Addams"), hit("Bleeds", 87096062, "Wednesday")];
    expect(findMatchingArtist(hits, "Wednesday")).toBe(87096062);
  });

  test("gives null when only a different artist matches the search", () => {
    expect(findMatchingArtist([hit("Wednesday (Original Soundtrack)", 1, "Wednesday Addams")], "Wednesday")).toBeNull();
    expect(findMatchingArtist([], "Wednesday")).toBeNull();
  });
});

describe("findDeezerID", () => {
  test("tries the artist's next album when one gives no match", async () => {
    vi.spyOn(ListenerLinkModel, "getAlbumNames").mockResolvedValue(["Rat Saw God", "Bleeds"]);
    const search = vi
      .spyOn(DeezerClient, "searchAlbums")
      .mockResolvedValueOnce([hit("Rat Saw God", 5, "Someone Else")])
      .mockResolvedValueOnce([hit("Bleeds", 87096062, "Wednesday")]);

    expect(await ListenerLinkService.findDeezerID({ ...artist("wednesday"), name: "Wednesday" })).toBe(87096062);
    expect(search).toHaveBeenCalledTimes(2);
  });
});

describe("DeezerClient", () => {
  test("an error sent with a 200 status throws, and a quota error throws a DeezerLimitError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: { type: "Exception", message: "Quota limit exceeded", code: 4 } })));
    await expect(DeezerClient.getRelatedArtists(1)).rejects.toBeInstanceOf(DeezerLimitError);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: { type: "OAuthException", message: "Invalid query", code: 600 } })));
    await expect(DeezerClient.getRelatedArtists(1)).rejects.toThrow("Invalid query");
  });

  test("a 'no data' error gives an empty list", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: { type: "DataException", message: "no data", code: 800 } })));
    expect(await DeezerClient.getRelatedArtists(1)).toEqual([]);
  });

  test("a reply without the expected fields throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ data: [{ id: "not a number" }] })));
    await expect(DeezerClient.getRelatedArtists(1)).rejects.toThrow("can't read");
  });
});

describe("refreshAllArtists", () => {
  test("reports each artist's outcome, and an unmatched artist as failed", async () => {
    vi.spyOn(ListenerLinkModel, "getAllArtists").mockResolvedValue([artist("matched", 10), artist("unmatched"), artist("broken", 30)]);
    vi.spyOn(ListenerLinkModel, "getAlbumNames").mockResolvedValue([]);
    vi.spyOn(ListenerLinkModel, "getLinkedDeezerIDs").mockResolvedValue([]);
    vi.spyOn(ListenerLinkModel, "replaceLinks").mockResolvedValue(true);
    vi.spyOn(DeezerClient, "getRelatedArtists").mockImplementation(async deezerID => {
      if (deezerID === 30) throw new Error("Deezer is down");
      return [{ id: 99, name: "Linked" }];
    });
    const events: string[] = [];
    const emit: JobEmit = (event, data) => events.push(event === "failed" ? `failed: ${(data as { message: string }).message}` : event);

    await ListenerLinkService.refreshAllArtists(emit);

    expect(events.filter(event => event !== "progress")).toEqual(["changed", "failed: No match on Deezer", "failed: Deezer is down"]);
  });

  test("stops the run when Deezer refuses more requests", async () => {
    vi.spyOn(ListenerLinkModel, "getAllArtists").mockResolvedValue([artist("first", 10), artist("second", 20)]);
    const related = vi.spyOn(DeezerClient, "getRelatedArtists").mockRejectedValue(new DeezerLimitError("too many"));

    await expect(ListenerLinkService.refreshAllArtists(() => {})).rejects.toBeInstanceOf(DeezerLimitError);
    expect(related).toHaveBeenCalledTimes(1);
  });
});

describe("linkUnmatchedArtists", () => {
  test("refreshes only the album's artists with no Deezer match, and reports a failure instead of throwing", async () => {
    vi.mocked(ListenerLinkService.linkUnmatchedArtists).mockRestore();
    vi.spyOn(AlbumModel, "getAlbumArtistIDs").mockResolvedValue(["matched", "unmatched"]);
    vi.spyOn(ListenerLinkModel, "getArtistsBySpotifyIDs").mockResolvedValue([artist("matched", 10), artist("unmatched")]);
    const error = new Error("Deezer is down");
    const refresh = vi.spyOn(ListenerLinkService, "refreshArtist").mockRejectedValue(error);
    const report = vi.spyOn(errorReporting, "reportError").mockImplementation(() => {});

    await ListenerLinkService.linkUnmatchedArtists("album");

    expect(refresh.mock.calls.map(([refreshed]) => refreshed.spotifyID)).toEqual(["unmatched"]);
    expect(report).toHaveBeenCalledWith(error, { job: "listener-links" });
  });
});
