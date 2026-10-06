import { describe, expect, it } from "vitest";
import { formatSelection } from "@/lib/reviewForm";

describe("formatSelection", () => {
  it("wraps the selection and puts the cursor after the closing mark", () => {
    expect(formatSelection("a great record", 2, 7, "bold")).toEqual({ text: "a **great** record", cursor: 11 });
  });

  it("uses the colour marks the review text reads", () => {
    expect(formatSelection("see Blonde", 4, 10, "colour").text).toBe("see {color:#fb2c36}Blonde{color}");
  });
});
