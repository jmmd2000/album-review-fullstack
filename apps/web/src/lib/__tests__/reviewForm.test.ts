import { describe, expect, it } from "vitest";
import { formatSelection, linkAlbumSelection } from "@/lib/reviewForm";

describe("formatSelection", () => {
  it("wraps the selection and puts the cursor after the closing mark", () => {
    expect(formatSelection("a great record", 2, 7, "bold")).toEqual({ text: "a **great** record", cursor: 11 });
  });

  it("uses the colour marks the review text reads", () => {
    expect(formatSelection("see Blonde", 4, 10, "colour").text).toBe("see {color:#fb2c36}Blonde{color}");
  });
});

describe("linkAlbumSelection", () => {
  it("wraps the selection in a link to the album and puts the cursor after it", () => {
    const linked = linkAlbumSelection("see Blonde now", 4, 10, "3mH6qwIy9crq0I9YQbOuDf");
    expect(linked.text).toBe("see {album:3mH6qwIy9crq0I9YQbOuDf}Blonde{album} now");
    expect(linked.text.slice(0, linked.cursor)).toBe("see {album:3mH6qwIy9crq0I9YQbOuDf}Blonde{album}");
  });
});
