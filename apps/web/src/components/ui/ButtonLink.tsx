import { forwardRef } from "react";
import type { AnchorHTMLAttributes } from "react";
import { createLink } from "@tanstack/react-router";
import styles from "./Button.module.css";

interface AnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary";
}

const Anchor = forwardRef<HTMLAnchorElement, AnchorProps>(({ variant = "secondary", className, ...props }, ref) => {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(" ");
  return <a ref={ref} className={classes} {...props} />;
});

/** A router Link as a button */
export const ButtonLink = createLink(Anchor);
