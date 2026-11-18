import { describe, expect, it } from "vitest";
import { restoreDraft, savedAgo } from "@/lib/reviewDraft";

import type { DisplayTrack } from "@shared/types";
import type { ReviewFormValues } from "@/lib/reviewForm";

const track = (spotifyID: string, rating = 0): DisplayTrack => ({
  spotifyID,
  artistSpotifyID: "artist",
  artistName: "Artist",
  name: `Track ${spotifyID}`,
  duration: 200000,
  features: [],
  rating,
  pick: null,
});

const form = (tracks: DisplayTrack[], reviewContent = ""): ReviewFormValues => ({
  tracks,
  reviewContent,
  bonus: 0,
  colours: [],
  genres: [],
  affectsArtistScore: true,
  creditedArtistIDs: ["artist"],
  scoreArtistIDs: ["artist"],
});

describe("restoreDraft", () => {
  it("keeps the draft's ratings, leaves new tracks unrated and drops tracks no longer on the album", () => {
    const fresh = form([track("kept"), track("new")]);
    const draft = form([{ ...track("kept", 8), pick: "best" }, track("removed", 6)], "Half written");

    const restored = restoreDraft(fresh, draft);

    expect(restored.tracks.map(each => [each.spotifyID, each.rating, each.pick])).toEqual([
      ["kept", 8, "best"],
      ["new", 0, null],
    ]);
    expect(restored.reviewContent).toBe("Half written");
  });
});

describe("savedAgo", () => {
  const now = new Date("2026-11-18T12:00:00Z");
  const before = (milliseconds: number) => new Date(now.getTime() - milliseconds);

  it("says just now inside the first minute", () => {
    expect(savedAgo(before(30_000), now)).toBe("just now");
  });

  it("counts minutes, then hours, then days", () => {
    expect(savedAgo(before(5 * 60_000), now)).toBe("5 min ago");
    expect(savedAgo(before(60 * 60_000), now)).toBe("1 hour ago");
    expect(savedAgo(before(3 * 60 * 60_000), now)).toBe("3 hours ago");
    expect(savedAgo(before(2 * 24 * 60 * 60_000), now)).toBe("2 days ago");
  });
});
