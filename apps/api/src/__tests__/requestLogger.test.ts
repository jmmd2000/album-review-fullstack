import { afterAll, test, expect } from "vitest";
import { closeDatabase } from "@/db/client";
import { api } from "./apiRequest";

afterAll(async () => {
  await closeDatabase();
});

test("every response carries its own request id", async () => {
  const first = await api.get("/api/health");
  const second = await api.get("/api/health");

  const firstID = first.headers.get("x-request-id");
  const secondID = second.headers.get("x-request-id");
  expect(firstID).toBeTruthy();
  expect(secondID).toBeTruthy();
  expect(firstID).not.toBe(secondID);
});

test("error responses carry a request id too", async () => {
  const res = await api.get("/api/artists/details/nope");
  expect(res.status).toBe(404);
  expect(res.headers.get("x-request-id")).toBeTruthy();
});
