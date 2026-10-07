import { useMemo } from "react";
import { parseReviewContent } from "@shared/helpers/parseReviewContent";
import styles from "./FormattedText.module.css";

interface FormattedTextProps {
  text: string;
}

/**
 * Renders text created with the fake markdown system
 */
export function FormattedText({ text }: FormattedTextProps) {
  const tokens = useMemo(() => {
    const clean = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return parseReviewContent(clean);
  }, [text]);

  return (
    <p className={styles.prose}>
      {tokens.map((token, index) => {
        switch (token.type) {
          case "bold":
            return <strong key={index}>{token.content}</strong>;
          case "italic":
            return <em key={index}>{token.content}</em>;
          case "underline":
            return <u key={index}>{token.content}</u>;
          case "colored":
            return (
              <span key={index} style={{ color: token.color }}>
                {token.content}
              </span>
            );
          default:
            return <span key={index}>{token.content}</span>;
        }
      })}
    </p>
  );
}
