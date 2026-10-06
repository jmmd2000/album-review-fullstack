import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts, ScriptOnce } from "@tanstack/react-router";
import funnelDisplayURL from "@fontsource-variable/funnel-display/files/funnel-display-latin-wght-normal.woff2?url";
import funnelSansURL from "@fontsource-variable/funnel-sans/files/funnel-sans-latin-wght-normal.woff2?url";
import { AuthProvider } from "@/auth/AuthContext";
import appCss from "@/styles/globals.css?url";
import { Navbar } from "@/components/layout/Navbar";
import { themeScript } from "@/lib/theme";
import styles from "./__root.module.css";

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
      { rel: "preload", href: funnelDisplayURL, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: funnelSansURL, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ScriptOnce>{themeScript}</ScriptOnce>
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
      <div className={styles.layout}>
        <Navbar />
        <main className={styles.main} style={{ viewTransitionName: "main-content" }}>
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
}
