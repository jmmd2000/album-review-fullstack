import { env } from "@/config/env";
import { startErrorReporting } from "@/config/errorReporting";
import { serve } from "@hono/node-server";
import { app } from "./app";
import { JobScheduler } from "@/api/services/JobScheduler";
import { ListeningService } from "@/api/services/ListeningService";

// Re-exported so the frontend RPC client can import the API's type from this package.
export type { AppType } from "./app";

startErrorReporting();

serve({ fetch: app.fetch, port: env.PORT }, info => {
  console.log(`Server is running on port ${info.port}`);
});

JobScheduler.start();
ListeningService.start();
