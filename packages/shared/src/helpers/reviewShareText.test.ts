import { describe, expect, it } from "vitest";

import { reviewPlainText, reviewShareText } from "./reviewShareText";

describe("reviewPlainText", () => {
  it("keeps the words of formatted text and album links without the marks", () => {
    const review = "**Huge** record. It's *so* __good__, {color:#fb2c36}red hot{color}, better than {album:4yP0hdKOZPNshxUOjY0cZj}Bleeds{album}.";
    expect(reviewPlainText(review)).toBe("Huge record. It's so good, red hot, better than Bleeds.");
  });

  it("turns line breaks and runs of spaces into single spaces", () => {
    expect(reviewPlainText("  First line.\n\nSecond   line.  ")).toBe("First line. Second line.");
  });
});

describe("reviewShareText", () => {
  it("gives only the first sentence", () => {
    expect(reviewShareText("**Huge** record. Every track lands. Ten out of ten.")).toBe("Huge record.");
    expect(reviewShareText("Is this the best album of the year? Maybe.")).toBe("Is this the best album of the year?");
  });

  it("keeps a closing quote with the sentence it ends", () => {
    expect(reviewShareText('She sings "it\'s over." Then it starts again.')).toBe('She sings "it\'s over."');
  });

  it("gives the whole text when it has no sentence ending", () => {
    expect(reviewShareText("a short note with no full stop")).toBe("a short note with no full stop");
  });

  it("cuts a sentence longer than 155 characters at the last whole word, with an ellipsis", () => {
    const longSentence = `${"word ".repeat(40).trim()}.`;
    const shareText = reviewShareText(longSentence);

    expect(shareText.length).toBeLessThanOrEqual(155);
    expect(shareText.endsWith("word…")).toBe(true);
  });

  it("gives an empty string for a review with no text", () => {
    expect(reviewShareText("")).toBe("");
  });
});
