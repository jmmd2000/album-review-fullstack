import { FormattedToken } from "@shared/helpers/parseReviewContent";

/**
 * Props for the FormattedText component
 */
interface FormattedTextProps {
  /** Tokens representing formatted content */
  tokens: FormattedToken[];
}

/**
 * Renders an array of formatted tokens as React elements.
 * Maps token types to appropriate HTML elements with styling:
 * - bold → <strong> with Tailwind classes (font-black text-white)
 * - italic → <em>
 * - underline → <u>
 * - colored → <span> with inline style for dynamic color and font-weight:700
 * - text → plain text node
 *
 * @param tokens Array of formatted tokens to render
 */
export const FormattedText = ({ tokens }: FormattedTextProps) => {
  return (
    <>
      {tokens.map((token, index) => {
        switch (token.type) {
          case 'text':
            return <span key={index}>{token.content}</span>;
          case 'bold':
            return (
              <strong key={index} className="font-black text-white">
                {token.content}
              </strong>
            );
          case 'italic':
            return <em key={index}>{token.content}</em>;
          case 'underline':
            return <u key={index}>{token.content}</u>;
          case 'colored':
            return (
              <span
                key={index}
                style={{ color: token.color, fontWeight: 700 }}
              >
                {token.content}
              </span>
            );
          default:
            const _exhaustiveCheck: never = token;
            return _exhaustiveCheck;
        }
      })}
    </>
  );
};
