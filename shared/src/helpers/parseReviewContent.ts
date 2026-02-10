/**
 * Token types for formatted review content
 */
export type FormattedToken =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'underline'; content: string }
  | { type: 'colored'; content: string; color: string };

/**
 * Parses markdown-style formatted text into structured tokens.
 * Supports:
 * - **bold** for bold text
 * - *italic* for italic text
 * - __underline__ for underlined text
 * - {color:#fb2c36}text{color} for colored text
 *
 * @param text The text to parse
 * @returns Array of formatted tokens
 */
export function parseReviewContent(text: string): FormattedToken[] {
  if (!text) return [];

  const tokens: FormattedToken[] = [];

  // Define patterns separately for readability
  const boldPattern = /\*\*([^*]+)\*\*/;
  const italicPattern = /\*([^*]+)\*/;
  const underlinePattern = /__([^_]+)__/;
  const colorPattern = /{color:#([a-fA-F0-9]{6})}([^{]+){color}/;

  // Combine with comments explaining each format
  const regex = new RegExp(
    [
      boldPattern.source,      // **bold**
      italicPattern.source,    // *italic*
      underlinePattern.source, // __underline__
      colorPattern.source,     // {color:#xxxxxx}text{color}
    ].join('|'),
    'g'
  );

  let lastEnd = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add plain text before this match
    if (lastEnd < match.index) {
      tokens.push({ type: 'text', content: text.substring(lastEnd, match.index) });
    }

    // Determine which group matched and add the token
    if (match[1]) tokens.push({ type: 'bold', content: match[1] });
    else if (match[2]) tokens.push({ type: 'italic', content: match[2] });
    else if (match[3]) tokens.push({ type: 'underline', content: match[3] });
    else if (match[4] && match[5]) tokens.push({ type: 'colored', content: match[5], color: `#${match[4]}` });

    lastEnd = match.index + match[0].length;
  }

  // Add remaining text
  if (lastEnd < text.length) {
    tokens.push({ type: 'text', content: text.substring(lastEnd) });
  }

  return tokens;
}
