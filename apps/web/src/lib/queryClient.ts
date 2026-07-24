import { QueryClient } from "@tanstack/react-query";

// Lives outside the router setup so route loaders can import it without pulling
// in the whole app, which used to create a router -> routes -> components cycle
export const queryClient = new QueryClient();
