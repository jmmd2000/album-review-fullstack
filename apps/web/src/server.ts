import { createStartHandler, defaultStreamHandler, defineHandlerCallback } from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";
import { contentSecurityPolicy } from "@/lib/contentSecurityPolicy";
import { routeFailuresToReport } from "@/lib/routeFailures";
import { reportError, startErrorReporting } from "@/lib/serverErrorReporting";

startErrorReporting();

// The router has loaded every route by the time this runs, so a failed loader is already in its state.
const fetch = createStartHandler(
  defineHandlerCallback(context => {
    for (const { routeId, error } of routeFailuresToReport(context.router.state.matches)) {
      reportError(error, { side: "server", route: routeId }, context.request.url);
    }

    // Vite's dev server adds inline scripts with no nonce, so the policy applies only to a production build
    const nonce = context.router.options.ssr?.nonce;
    if (import.meta.env.PROD && nonce) {
      context.responseHeaders.set("Content-Security-Policy", contentSecurityPolicy(nonce, process.env.GLITCHTIP_DSN));
    }
    return defaultStreamHandler(context);
  })
);

export default createServerEntry({ fetch });
