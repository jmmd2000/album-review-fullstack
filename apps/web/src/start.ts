import { createStart } from "@tanstack/react-start";

// Only the document shell renders on the server. Route components and
// loaders stay on the client, individual routes can opt back in.
export const startInstance = createStart(() => ({
  defaultSsr: false,
}));
