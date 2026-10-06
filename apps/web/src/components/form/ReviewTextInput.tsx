import { useRef } from "react";
import { formatSelection } from "@/lib/reviewForm";
import { toast } from "@/lib/toast";
import styles from "./ReviewTextInput.module.css";

import type { TextFormat } from "@/lib/reviewForm";

interface ReviewTextInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** The review text box, with buttons that wrap the selected text in bold, italic, underline or colour marks. */
export function ReviewTextInput({ value, onChange }: ReviewTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: TextFormat) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) {
      toast.info("Select some text first");
      return;
    }

    const { text, cursor } = formatSelection(value, selectionStart, selectionEnd, format);
    onChange(text);
    // Waits for React to put the new text in the box, so the cursor isn't moved in the old text
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className={styles.writer}>
      <label className={styles.label} htmlFor="review-text">
        Review
      </label>
      <div className={styles.toolbar} role="toolbar" aria-label="Formatting">
        <button type="button" onClick={() => applyFormat("bold")}>
          <b>Bold</b>
        </button>
        <button type="button" onClick={() => applyFormat("italic")}>
          <i>Italic</i>
        </button>
        <button type="button" onClick={() => applyFormat("underline")}>
          <u>Underline</u>
        </button>
        <button type="button" className={styles.colour} onClick={() => applyFormat("colour")}>
          Colour
        </button>
      </div>
      <textarea id="review-text" ref={textareaRef} className={styles.text} value={value} onChange={event => onChange(event.currentTarget.value)} />
    </div>
  );
}
