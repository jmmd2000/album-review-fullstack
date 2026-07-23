import { afterEach, describe, test, expect, vi, type Mock } from "vitest";
import { SpotifyClient } from "@/api/models/SpotifyClient";
import { AppError } from "@/api/AppError";

const jsonResponse = (body: unknown, ok = true) => ({ ok, json: () => Promise.resolve(body) }) as Response;

const stubFetch = (implementation: Mock) => {
  vi.stubGlobal("fetch", implementation);
  return implementation;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestToken", () => {
  test("exchanges the client credentials for a token", async () => {
    const fetchMock = stubFetch(vi.fn().mockResolvedValue(jsonResponse({ access_token: "tok", expires_in: 3600 })));

    const result = await SpotifyClient.requestToken();
    expect(result).toEqual({ accessToken: "tok", expiresIn: 3600 });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://accounts.spotify.com/api/token");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toMatch(/^Basic /);
    expect(options.body).toBe("grant_type=client_credentials");
  });

  test("maps a rejected exchange to a 502", async () => {
    stubFetch(vi.fn().mockResolvedValue(jsonResponse({}, false)));

    const error = await SpotifyClient.requestToken().catch(e => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ status: 502, message: "Failed to get Spotify access token." });
  });

  test("maps a network failure to a 502", async () => {
    stubFetch(vi.fn().mockRejectedValue(new Error("connection reset")));

    await expect(SpotifyClient.requestToken()).rejects.toMatchObject({ status: 502, message: "Spotify authentication failed." });
  });
});

describe("searchAlbums", () => {
  test("searches with the encoded query and bearer token", async () => {
    const payload = { albums: { items: [] } };
    const fetchMock = stubFetch(vi.fn().mockResolvedValue(jsonResponse(payload)));

    const result = await SpotifyClient.searchAlbums("ok computer", "tok");
    expect(result).toEqual(payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("q=ok%20computer");
    expect(url).toContain("type=album");
    expect(url).toContain("limit=10");
    expect(options.headers.Authorization).toBe("Bearer tok");
  });

  test("maps a failed search to a 502", async () => {
    stubFetch(vi.fn().mockResolvedValue(jsonResponse({}, false)));

    await expect(SpotifyClient.searchAlbums("q", "tok")).rejects.toMatchObject({ status: 502, message: "Spotify search failed." });
  });

  test("maps a network failure to a 500", async () => {
    stubFetch(vi.fn().mockRejectedValue(new Error("connection reset")));

    await expect(SpotifyClient.searchAlbums("q", "tok")).rejects.toMatchObject({ status: 500 });
  });
});

describe("getAlbum", () => {
  test("returns the album payload as-is", async () => {
    const album = { id: "alb", name: "Album" };
    stubFetch(vi.fn().mockResolvedValue(jsonResponse(album)));

    expect(await SpotifyClient.getAlbum("alb", "tok")).toEqual(album);
  });

  test("maps an unknown album to a 404", async () => {
    stubFetch(vi.fn().mockResolvedValue(jsonResponse({}, false)));

    await expect(SpotifyClient.getAlbum("nope", "tok")).rejects.toMatchObject({ status: 404, message: "Album not found on Spotify" });
  });

  test("maps a network failure to a 500", async () => {
    stubFetch(vi.fn().mockRejectedValue(new Error("connection reset")));

    await expect(SpotifyClient.getAlbum("alb", "tok")).rejects.toMatchObject({ status: 500 });
  });
});

describe("getArtists", () => {
  test("returns empty without fetching when there are no ids", async () => {
    const fetchMock = stubFetch(vi.fn());

    expect(await SpotifyClient.getArtists([], "tok")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("fetches each artist and drops failed lookups", async () => {
    const fetchMock = stubFetch(
      vi.fn().mockImplementation((url: string) => {
        if (url.endsWith("/artists/good")) return Promise.resolve(jsonResponse({ id: "good", name: "Good" }));
        return Promise.resolve(jsonResponse({}, false));
      })
    );

    const result = await SpotifyClient.getArtists(["good", "bad"], "tok");
    expect(result).toEqual([{ id: "good", name: "Good" }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
