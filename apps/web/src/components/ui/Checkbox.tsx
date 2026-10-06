import { CheckIcon } from "@phosphor-icons/react";
import styles from "./Checkbox.module.css";

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** A labelled checkbox drawn as the same tick box the genre dropdown uses. */
export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label className={styles.checkbox}>
      <input type="checkbox" className={styles.input} checked={checked} onChange={event => onChange(event.currentTarget.checked)} />
      <span className={styles.box} aria-hidden="true">
        <CheckIcon weight="bold" />
      </span>
      {label}
    </label>
  );
}
