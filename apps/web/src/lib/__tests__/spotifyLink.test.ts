import { describe, expect, it } from "vitest";
import { albumIDFromLink } from "@/lib/spotifyLink";

const albumID = "29HKbQ2pgXgElTnH66mFXK";

describe("albumIDFromLink", () => {
  it("reads the ID from an album link, with or without a share code or language part", () => {
    expect(albumIDFromLink(`https://open.spotify.com/album/${albumID}`)).toBe(albumID);
    expect(albumIDFromLink(` https://open.spotify.com/album/${albumID}?si=Xy12abCDtest `)).toBe(albumID);
    expect(albumIDFromLink(`https://open.spotify.com/intl-de/album/${albumID}`)).toBe(albumID);
  });

  it("reads the ID from an album URI", () => {
    expect(albumIDFromLink(`spotify:album:${albumID}`)).toBe(albumID);
  });

  it("rejects links to anything that isn't an album", () => {
    expect(albumIDFromLink(`https://open.spotify.com/track/${albumID}`)).toBeNull();
    expect(albumIDFromLink(`https://open.spotify.com/artist/${albumID}`)).toBeNull();
    expect(albumIDFromLink(`spotify:track:${albumID}`)).toBeNull();
  });

  it("rejects other sites, broken IDs and plain search text", () => {
    expect(albumIDFromLink(`https://example.com/album/${albumID}`)).toBeNull();
    expect(albumIDFromLink("https://open.spotify.com/album/short")).toBeNull();
    expect(albumIDFromLink(`spotify:album:${albumID}x`)).toBeNull();
    expect(albumIDFromLink("wednesday bleeds")).toBeNull();
  });
});
