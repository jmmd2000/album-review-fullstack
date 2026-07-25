import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/auth/AuthContext";
import appCss from "@/styles/globals.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  ssr: true,
  head: () => ({
    meta: [
      { charSet: "UTF-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { title: "JamesReviewsMusic" },
      { name: "description", content: "My album review blog. Scores, rankings and stats for every album I listen to." },
    ],
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

function RootComponent() {
  return (
    <AuthProvider>
      <nav>
        <Link to="/">Home</Link> <Link to="/albums">Albums</Link> <Link to="/artists">Artists</Link> <Link to="/stats">Stats</Link> <Link to="/bookmarks">Bookmarks</Link>{" "}
        <Link to="/search">Search</Link>
      </nav>
      <main style={{ viewTransitionName: "main-content" }}>
        <Outlet />
      </main>
    </AuthProvider>
  );
}
