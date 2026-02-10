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
  ImageIcon,
} from "lucide-react";
import { useState, useRef, useEffect, JSX } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/auth/useAuth";
import { queryClient } from "@/main";
import {
  ReviewedAlbum,
  ReviewedArtist,
  DisplayTrack,
  DisplayAlbum,
  Genre,
} from "@shared/types";
import { timeAgo } from "@shared/helpers/formatDate";
import Dialog from "@/components/Dialog";
import { api } from "@/lib/api";

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
  const albumMatch = pathname.match(/^\/albums\/([^/]+)$/);
  const albumID = albumMatch?.[1];

  // Extract artistID when on /artists/:id
  const artistMatch = pathname.match(/^\/artists\/([^/]+)$/);
  const artistID = artistMatch?.[1];

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

  // Get cached artist data if it exists
  const artistData = artistID
    ? (queryClient.getQueryData(["artistID", artistID]) as {
        artist: ReviewedArtist;
        albums: DisplayAlbum[];
        tracks: DisplayTrack[];
      })
    : null;

  // State for header image update modal
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [headerImageUrl, setHeaderImageUrl] = useState("");

  const handleDelete = async () => {
    if (!albumID) return;
    if (!confirm("Are you sure you want to delete this album?")) return;
    try {
      await api.delete(`/api/albums/${albumID}`);
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["albums"] });

      navigate({ to: "/albums" });
    } catch {
      alert("Something went wrong while deleting the album.");
    }
  };

  // Mutation for updating header image
  const updateHeaderImageMut = useMutation<void, Error, string>({
    mutationFn: async (headerImage: string) => {
      if (!artistID) throw new Error("Artist ID is required");
      await api.put(`/api/artists/${artistID}/headerImage`, {
        headerImage: headerImage.trim() || null,
      });
    },
    onSuccess: () => {
      if (artistID) {
        queryClient.invalidateQueries({ queryKey: ["artistID", artistID] });
        queryClient.invalidateQueries({ queryKey: ["artists"] });
      }
      setShowHeaderModal(false);
      setHeaderImageUrl("");
      setOpen(false);
    },
    onError: error => {
      alert(error.message || "Something went wrong while updating the header image.");
    },
  });

  const handleUpdateHeaderImage = () => {
    updateHeaderImageMut.mutate(headerImageUrl);
  };

  const handleOpenHeaderModal = () => {
    if (artistData) {
      setHeaderImageUrl(artistData.artist.headerImage || "");
    }
    setShowHeaderModal(true);
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
        ...(artistID
          ? [
              {
                label: "Update Header Image",
                icon: <ImageIcon className="w-4 h-4" />,
                to: "",
                onClick: handleOpenHeaderModal,
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

      <Dialog
        isOpen={showHeaderModal}
        onClose={() => {
          setShowHeaderModal(false);
          setHeaderImageUrl("");
        }}
        title="Update Header Image"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Header Image URL
            </label>
            <input
              type="text"
              value={headerImageUrl}
              onChange={e => setHeaderImageUrl(e.target.value)}
              placeholder="https://i.scdn.co/image/..."
              className="w-full rounded bg-neutral-800 px-3 py-2 text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600"
              disabled={updateHeaderImageMut.isPending}
            />
            <p className="text-xs text-neutral-400 mt-1">
              Leave empty to remove the header image
            </p>
            <p className="text-xs text-neutral-500 mt-2 font-mono bg-neutral-900/50 p-2 rounded border border-neutral-800">
              <span className="select-all">
                document.querySelector('div[data-testid="background-image"]').style.backgroundImage.slice(5,
                -2)
              </span>
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowHeaderModal(false);
                setHeaderImageUrl("");
              }}
              className="rounded bg-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-600 transition-colors cursor-pointer"
              disabled={updateHeaderImageMut.isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateHeaderImage}
              className="rounded bg-gradient-to-br from-red-800 to-red-900/60 px-4 py-2 text-sm text-white hover:from-red-700 hover:to-red-800/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={updateHeaderImageMut.isPending}
            >
              {updateHeaderImageMut.isPending ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      </Dialog>
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
