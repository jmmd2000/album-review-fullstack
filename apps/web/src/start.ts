import { createStart } from "@tanstack/react-start";

// Routes are client rendered unless they opt in with ssr: true, which the
// public pages do. Admin pages never render or fetch on the server.
export const startInstance = createStart(() => ({
  defaultSsr: false,
}));
