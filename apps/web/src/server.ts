import { createStartHandler, defaultStreamHandler, defineHandlerCallback } from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";
import { routeFailuresToReport } from "@/lib/routeFailures";
import { reportError, startErrorReporting } from "@/lib/serverErrorReporting";

startErrorReporting();

// The router has loaded every route by the time this runs, so a failed loader is already in its state.
const fetch = createStartHandler(
  defineHandlerCallback(context => {
    for (const { routeId, error } of routeFailuresToReport(context.router.state.matches)) {
      reportError(error, { side: "server", route: routeId });
    }
    return defaultStreamHandler(context);
  })
);

export default createServerEntry({ fetch });
