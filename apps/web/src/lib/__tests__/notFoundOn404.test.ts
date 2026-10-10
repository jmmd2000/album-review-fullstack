import { describe, expect, it } from "vitest";
import { isNotFound } from "@tanstack/react-router";
import { ApiError } from "@/lib/client";
import { notFoundOn404 } from "@/lib/notFoundOn404";

describe("notFoundOn404", () => {
  it("passes the data through", async () => {
    await expect(notFoundOn404(Promise.resolve("album"))).resolves.toBe("album");
  });

  it("turns an API 404 into the router's not found", async () => {
    const thrown: unknown = await notFoundOn404(Promise.reject(new ApiError("Album not found.", 404))).catch((error: unknown) => error);
    expect(isNotFound(thrown)).toBe(true);
  });

  it("leaves any other error as it is", async () => {
    const failure = new ApiError("Server error", 500);
    await expect(notFoundOn404(Promise.reject(failure))).rejects.toBe(failure);
  });
});
