const API_BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T = unknown>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.message || res.statusText || "Request failed.", res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string, options?: RequestInit): Promise<T> =>
    fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options,
    }).then(res => handleResponse<T>(res)),
  post: <T = unknown>(path: string, data?: unknown, options?: RequestInit): Promise<T> =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }).then(res => handleResponse<T>(res)),
  put: <T = unknown>(path: string, data?: unknown, options?: RequestInit): Promise<T> =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    }).then(res => handleResponse<T>(res)),
  delete: <T = unknown>(path: string, options?: RequestInit): Promise<T> =>
    fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
      credentials: "include",
      ...options,
    }).then(res => handleResponse<T>(res)),
};
