import { XIcon } from "@phosphor-icons/react";
import styles from "./ColourSwatches.module.css";

import type { ExtractedColor } from "@shared/types";

const MAXIMUM_COLOURS = 5;

interface ColourSwatchesProps {
  colours: ExtractedColor[];
  onChange: (colours: ExtractedColor[]) => void;
}

/** The cover colours as swatches. Clicking a swatch opens the colour picker, and up to five can be kept. */
export function ColourSwatches({ colours, onChange }: ColourSwatchesProps) {
  const replace = (index: number, hex: string) => onChange(colours.map((colour, position) => (position === index ? { hex } : colour)));
  const remove = (index: number) => onChange(colours.filter((_, position) => position !== index));

  return (
    <div className={styles.swatches}>
      {colours.map((colour, index) => (
        <span key={index} className={styles.swatch} style={{ backgroundColor: colour.hex }}>
          <input type="color" value={colour.hex} aria-label={`Colour ${index + 1}, ${colour.hex}`} onChange={event => replace(index, event.currentTarget.value)} />
          <button type="button" className={styles.remove} aria-label={`Remove colour ${index + 1}`} onClick={() => remove(index)}>
            <XIcon weight="bold" aria-hidden="true" />
          </button>
        </span>
      ))}
      {colours.length < MAXIMUM_COLOURS && (
        <button type="button" className={styles.add} aria-label="Add a colour" onClick={() => onChange([...colours, { hex: "#808080" }])}>
          +
        </button>
      )}
    </div>
  );
}
