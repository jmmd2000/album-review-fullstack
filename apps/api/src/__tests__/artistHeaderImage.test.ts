import { describe, test, expect } from "vitest";
import { readHeaderImage } from "@/helpers/artistHeaderImage";

const spotifyID = "1Xyo4u8uXC1ZmMpatF05PJ";

// Trimmed from the web player's queryArtistOverview reply for The Weeknd
const sources = [
  { maxHeight: 640, maxWidth: 1494, url: "https://image-cdn-fa.spotifycdn.com/image/ab67618600000194ca40d0e310d671f99295b14c" },
  { maxHeight: 1080, maxWidth: 1920, url: "https://i2o.scdn.co/image/ab67618600001667ca40d0e310d671f99295b14c" },
  { maxHeight: 1140, maxWidth: 2660, url: "https://image-cdn-fa.spotifycdn.com/image/ab6761860000eab1ca40d0e310d671f99295b14c" },
  { maxHeight: 641, maxWidth: 1495, url: "https://image-cdn-fa.spotifycdn.com/image/ab67618600009d80ca40d0e310d671f99295b14c" },
];

const overview = (headerImage: unknown, id = spotifyID) => ({
  data: { artistUnion: { __typename: "Artist", id, headerImage, visuals: { avatarImage: null } } },
});

describe("readHeaderImage", () => {
  test("picks the widest header", () => {
    const result = readHeaderImage(overview({ data: { __typename: "ImageV2", sources } }), spotifyID);
    expect(result).toEqual({ status: "found", url: "https://image-cdn-fa.spotifycdn.com/image/ab6761860000eab1ca40d0e310d671f99295b14c" });
  });

  test("gives none when Spotify says the artist has no header", () => {
    expect(readHeaderImage(overview(null), spotifyID)).toEqual({ status: "none" });
  });

  test("skips a source that isn't on Spotify's image CDN", () => {
    const withCookieIcon = [{ maxHeight: 2000, maxWidth: 4000, url: "https://cdn.cookielaw.org/logos/static/ot_close.svg" }, sources[0]];
    const result = readHeaderImage(overview({ data: { sources: withCookieIcon } }), spotifyID);
    expect(result).toEqual({ status: "found", url: sources[0].url });
  });

  test.each([
    ["a reply for another artist", overview(null, "0kGweFvHWUfh6oLnookVeO")],
    ["a header with no Spotify image URL", overview({ data: { sources: [{ maxHeight: 1, maxWidth: 1, url: "https://cdn.cookielaw.org/logos/static/ot_close.svg" }] } })],
    ["a header with no sources", overview({ data: { sources: [] } })],
    ["a reply with no artist", { data: { artistUnion: null } }],
    ["an error reply", { errors: [{ message: "rate limited" }] }],
  ])("fails on %s", (_label, response) => {
    expect(readHeaderImage(response, spotifyID)).toEqual({ status: "failed" });
  });
});
