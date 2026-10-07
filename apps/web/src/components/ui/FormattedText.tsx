import { useMemo } from "react";
import { parseReviewContent } from "@shared/helpers/parseReviewContent";
import { AlbumMention } from "@/components/album/AlbumMention";
import styles from "./FormattedText.module.css";

import type { LinkedAlbum } from "@shared/types";

interface FormattedTextProps {
  text: string;
  /** The reviewed albums the text links to. A link to any other album shows as plain red text. */
  linkedAlbums?: LinkedAlbum[];
}

/**
 * Renders text written with the review marks: bold, italic, underline, colour and album links.
 */
export function FormattedText({ text, linkedAlbums = [] }: FormattedTextProps) {
  const tokens = useMemo(() => {
    const clean = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return parseReviewContent(clean);
  }, [text]);
  const albumsByID = new Map(linkedAlbums.map(album => [album.spotifyID, album]));

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
          case "album": {
            const album = albumsByID.get(token.spotifyID);
            if (!album) {
              return (
                <span key={index} className={styles.albumName}>
                  {token.content}
                </span>
              );
            }
            return (
              <AlbumMention key={index} album={album}>
                {token.content}
              </AlbumMention>
            );
          }
          default:
            return <span key={index}>{token.content}</span>;
        }
      })}
    </p>
  );
}
