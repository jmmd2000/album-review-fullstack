import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import styles from "./Navbar.module.css";

const PRIMARY_LINKS = [
  { to: "/", label: "Home" },
  { to: "/albums", label: "Albums" },
  { to: "/artists", label: "Artists" },
  { to: "/stats", label: "Stats" },
] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header className={styles.bar}>
      <nav className={styles.links} aria-label="Primary">
        {PRIMARY_LINKS.map(link => (
          <Link key={link.to} to={link.to} className={styles.link} activeOptions={{ exact: link.to === "/" }}>
            {link.label}
          </Link>
        ))}
      </nav>

      <button type="button" className={styles.burger} aria-expanded={menuOpen} aria-label="Open menu" onClick={() => setMenuOpen(true)}>
        <span />
        <span />
        <span />
      </button>

      {menuOpen && (
        <div className={styles.takeover}>
          <button type="button" className={styles.close} aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            x
          </button>
          <nav className={styles.takeover_links} aria-label="Primary">
            {PRIMARY_LINKS.map(link => (
              <Link key={link.to} to={link.to} className={styles.takeover_link} activeOptions={{ exact: link.to === "/" }} onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
