import { describe, it, expect } from "vitest";

import { parseReviewContent } from "./parseReviewContent";

describe("parseReviewContent", () => {
  it("returns an empty array for empty input", () => {
    expect(parseReviewContent("")).toEqual([]);
  });

  it("returns plain text as a single text token", () => {
    expect(parseReviewContent("just a normal sentence")).toEqual([{ type: "text", content: "just a normal sentence" }]);
  });

  it("parses bold text", () => {
    expect(parseReviewContent("**loud**")).toEqual([{ type: "bold", content: "loud" }]);
  });

  it("parses italic text", () => {
    expect(parseReviewContent("*slanted*")).toEqual([{ type: "italic", content: "slanted" }]);
  });

  it("parses underlined text", () => {
    expect(parseReviewContent("__underneath__")).toEqual([{ type: "underline", content: "underneath" }]);
  });

  it("parses coloured text and keeps the hex value", () => {
    expect(parseReviewContent("{color:#fb2c36}warm red{color}")).toEqual([{ type: "colored", content: "warm red", color: "#fb2c36" }]);
  });

  it("keeps the plain text around a token", () => {
    expect(parseReviewContent("before **bold** after")).toEqual([
      { type: "text", content: "before " },
      { type: "bold", content: "bold" },
      { type: "text", content: " after" },
    ]);
  });

  it("parses a mix of every token type in order", () => {
    expect(parseReviewContent("**a** and *b* and __c__ and {color:#ff0000}d{color}")).toEqual([
      { type: "bold", content: "a" },
      { type: "text", content: " and " },
      { type: "italic", content: "b" },
      { type: "text", content: " and " },
      { type: "underline", content: "c" },
      { type: "text", content: " and " },
      { type: "colored", content: "d", color: "#ff0000" },
    ]);
  });

  it("leaves unterminated markers as plain text", () => {
    expect(parseReviewContent("**not closed")).toEqual([{ type: "text", content: "**not closed" }]);
  });

  it("rejects colour values that are not six hex digits", () => {
    expect(parseReviewContent("{color:#f00}short{color}")).toEqual([{ type: "text", content: "{color:#f00}short{color}" }]);
  });
});
