import { describe, expect, test } from "vitest";
import { isNewStudioAlbum, parseReleaseDate } from "@/helpers/newAlbums";

const now = new Date("2026-11-19T12:00:00Z");
const album = (name: string, releaseDate: string) => ({ name, releaseDate });

describe("parseReleaseDate", () => {
  test("reads a year or a month as its first day", () => {
    expect(parseReleaseDate("2026-11-07").toISOString()).toBe("2026-11-07T00:00:00.000Z");
    expect(parseReleaseDate("2026-11").toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(parseReleaseDate("2026").toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("isNewStudioAlbum", () => {
  test("keeps a studio album released in the last 90 days", () => {
    expect(isNewStudioAlbum(album("Dopamine Chamber", "2026-10-03"), now)).toBe(true);
    expect(isNewStudioAlbum(album("Pylon", "2026-08-22"), now)).toBe(true);
  });

  test("leaves out an album older than 90 days or not released yet", () => {
    expect(isNewStudioAlbum(album("Bleeds", "2026-08-19"), now)).toBe(false);
    expect(isNewStudioAlbum(album("Next Year's Record", "2026-12-05"), now)).toBe(false);
  });

  test("leaves out live albums, reissues and soundtracks by their name", () => {
    for (const name of [
      "Live at the Roundhouse",
      "Bleeds (Deluxe)",
      "Rat Saw God (10th Anniversary Edition)",
      "Blue (Remastered)",
      "Jackie (Original Motion Picture Soundtrack)",
      "Wicked Little Letters (Original Score)",
      "Expanded Universe",
    ]) {
      expect(isNewStudioAlbum(album(name, "2026-11-01"), now), name).toBe(false);
    }
  });

  test("keeps a name that only contains one of those words inside another word", () => {
    expect(isNewStudioAlbum(album("Olivia", "2026-11-01"), now)).toBe(true);
    expect(isNewStudioAlbum(album("Deliverance", "2026-11-01"), now)).toBe(true);
  });
});
