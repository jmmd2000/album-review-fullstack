import type { ReactNode } from "react";

interface GradientOverlayProps {
  children: ReactNode;
}

/** The fixed gradient the home page content sits on, per breakpoint. */
export const GradientOverlay = ({ children }: GradientOverlayProps) => {
  return (
    <>
      {/* Desktop gradient left to right */}
      <div className="fixed inset-x-0 bottom-0 top-17.5 md:top-20 z-10 hidden md:block bg-linear-to-r from-neutral-950 via-neutral-950/90 to-transparent">{children}</div>

      {/* Mobile gradient top to bottom */}
      <div className="fixed inset-x-0 bottom-0 top-17.5 z-10 md:hidden bg-linear-to-b from-neutral-950 via-neutral-950/70 to-neutral-950/30">{children}</div>
    </>
  );
};
