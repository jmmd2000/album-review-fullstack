import { QueryClient } from "@tanstack/react-query";

// Lives outside main.tsx so route loaders can import it without pulling in the
// whole app, which used to create a main -> routes -> components -> main cycle
export const queryClient = new QueryClient();
