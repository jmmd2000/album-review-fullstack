import type { ButtonHTMLAttributes } from "react";
import styles from "./IconButton.module.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The button has no text of its own, so this is its name. */
  "aria-label": string;
}

/** A round button holding one icon. */
export function IconButton({ className, type = "button", ...props }: IconButtonProps) {
  const classes = [styles.button, className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...props} />;
}
