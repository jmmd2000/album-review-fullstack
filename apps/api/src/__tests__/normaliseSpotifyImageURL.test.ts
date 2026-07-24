import { describe, test, expect } from "vitest";
import { normalizeSpotifyImageUrl, areImageUrlsSame } from "@/helpers/normaliseSpotifyImageURL";

describe("normalizeSpotifyImageUrl", () => {
  test("normalises every spotify cdn hostname to the same one", () => {
    expect(normalizeSpotifyImageUrl("https://image-cdn-fa.spotifycdn.com/image/abc")).toBe("https://image-cdn-ak.spotifycdn.com/image/abc");
  });

  test("strips cache-busting parameters and keeps the rest", () => {
    const result = normalizeSpotifyImageUrl("https://example.com/img?_=1&t=2&timestamp=3&cache=4&keep=yes");
    expect(result).toBe("https://example.com/img?keep=yes");
  });

  test("upgrades http to https", () => {
    expect(normalizeSpotifyImageUrl("http://example.com/img")).toBe("https://example.com/img");
  });

  test("sorts the remaining parameters", () => {
    expect(normalizeSpotifyImageUrl("https://example.com/img?b=2&a=1")).toBe("https://example.com/img?a=1&b=2");
  });

  test("returns something unparseable unchanged", () => {
    expect(normalizeSpotifyImageUrl("not a url")).toBe("not a url");
  });
});

describe("areImageUrlsSame", () => {
  test("matches the same images despite order and cache params", () => {
    const current = ["https://example.com/a?t=1", "https://example.com/b"];
    const fetched = ["https://example.com/b?cache=9", "https://example.com/a"];
    expect(areImageUrlsSame(current, fetched)).toBe(true);
  });

  test("differs when the lengths differ", () => {
    expect(areImageUrlsSame(["https://example.com/a"], [])).toBe(false);
  });

  test("differs when an image differs", () => {
    expect(areImageUrlsSame(["https://example.com/a"], ["https://example.com/b"])).toBe(false);
  });
});
