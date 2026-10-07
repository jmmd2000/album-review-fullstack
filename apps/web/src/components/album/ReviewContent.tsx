import { FormattedText } from "@/components/ui/FormattedText";
import styles from "./ReviewContent.module.css";

import type { LinkedAlbum } from "@shared/types";

interface ReviewContentProps {
  content: string;
  linkedAlbums: LinkedAlbum[];
}

// Max chars for a review to be display bigger
const SHORT_REVIEW_LENGTH = 160;

export function ReviewContent({ content, linkedAlbums }: ReviewContentProps) {
  const short = content.trim().length < SHORT_REVIEW_LENGTH;

  return (
    <section className={styles.review} data-short={short ? "" : undefined} aria-label="Review">
      <FormattedText text={content} linkedAlbums={linkedAlbums} />
    </section>
  );
}
