import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/auth/useAuth";
import { ApiError } from "@/lib/client";
import styles from "./AdminSheet.module.css";

const ADMIN_LINKS = [
  { to: "/bookmarks", label: "Bookmarks" },
  { to: "/search", label: "Search" },
  { to: "/settings", label: "Settings" },
] as const;

export function AdminSheet() {
  const { isAdmin, login, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: (password: string) => login(password),
  });

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button type="button" className={styles.trigger} data-admin={isAdmin ? "true" : undefined} aria-expanded={open} onClick={() => setOpen(previous => !previous)}>
        Admin
      </button>

      {open && (
        <div className={styles.sheet} data-admin={isAdmin ? "true" : undefined}>
          {isAdmin ? (
            <nav className={styles.links} aria-label="Admin">
              {ADMIN_LINKS.map(link => (
                <Link key={link.to} to={link.to} className={styles.link} onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
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
            </nav>
          ) : (
            <form
              onSubmit={event => {
                event.preventDefault();
                const form = event.currentTarget;
                const password = new FormData(form).get("password");
                if (typeof password !== "string" || password === "") return;
                mutate(password, { onSuccess: () => form.reset() });
              }}
            >
              <label className={styles.section_label} htmlFor="admin-password">
                Password
              </label>
              <div className={styles.row}>
                <input id="admin-password" name="password" type="password" autoFocus />
                <button type="submit" disabled={isPending}>
                  Enter
                </button>
              </div>
              {isError && <p className={styles.error}>{error instanceof ApiError ? error.message : "Login failed"}</p>}
            </form>
          )}
        </div>
      )}
    </>
  );
}
