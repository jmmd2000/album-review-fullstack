import AdminDropdown from "@/components/AdminDropdown";
import { createRootRoute, Link, Outlet, HeadContent } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export const Route = createRootRoute({
  component: () => (
    <>
      <HeadContent />
      <Navbar />
      <div className="[view-transition-name:main-content]">
        <Outlet />
      </div>

      <TanStackRouterDevtools />
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
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Navbar (sm and up) */}
      <div className="z-[9999] relative hidden sm:flex px-5 py-5 gap-5 text-2xl items-center max-w-full will-change-transform">
        <img src="../../../public/favicon.ico" alt="logo" className="h-[40px]" />
        {ROUTES.map((route) => (
          <NavLink key={route.to} to={route.to} name={route.name} />
        ))}
        <div className="ml-auto">
          <AdminDropdown />
        </div>
      </div>

      {/* Mobile Menu Button (below sm) */}
      <button onClick={() => setIsOpen(!isOpen)} className="sm:hidden fixed top-5 left-5 z-50 p-2 bg-black text-white rounded-md">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar (below sm) */}
      <div className={`sm:hidden fixed top-0 left-0 h-full w-[250px] bg-gray-900 text-white p-5 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => setIsOpen(false)} className="absolute top-3 right-3 text-white">
          <X size={24} />
        </button>
        <img src="../../../public/favicon.ico" alt="logo" className="h-[40px] mb-5" />
        <nav className="flex flex-col gap-4">
          {ROUTES.map((route) => (
            <NavLink key={route.to} to={route.to} name={route.name} />
          ))}
        </nav>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && <div className="sm:hidden fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsOpen(false)} />}
    </>
  );
};

interface NavLinkProps {
  to: string;
  name: string;
}

const NavLink = ({ to, name }: NavLinkProps) => {
  return (
    <Link to={to} className="[&.active]:text-red-500 font-bold uppercase tracking-wider m-2">
      {name}
    </Link>
  );
};
