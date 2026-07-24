import type { ReactNode } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/auth/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import appCss from "@/styles/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: "UTF-8" }, { name: "viewport", content: "width=device-width, initial-scale=1.0" }, { title: "JamesReviewsMusic" }],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.ico" },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        src: "https://umami.vps.jamesmddoyle.com/script.js",
        defer: true,
        "data-website-id": "347baf58-55c7-4b85-a153-25a0fcd914eb",
        "data-domains": "jamesreviewsmusic.com,www.jamesreviewsmusic.com",
      },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// The auth provider goes here rather than around the router as
// the AdminDropdown component needs access to it, which is here in the layout.
function RootComponent() {
  return (
    <AuthProvider>
      <Navbar />
      <div className="[view-transition-name:main-content]">
        <Outlet />
      </div>
    </AuthProvider>
  );
}
