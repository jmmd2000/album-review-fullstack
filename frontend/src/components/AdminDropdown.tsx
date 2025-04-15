import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, LogOut, Settings, Search, ChevronDown, Pencil, Trash } from "lucide-react";
import { JSX, useEffect, useRef, useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * The shape of a link item in the admin dropdown.
 */
interface LinkItem {
  /** The label of the link */
  label: string;
  /** The icon of the link */
  icon: JSX.Element;
  /** The destination of the link */
  to: string;
  /** Optional: The onClick handler for the link */
  onClick?: () => void;
}

// Static links for the dropdown
const staticLinks: LinkItem[] = [
  { label: "Search", icon: <Search className="w-4 h-4" />, to: "/search" },
  { label: "Settings", icon: <Settings className="w-4 h-4" />, to: "/settings" },
  { label: "Bookmarks", icon: <Bookmark className="w-4 h-4" />, to: "/bookmarks" },
  { label: "Logout", icon: <LogOut className="w-4 h-4" />, to: "/" },
];

/**
 * This component contains a dropdown menu with links to various admin pages.
 * It is used in the Navbar component.
 */
const AdminDropdown = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get current route state to check if we're on a review
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  // Match current route "/albums/:albumID"
  const albumMatch = pathname.match(/^\/albums\/([^/]+)$/);
  const albumID = albumMatch?.[1];

  const handleDelete = async () => {
    if (!albumID) return;

    const confirmed = confirm("Are you sure you want to delete this album?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/albums/${albumID}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete album");
      }

      // Redirect to the album list or homepage
      navigate({ to: "/albums" });
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("Something went wrong while deleting the album.");
    }
  };

  // If we're on an album page, add edit and delete album links dynamically
  const links: LinkItem[] = albumID
    ? [
        ...staticLinks,
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
    : staticLinks;

  // Close on click outside or scroll
  useEffect(() => {
    const handleClickOrScroll = (event: MouseEvent | Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOrScroll);
    window.addEventListener("scroll", handleClickOrScroll);

    return () => {
      document.removeEventListener("mousedown", handleClickOrScroll);
      window.removeEventListener("scroll", handleClickOrScroll);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex justify-center items-center gap-2 w-full rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-700 transition hover:cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Menu
        <ChevronDown className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-neutral-900 shadow-lg ring-1 ring-neutral-700 overflow-hidden"
          >
            {links.map((link) => (
              <AdminLinkItem key={link.label} icon={link.icon} label={link.label} to={link.to} onClick={link.onClick} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDropdown;

const AdminLinkItem = ({ icon, label, to, onClick }: LinkItem) =>
  onClick ? (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 transition w-full text-lef overflow-hidden hover:text-red-500 hover:font-semibold cursor-pointer">
      {icon}
      {label}
    </button>
  ) : (
    <Link key={label} to={to} className="flex items-center gap-2 px-4 py-3 hover:bg-neutral-800 overflow-hidden hover:text-red-500 hover:font-semibold transition text-sm">
      {icon}
      {label}
    </Link>
  );
