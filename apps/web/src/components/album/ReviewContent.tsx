import { FormattedText } from "@/components/ui/FormattedText";
import styles from "./ReviewContent.module.css";

interface ReviewContentProps {
  content: string;
}

export function ReviewContent({ content }: ReviewContentProps) {
  return (
    <section className={styles.review} aria-label="Review">
      <FormattedText text={content} />
    </section>
  );
}
