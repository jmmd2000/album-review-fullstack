import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("../api/services/SpotifyService", () => ({
  SpotifyService: { getAccessToken: jest.fn(() => Promise.resolve("test-token")) },
}));

import { fetchArtistFromSpotify } from "../helpers/fetchArtistFromSpotify";

const mockFetch = jest.fn<(input: unknown, init?: unknown) => Promise<unknown>>();
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchArtistFromSpotify", () => {
  it("returns the artist and hits the id-based endpoint when Spotify responds ok", async () => {
    const artist = { id: "abc", name: "Test Artist", images: [] };
    mockFetch.mockResolvedValue({ ok: true, json: async () => artist });

    const result = await fetchArtistFromSpotify("abc");

    expect(result).toEqual(artist);
    expect(mockFetch).toHaveBeenCalledWith("https://api.spotify.com/v1/artists/abc", expect.anything());
  });

  it("returns null when Spotify responds with an error status", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "not found" }) });

    const result = await fetchArtistFromSpotify("missing");

    expect(result).toBeNull();
  });
});
