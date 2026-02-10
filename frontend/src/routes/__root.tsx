import { AuthProvider } from "@/auth/AuthContext";
import AdminDropdown from "@/components/AdminDropdown";
import {
  createRootRoute,
  Link,
  Outlet,
  HeadContent,
} from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

// The auth provider goes here rather than in main.tsx as
// the AdminDropdown component needs access to it, which is here in the layout.
export const Route = createRootRoute({
  component: () => (
    <>
      <AuthProvider>
        <HeadContent />
        <Navbar />
        <div className="[view-transition-name:main-content]">
          <Outlet />
        </div>
      </AuthProvider>
    </>
  ),
});

const ROUTES = [
  {
    name: "Home",
    to: "/",
  },
  {
    name: "Albums",
    to: "/albums",
  },
  {
    name: "Artists",
    to: "/artists",
  },
  {
    name: "Stats",
    to: "/stats",
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <header className="flex sm:hidden items-center justify-between bg-neutral-900 text-white px-5 py-5 z-[9999] relative">
        <img src="/favicon.ico" alt="logo" className="h-[40px]" />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md focus:outline-none"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-[250px] bg-neutral-900 text-white p-5
          transform transition-transform duration-300 z-[9998] flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>
        <img src="/favicon.ico" alt="logo" className="h-[40px] w-[40px] mb-6" />
        <nav className="flex flex-col gap-4">
          {ROUTES.map(r => (
            <NavLink
              key={r.to}
              to={r.to}
              name={r.name}
              onClick={() => setIsOpen(false)}
            />
          ))}
        </nav>
        <div className="mt-auto">
          <AdminDropdown />
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9997]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Navbar */}
      <header className="hidden sm:flex bg-neutral-900 text-white px-5 py-5 gap-5 items-center z-[9999] relative">
        <img src="/favicon.ico" alt="logo" className="h-[40px]" />
        {ROUTES.map(r => (
          <NavLink key={r.to} to={r.to} name={r.name} />
        ))}
        <div className="ml-auto">
          <AdminDropdown />
        </div>
      </header>
    </>
  );
};

interface NavLinkProps {
  to: string;
  name: string;
  onClick?: () => void;
}
const NavLink = ({ to, name, onClick }: NavLinkProps) => (
  <Link
    to={to}
    onClick={onClick}
    className="[&.active]:text-red-500 font-bold uppercase tracking-wider m-2 text-lg md:text-2xl"
  >
    {name}
  </Link>
);
