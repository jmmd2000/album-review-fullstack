import { useRef, useState } from "react";
import { formatSelection, linkAlbumSelection } from "@/lib/reviewForm";
import { toast } from "@/lib/toast";
import { AlbumLinkPicker } from "@/components/form/AlbumLinkPicker";
import styles from "./ReviewTextInput.module.css";

import type { TextFormat } from "@/lib/reviewForm";
import type { DisplayAlbum } from "@shared/types";

interface ReviewTextInputProps {
  value: string;
  onChange: (value: string) => void;
}

interface Selection {
  start: number;
  end: number;
}

/** The review text box, with buttons that wrap the selected text in bold, italic, underline, colour or album link marks. */
export function ReviewTextInput({ value, onChange }: ReviewTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The picker's search box takes the focus, so the selection to link is kept here
  const [albumSelection, setAlbumSelection] = useState<Selection | null>(null);

  const readSelection = (): Selection | null => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.selectionStart === textarea.selectionEnd) {
      toast.info("Select some text first");
      return null;
    }
    return { start: textarea.selectionStart, end: textarea.selectionEnd };
  };

  const replaceText = ({ text, cursor }: { text: string; cursor: number }) => {
    onChange(text);
    // Waits for React to put the new text in the box, so the cursor isn't moved in the old text
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(cursor, cursor);
    });
  };

  const applyFormat = (format: TextFormat) => {
    const selection = readSelection();
    if (!selection) return;
    replaceText(formatSelection(value, selection.start, selection.end, format));
  };

  const linkAlbum = (album: DisplayAlbum) => {
    if (!albumSelection) return;
    replaceText(linkAlbumSelection(value, albumSelection.start, albumSelection.end, album.spotifyID));
    setAlbumSelection(null);
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
        <AlbumLinkPicker
          selectedText={albumSelection ? value.slice(albumSelection.start, albumSelection.end) : null}
          onOpenRequest={() => setAlbumSelection(readSelection())}
          onClose={() => setAlbumSelection(null)}
          onPick={linkAlbum}
          returnFocusTo={textareaRef}
        />
      </div>
      <textarea id="review-text" ref={textareaRef} className={styles.text} value={value} onChange={event => onChange(event.currentTarget.value)} />
    </div>
  );
}
