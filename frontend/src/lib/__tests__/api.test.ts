import { describe, it, expect, beforeEach, vi } from "vitest";
import { api, ApiError } from "../api";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("api.get", () => {
  it("sends a GET request with credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    });

    await api.get("/api/albums");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/albums"),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("returns parsed JSON on success", async () => {
    const data = { albums: [{ id: 1, name: "Test" }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => data,
    });

    const result = await api.get("/api/albums");
    expect(result).toEqual(data);
  });

  it("returns undefined for 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await api.get("/api/something");
    expect(result).toBeUndefined();
  });
});

describe("api.post", () => {
  it("sends a POST request with JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ created: true }),
    });

    const payload = { name: "Test Album" };
    await api.post("/api/albums", payload);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/albums"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
    );
  });

  it("sends undefined body when no data is provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await api.post("/api/logout");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/logout"),
      expect.objectContaining({ body: undefined })
    );
  });
});

describe("api.put", () => {
  it("sends a PUT request with JSON body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ updated: true }),
    });

    const payload = { name: "Updated" };
    await api.put("/api/albums/1", payload);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/albums/1"),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(payload),
      })
    );
  });
});

describe("api.delete", () => {
  it("sends a DELETE request with credentials", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await api.delete("/api/albums/1");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/albums/1"),
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
      })
    );
  });
});

describe("error handling", () => {
  it("throws ApiError with message from response body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ message: "Album not found" }),
    });

    await expect(api.get("/api/albums/missing")).rejects.toThrow(ApiError);
    // Need a fresh mock for the second call
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({ message: "Album not found" }),
    });
    await expect(api.get("/api/albums/missing")).rejects.toThrow("Album not found");
  });

  it("falls back to statusText when response body has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    });

    await expect(api.get("/api/fail")).rejects.toThrow("Internal Server Error");
  });

  it("falls back to generic message when JSON parsing fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "",
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(api.get("/api/fail")).rejects.toThrow("Request failed.");
  });

  it("includes the status code on ApiError", async () => {
    expect.assertions(2);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      json: async () => ({ message: "Not allowed" }),
    });

    try {
      await api.get("/api/admin");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(403);
    }
  });
});

describe("ApiError", () => {
  it("has the correct name and properties", () => {
    const error = new ApiError("Something broke", 500);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Something broke");
    expect(error.status).toBe(500);
    expect(error).toBeInstanceOf(Error);
  });
});
