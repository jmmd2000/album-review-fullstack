import { afterEach, describe, expect, test, vi } from "vitest";
import { LastFmClient, LastFmLimitError } from "@/api/models/LastFmClient";
import { ListenerLinkModel, type LinkableArtist } from "@/api/models/ListenerLink";
import { ListenerLinkService } from "@/api/services/ListenerLinkService";
import { AlbumModel } from "@/api/models/Album";
import { normaliseArtistName } from "@/helpers/artistName";
import { closestLinkByArtist } from "@/helpers/similarAlbums";
import * as errorReporting from "@/config/errorReporting";
import type { JobEmit } from "@/api/services/JobService";

const artist = (name: string): LinkableArtist => ({ spotifyID: name, name, imageURLs: [] });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("normaliseArtistName", () => {
  test("ignores case, accents, curly apostrophes, & against and, and extra spaces", () => {
    expect(normaliseArtistName("  Beyoncé & JAY‐Z ")).toBe(normaliseArtistName("beyonce and jay-z"));
    expect(normaliseArtistName("Guns N’ Roses")).toBe(normaliseArtistName("guns n' roses"));
    expect(normaliseArtistName("Sigur Rós")).not.toBe(normaliseArtistName("Sigur Ros Band"));
  });
});

describe("closestLinkByArtist", () => {
  test("finds reviewed artists by name and keeps each one's closest place", () => {
    const links = [
      { linkedName: "Kim Petras", position: 1 },
      { linkedName: "SOPHIE", position: 3 },
      { linkedName: "Not Reviewed", position: 2 },
      { linkedName: "kim petras", position: 7 },
    ];
    const reviewedArtists = [
      { spotifyID: "kim", name: "Kim Petras" },
      { spotifyID: "sophie", name: "Sophie" },
      { spotifyID: "other", name: "Someone Else" },
    ];

    expect(closestLinkByArtist(links, reviewedArtists)).toEqual(
      new Map([
        ["kim", 1],
        ["sophie", 3],
      ])
    );
  });
});

describe("refreshAllArtists", () => {
  test("reports each artist's outcome, and an artist Last.fm doesn't know as failed", async () => {
    vi.spyOn(ListenerLinkModel, "getAllArtists").mockResolvedValue([artist("known"), artist("unknown"), artist("broken")]);
    vi.spyOn(ListenerLinkModel, "getLinkedNames").mockResolvedValue([]);
    vi.spyOn(ListenerLinkModel, "replaceLinks").mockResolvedValue(true);
    vi.spyOn(LastFmClient, "getSimilarArtists").mockImplementation(async name => {
      if (name === "unknown") return null;
      if (name === "broken") throw new Error("Last.fm is down");
      return [{ name: "Linked", match: 1 }];
    });
    const events: string[] = [];
    const emit: JobEmit = (event, data) => events.push(event === "failed" ? `failed: ${(data as { message: string }).message}` : event);

    await ListenerLinkService.refreshAllArtists(emit);

    expect(events.filter(event => event !== "progress")).toEqual(["changed", "failed: No match on Last.fm", "failed: Last.fm is down"]);
  });

  test("stops the run when Last.fm refuses more requests", async () => {
    vi.spyOn(ListenerLinkModel, "getAllArtists").mockResolvedValue([artist("first"), artist("second")]);
    const similar = vi.spyOn(LastFmClient, "getSimilarArtists").mockRejectedValue(new LastFmLimitError("too many"));

    await expect(ListenerLinkService.refreshAllArtists(() => {})).rejects.toBeInstanceOf(LastFmLimitError);
    expect(similar).toHaveBeenCalledTimes(1);
  });
});

describe("linkNewArtists", () => {
  test("refreshes only the album's artists with no saved links, and reports a failure instead of throwing", async () => {
    vi.mocked(ListenerLinkService.linkNewArtists).mockRestore();
    vi.spyOn(AlbumModel, "getAlbumArtistIDs").mockResolvedValue(["linked", "new"]);
    const withoutLinks = vi.spyOn(ListenerLinkModel, "getArtistsWithoutLinks").mockResolvedValue([artist("new")]);
    const error = new Error("Last.fm is down");
    const refresh = vi.spyOn(ListenerLinkService, "refreshArtist").mockRejectedValue(error);
    const report = vi.spyOn(errorReporting, "reportError").mockImplementation(() => {});

    await ListenerLinkService.linkNewArtists("album");

    expect(withoutLinks).toHaveBeenCalledWith(["linked", "new"]);
    expect(refresh.mock.calls.map(([refreshed]) => refreshed.spotifyID)).toEqual(["new"]);
    expect(report).toHaveBeenCalledWith(error, { job: "listener-links" });
  });
});
