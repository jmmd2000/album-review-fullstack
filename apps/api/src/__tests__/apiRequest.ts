import { app } from "@/app";

const jsonHeaders = (cookie?: string): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  return headers;
};

// Thin wrapper over app.request
export const api = {
  get: (path: string, cookie?: string) => app.request(path, cookie ? { headers: { Cookie: cookie } } : undefined),
  delete: (path: string, cookie?: string) => app.request(path, { method: "DELETE", ...(cookie ? { headers: { Cookie: cookie } } : {}) }),
  post: (path: string, body?: unknown, cookie?: string) => app.request(path, { method: "POST", headers: jsonHeaders(cookie), body: body === undefined ? undefined : JSON.stringify(body) }),
  put: (path: string, body?: unknown, cookie?: string) => app.request(path, { method: "PUT", headers: jsonHeaders(cookie), body: body === undefined ? undefined : JSON.stringify(body) }),
};
