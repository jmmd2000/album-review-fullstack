import { parseReviewContent } from "./parseReviewContent";

/** Link previews cut descriptions at about this many characters */
const MAX_LENGTH = 155;
/** A sentence ends at ., ! or ?, with any closing quotes or brackets, before a space or the end of the text */
const FIRST_SENTENCE = /^.+?[.!?]+["'”’)]*(?=\s|$)/;

/** The review's words without its formatting marks, with line breaks and extra spaces made single spaces. */
export function reviewPlainText(text: string): string {
  return parseReviewContent(text)
    .map(token => token.content)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The first sentence of a review as plain text, for an album page's share description.
 * A sentence longer than 155 characters is cut at the last whole word, with an ellipsis.
 * @returns The share text, or an empty string when the review has no text.
 */
export function reviewShareText(text: string): string {
  const plain = reviewPlainText(text);
  const sentence = plain.match(FIRST_SENTENCE)?.[0] ?? plain;
  if (sentence.length <= MAX_LENGTH) return sentence;

  const cut = sentence.slice(0, MAX_LENGTH - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}
