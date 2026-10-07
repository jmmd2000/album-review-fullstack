import { FormattedText } from "@/components/ui/FormattedText";
import styles from "./ReviewContent.module.css";

interface ReviewContentProps {
  content: string;
}

// Max chars for a review to be display bigger
const SHORT_REVIEW_LENGTH = 160;

export function ReviewContent({ content }: ReviewContentProps) {
  const short = content.trim().length < SHORT_REVIEW_LENGTH;

  return (
    <section className={styles.review} data-short={short ? "" : undefined} aria-label="Review">
      <FormattedText text={content} />
    </section>
  );
}
