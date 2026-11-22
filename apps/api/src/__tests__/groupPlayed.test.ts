import { expect, test } from "vitest";
import { groupAlbums, groupTracks, sameAlbumName, type AlbumToGroup, type TrackToGroup } from "@/helpers/groupPlayed";

const album = (spotifyID: string, isrcs: string[], extra: Partial<AlbumToGroup> = {}): AlbumToGroup => ({
  spotifyID,
  name: spotifyID,
  albumType: "album",
  artistSpotifyID: "artist",
  plays: 1,
  isrcs,
  ...extra,
});

const track = (spotifyID: string, isrc: string | null, albumSpotifyID: string | null, extra: Partial<TrackToGroup> = {}): TrackToGroup => ({
  spotifyID,
  name: "Song",
  isrc,
  albumSpotifyID,
  plays: 1,
  ...extra,
});

const reviewedAlbum = (spotifyID: string, isrcs: string[]) => ({ spotifyID, name: spotifyID, artistSpotifyID: "artist", isrcs });

const mainOf = (groups: Map<string, { mainSpotifyID: string }>, spotifyID: string) => groups.get(spotifyID)?.mainSpotifyID;

test("two copies of an album show as the reviewed copy, even when the other has more plays", () => {
  const groups = groupAlbums(
    [album("reviewed", ["a", "b"], { name: "Imaginal Disk", plays: 101 }), album("copy", ["a", "b"], { name: "Imaginal Disk", plays: 500 })],
    [{ ...reviewedAlbum("reviewed", ["a", "b"]), name: "Imaginal Disk" }]
  );

  expect(groups.get("copy")).toEqual({ mainSpotifyID: "reviewed", reviewedSpotifyID: "reviewed" });
});

test("a played copy joins the reviewed album of the same name, though the reviewed copy itself was never played", () => {
  const groups = groupAlbums([album("copy", ["a"], { name: "Imaginal Disk" })], [{ ...reviewedAlbum("reviewed", ["a", "b"]), name: "Imaginal Disk" }]);

  expect(groups.get("copy")).toEqual({ mainSpotifyID: "copy", reviewedSpotifyID: "reviewed" });
});

test("a deluxe edition joins its album, and the group shows as the most played", () => {
  const groups = groupAlbums([album("standard", ["a"], { name: "Stoney", plays: 3 }), album("deluxe", ["a", "bonus"], { name: "Stoney (Deluxe)", plays: 9 })], []);

  expect(mainOf(groups, "standard")).toBe("deluxe");
});

test("a clean version with its own ISRCs joins its album by name", () => {
  const groups = groupAlbums([album("explicit", ["a"], { name: "Stoney (Deluxe)" }), album("clean", ["a-clean"], { name: "Stoney (Deluxe)" })], []);

  expect(mainOf(groups, "clean")).toBe(mainOf(groups, "explicit"));
});

test("album names match when they're the same, or one is the other with an edition after it", () => {
  expect(sameAlbumName("F-1 Trillion", "F-1 Trillion: Long Bed")).toBe(true);
  expect(sameAlbumName("Stoney", "Stoney (Deluxe)")).toBe(true);
  expect(sameAlbumName("Weezer (Blue Album)", "Weezer (Green Album)")).toBe(false);
  expect(sameAlbumName("Lost", "Lost Weekend")).toBe(false);
});

test("a best-of that Spotify labels as an album doesn't take in the albums it shares recordings with", () => {
  const groups = groupAlbums([album("studio", ["a"], { name: "The Marshall Mathers LP" }), album("best of", ["a"], { name: "Curtain Call (Deluxe)", plays: 40 })], []);

  expect(mainOf(groups, "studio")).toBe("studio");
});

test("albums by different artists don't join", () => {
  const groups = groupAlbums([album("first", ["a"]), album("second", ["a"], { artistSpotifyID: "someone else", name: "first" })], []);

  expect(mainOf(groups, "second")).toBe("second");
});

test("a single joins its album, and the group still shows as the album when the single has more plays", () => {
  const groups = groupAlbums([album("album", ["a", "b"], { plays: 2 }), album("single", ["a"], { albumType: "single", plays: 50 })], []);

  expect(mainOf(groups, "single")).toBe("album");
  expect(mainOf(groups, "album")).toBe("album");
});

test("an EP with a song that isn't on the album stays apart", () => {
  const groups = groupAlbums([album("album", ["a"]), album("ep", ["a", "only on the ep"], { albumType: "single" })], []);

  expect(mainOf(groups, "ep")).toBe("ep");
});

test("an EP whose songs are on two different albums doesn't join them together", () => {
  const groups = groupAlbums([album("first", ["a"]), album("second", ["b"]), album("ep", ["a", "b"], { albumType: "single" })], []);

  expect(mainOf(groups, "first")).toBe("first");
  expect(mainOf(groups, "second")).toBe("second");
  expect(mainOf(groups, "ep")).toBe("ep");
});

test("a compilation doesn't join the albums it takes songs from", () => {
  const groups = groupAlbums([album("album", ["a"]), album("best of", ["a"], { albumType: "compilation", plays: 40 })], []);

  expect(mainOf(groups, "best of")).toBe("best of");
  expect(mainOf(groups, "album")).toBe("album");
});

test("copies of a track get the rating of the reviewed copy they share a recording with", () => {
  const albums = groupAlbums(
    [album("reviewed album", ["isrc"], { name: "Album" }), album("copy album", ["isrc"], { name: "Album" })],
    [{ ...reviewedAlbum("reviewed album", ["isrc"]), name: "Album" }]
  );
  const tracks = groupTracks(
    [track("reviewed", "isrc", "reviewed album", { plays: 101 }), track("copy", "isrc", "copy album", { plays: 27 })],
    [{ spotifyID: "reviewed", name: "Song", isrc: "isrc", albumSpotifyID: "reviewed album" }],
    albums
  );

  expect(tracks.get("copy")).toEqual({ mainSpotifyID: "reviewed", reviewedSpotifyID: "reviewed" });
});

test("a track played only as a copy still finds the reviewed track by its recording", () => {
  const tracks = groupTracks([track("copy", "isrc", "copy album")], [{ spotifyID: "reviewed", name: "Song", isrc: "isrc", albumSpotifyID: "reviewed album" }], new Map());

  expect(tracks.get("copy")).toEqual({ mainSpotifyID: "copy", reviewedSpotifyID: "reviewed" });
});

test("a clean version joins its explicit track by name on the same album, and gets its rating", () => {
  const albums = groupAlbums([album("explicit album", ["explicit"], { name: "Album" }), album("clean album", ["clean"], { name: "Album" })], [reviewedAlbum("explicit album", ["explicit"])]);
  const tracks = groupTracks(
    [track("explicit", "explicit", "explicit album"), track("clean", "clean", "clean album")],
    [{ spotifyID: "reviewed", name: "Song", isrc: "explicit", albumSpotifyID: "explicit album" }],
    albums
  );

  expect(tracks.get("clean")).toEqual({ mainSpotifyID: "explicit", reviewedSpotifyID: "reviewed" });
});

test("tracks with the same name on different albums stay apart", () => {
  const albums = groupAlbums([album("first", ["a"]), album("second", ["b"])], []);
  const tracks = groupTracks([track("intro one", "a", "first", { name: "Intro" }), track("intro two", "b", "second", { name: "Intro" })], [], albums);

  expect(mainOf(tracks, "intro two")).toBe("intro two");
});
