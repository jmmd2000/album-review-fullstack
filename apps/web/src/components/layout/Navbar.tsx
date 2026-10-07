import { Link, useRouterState } from "@tanstack/react-router";
import { AdminMenu } from "@/components/layout/AdminMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import styles from "./Navbar.module.css";

const PRIMARY_LINKS = [
  { to: "/", label: "Home" },
  { to: "/albums", label: "Albums" },
  { to: "/artists", label: "Artists" },
  { to: "/stats", label: "Stats" },
] as const;

export function Navbar() {
  // The home page heading is the site name, so the nav leaves it out there
  const isHome = useRouterState({ select: state => state.location.pathname === "/" });

  return (
    <header className={styles.nav}>
      {!isHome && (
        <Link to="/" className={styles.mark}>
          James Reviews Music
        </Link>
      )}
      <nav className={styles.links} aria-label="Primary">
        {PRIMARY_LINKS.map(link => (
          <Link key={link.to} to={link.to} className={styles.link} activeOptions={{ exact: link.to === "/" }}>
            {link.label}
          </Link>
        ))}
        <AdminMenu />
        <ThemeToggle />
      </nav>
    </header>
  );
}
