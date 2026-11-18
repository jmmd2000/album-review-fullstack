import { describe, expect, it } from "vitest";
import { genreKey, pickerRows, splitMatch } from "@/lib/genrePicker";

import type { GenreCount } from "@shared/types";
import type { PickerRow } from "@/lib/genrePicker";

const genre = (name: string, albumCount: number): GenreCount => ({ name, slug: name.replace(/ /g, "-"), albumCount });

const genres = [genre("indie rock", 20), genre("rock", 15), genre("post-rock", 6), genre("shoegaze", 4), genre("soul", 3)];

const names = (rows: PickerRow[]) => rows.map(row => (row.kind === "genre" ? row.genre.name : `+ ${row.name}`));

describe("pickerRows", () => {
  it("lists every genre in its given order when nothing is typed, leaving out picked ones", () => {
    expect(names(pickerRows(genres, "", ["Rock"]))).toEqual(["indie rock", "post-rock", "shoegaze", "soul"]);
  });

  it("puts names that start with the text before names that contain it", () => {
    expect(names(pickerRows(genres, "ro", []))).toEqual(["rock", "indie rock", "post-rock", "+ ro"]);
  });

  it("offers to add the text only when no genre has that exact name", () => {
    expect(names(pickerRows(genres, " SOUL ", []))).toEqual(["soul"]);
    expect(names(pickerRows(genres, "dream pop", []))).toEqual(["+ dream pop"]);
  });

  it("doesn't offer to add a genre that's already picked", () => {
    expect(names(pickerRows(genres, "dream pop", ["Dream Pop"]))).toEqual([]);
  });
});

describe("genreKey", () => {
  it("treats case, spaces, hyphens and '&' against 'and' as the same", () => {
    expect(genreKey("Dream-Pop")).toBe(genreKey("dream  pop"));
    expect(genreKey("r&b")).toBe(genreKey("R and B"));
  });

  it("keeps near names apart", () => {
    expect(genreKey("post-punk")).not.toBe(genreKey("post-rock"));
  });
});

describe("splitMatch", () => {
  it("splits around the first match, keeping the name's own case", () => {
    expect(splitMatch("Post-Rock", "rock")).toEqual({ before: "Post-", match: "Rock", after: "" });
  });

  it("leaves the name whole when nothing matches", () => {
    expect(splitMatch("soul", "jazz")).toEqual({ before: "soul", match: "", after: "" });
  });
});
