import { AuthProvider } from "@/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { createRootRoute, Outlet, HeadContent } from "@tanstack/react-router";

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
