import { describe, test, expect } from "vitest";
import { isSameImage, spotifyImageID } from "@/helpers/spotifyImageID";

describe("spotifyImageID", () => {
  test("gives the same ID for one header on any host and at any size", () => {
    const urls = [
      "https://image-cdn-fa.spotifycdn.com/image/ab67618600000194ca40d0e310d671f99295b14c",
      "https://image-cdn-ak.spotifycdn.com/image/ab67618600000194ca40d0e310d671f99295b14c",
      "https://i2o.scdn.co/image/ab67618600001667ca40d0e310d671f99295b14c",
    ];
    expect(urls.map(spotifyImageID)).toEqual(["ca40d0e310d671f99295b14c", "ca40d0e310d671f99295b14c", "ca40d0e310d671f99295b14c"]);
  });

  test("gives the same ID for each size of an artist photo", () => {
    expect(spotifyImageID("https://i.scdn.co/image/ab6761610000e5ebc65d8681d3d4dbb49dd6ff83")).toBe("c65d8681d3d4dbb49dd6ff83");
    expect(spotifyImageID("https://i.scdn.co/image/ab6761610000f178c65d8681d3d4dbb49dd6ff83")).toBe("c65d8681d3d4dbb49dd6ff83");
  });

  test("ignores a query string", () => {
    expect(spotifyImageID("https://i.scdn.co/image/ab6761610000e5ebc65d8681d3d4dbb49dd6ff83?t=123")).toBe("c65d8681d3d4dbb49dd6ff83");
  });

  test("keeps the whole ID of an older image with no type and size code", () => {
    expect(spotifyImageID("https://i.scdn.co/image/1775d9f7014a98731b06cde197bd89c6fd71e4ba")).toBe("1775d9f7014a98731b06cde197bd89c6fd71e4ba");
  });

  test.each([
    ["a URL from another host", "https://cdn.cookielaw.org/logos/static/ot_close.svg"],
    ["an image path on another host", "https://example.com/image/ab67618600000194ca40d0e310d671f99295b14c"],
    ["a Spotify URL with no image ID", "https://i.scdn.co/image/not-an-id"],
    ["something that isn't a URL", "same.jpg"],
  ])("gives back %s unchanged", (_label, url) => {
    expect(spotifyImageID(url)).toBe(url);
  });
});

describe("isSameImage", () => {
  test("matches one picture across hosts and sizes", () => {
    expect(isSameImage("https://image-cdn-fa.spotifycdn.com/image/ab67618600000194ca40d0e310d671f99295b14c", "https://i2o.scdn.co/image/ab67618600001667ca40d0e310d671f99295b14c")).toBe(true);
  });

  test("tells two pictures apart", () => {
    expect(isSameImage("https://i2o.scdn.co/image/ab67618600001667ca40d0e310d671f99295b14c", "https://i2o.scdn.co/image/ab67618600001667c6ec4ec52e4a15d1ef981259")).toBe(false);
  });

  test("counts two missing images as the same, and one missing image as a change", () => {
    expect(isSameImage(null, undefined)).toBe(true);
    expect(isSameImage(null, "https://i2o.scdn.co/image/ab67618600001667ca40d0e310d671f99295b14c")).toBe(false);
    expect(isSameImage("https://i2o.scdn.co/image/ab67618600001667ca40d0e310d671f99295b14c", undefined)).toBe(false);
  });
});
