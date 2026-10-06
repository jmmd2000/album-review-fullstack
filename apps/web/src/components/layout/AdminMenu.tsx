import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { LockSimpleIcon, LockSimpleOpenIcon } from "@phosphor-icons/react";
import { useAuth } from "@/auth/useAuth";
import { ApiError } from "@/lib/client";
import { useDismiss } from "@/hooks/useDismiss";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import styles from "./AdminMenu.module.css";

const ADMIN_LINKS = [
  { to: "/search", label: "Review an album" },
  { to: "/bookmarks", label: "Bookmarks" },
  { to: "/settings", label: "Settings" },
] as const;

/** The lock button in the nav: a password field when signed out, the admin links when signed in. */
export function AdminMenu() {
  const { isAdmin, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (password: string) => login(password),
  });

  useDismiss(wrapperRef, () => setOpen(false));

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <IconButton
        className={styles.key}
        aria-label="Admin"
        aria-expanded={open}
        aria-controls="admin-menu"
        data-signed-in={isAdmin ? "true" : undefined}
        onClick={() => setOpen(previous => !previous)}
      >
        {isAdmin ? <LockSimpleOpenIcon weight="bold" aria-hidden="true" /> : <LockSimpleIcon weight="bold" aria-hidden="true" />}
      </IconButton>

      {open && (
        <div id="admin-menu" className={styles.menu}>
          {isAdmin ? (
            <nav aria-label="Admin">
              <ul className={styles.links}>
                {ADMIN_LINKS.map(link => (
                  <li key={link.to}>
                    <Link to={link.to} className={styles.link} onClick={() => setOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className={styles.foot}>
                <button
                  type="button"
                  className={styles.logout}
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                >
                  Log out
                </button>
              </div>
            </nav>
          ) : (
            <form
              className={styles.form}
              onSubmit={event => {
                event.preventDefault();
                const form = event.currentTarget;
                const password = new FormData(form).get("password");
                if (typeof password !== "string" || password === "") return;
                mutate(password, { onSuccess: () => form.reset() });
              }}
            >
              <label className={styles.label} htmlFor="admin-password">
                Password
              </label>
              <Input id="admin-password" name="password" type="password" autoFocus />
              <Button type="submit" variant="primary" disabled={isPending}>
                Log in
              </Button>
              {isError && <p className={styles.error}>{error instanceof ApiError ? error.message : "Login failed"}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
