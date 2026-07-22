import "@/config/env";
import { serve } from "@hono/node-server";
import { app } from "./app";

serve({ fetch: app.fetch, port: 4000 }, info => {
  console.log(`Server is running on port ${info.port}`);
});
