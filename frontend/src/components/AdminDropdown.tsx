import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Settings,
  Search,
  Lock,
  LockOpen,
  Pencil,
  Trash,
  LogOut,
} from "lucide-react";
import { useState, useRef, useEffect, JSX } from "react";
import { useAuth } from "@/auth/useAuth";
import { queryClient } from "@/main";
import {
  ReviewedAlbum,
  ReviewedArtist,
  DisplayTrack,
  Genre,
} from "@shared/types";
import { timeAgo } from "@shared/helpers/formatDate";
const API_BASE_URL = import.meta.env.VITE_API_URL;

interface LinkItem {
  label: string;
  icon: JSX.Element;
  to: string;
  onClick?: () => void;
}

const staticLinks: LinkItem[] = [
  { label: "Search", icon: <Search className="w-4 h-4" />, to: "/search" },
  {
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    to: "/settings",
  },
  {
    label: "Bookmarks",
    icon: <Bookmark className="w-4 h-4" />,
    to: "/bookmarks",
  },
];

/**
 * Shows a password prompt when not authed
 * or the admin links (and album edit/delete) when authed
 */
const AdminDropdown = () => {
  const { isAdmin, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {
    location: { pathname },
  } = useRouterState();

  // Extract albumID when on /albums/:id
  const match = pathname.match(/^\/albums\/([^/]+)$/);
  const albumID = match?.[1];

  // Get cached album data if it exists
  const albumData = albumID
    ? (queryClient.getQueryData(["albumReview", albumID]) as {
        album: ReviewedAlbum;
        artist: ReviewedArtist;
        tracks: DisplayTrack[];
        allGenres: Genre[];
        albumGenres: Genre[];
      })
    : null;

  const handleDelete = async () => {
    if (!albumID) return;
    if (!confirm("Are you sure you want to delete this album?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/albums/${albumID}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });

      navigate({ to: "/albums" });
    } catch {
      alert("Something went wrong while deleting the album.");
    }
  };

  // Submit password to log in
  const handleLogin = async () => {
    try {
      await login(password);
      setError("");
      setPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  // Clear auth cookie and close menu
  const handleLogout = async () => {
    await logout();
    setOpen(false);
  };

  // Add dynamic links once authed
  const links: LinkItem[] = isAdmin
    ? [
        ...staticLinks,
        ...(albumID
          ? [
              {
                label: "Edit Album",
                icon: <Pencil className="w-4 h-4" />,
                to: `/albums/${albumID}/edit`,
              },
              {
                label: "Delete Album",
                icon: <Trash className="w-4 h-4" />,
                to: "",
                onClick: handleDelete,
              },
            ]
          : []),
      ]
    : [];

  // Close the dropdown on outside click or scroll
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", handler);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(prevOpen => !prevOpen)}
        className="inline-flex items-center gap-2 rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Admin
        {isAdmin ? (
          <LockOpen className="w-4 h-4 text-green-700" />
        ) : (
          <Lock className="w-4 h-4 text-red-700" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-10 ${isAdmin ? "-top-48" : "-top-32"} -right-28 -mr-3 mt-0 w-56 origin-bottom-left sm:origin-top-right rounded-md bg-neutral-900 shadow-lg ring-1 ring-neutral-700 overflow-hidden sm:mt-2 sm:top-auto sm:right-0 sm:mr-0`}
          >
            {!isAdmin ? (
              <div className="flex flex-col gap-2 p-4">
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Admin password"
                  className="w-full rounded bg-neutral-800 px-3 py-2 text-neutral-200"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button
                  onClick={handleLogin}
                  className="rounded bg-gradient-to-br from-red-800 to-red-900/60  px-4 py-2 text-sm text-white hover:from-red-700 hover:to-red-800/60 cursor-pointer transition-colors"
                >
                  Login
                </button>
              </div>
            ) : (
              <>
                {links.map(link => (
                  <AdminLinkItem
                    key={link.label}
                    icon={link.icon}
                    label={link.label}
                    to={link.to}
                    onClick={link.onClick}
                  />
                ))}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-red-500 hover:font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
                {albumData && (
                  <div className="text-xs text-neutral-400 my-2 text-center px-2">
                    <p>{timeAgo(albumData.album.createdAt)}</p>
                    <p>{timeAgo(albumData.album.updatedAt)}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDropdown;

/**
 * Single item in the AdminDropdown menu (link or button).
 */
const AdminLinkItem = ({ icon, label, to, onClick }: LinkItem) =>
  onClick ? (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-red-500 hover:font-semibold transition"
    >
      {icon}
      {label}
    </button>
  ) : (
    <Link
      to={to}
      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-red-500 hover:font-semibold transition"
    >
      {icon}
      {label}
    </Link>
  );
