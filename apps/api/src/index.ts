import "@/config/env";
import { serve } from "@hono/node-server";
import { app } from "./app";

// Re-exported so the frontend RPC client can import the API's type from this package.
export type { AppType } from "./app";

serve({ fetch: app.fetch, port: 4000 }, info => {
  console.log(`Server is running on port ${info.port}`);
});
