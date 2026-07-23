import { afterEach, beforeEach, test, expect, vi } from "vitest";
import { SpotifyTokenCache } from "@/api/models/SpotifyTokenCache";
import { SpotifyClient } from "@/api/models/SpotifyClient";

beforeEach(() => {
  SpotifyTokenCache.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

test("hands out the cached token while it is still valid", async () => {
  const spy = vi.spyOn(SpotifyClient, "requestToken").mockResolvedValue({ accessToken: "t1", expiresIn: 3600 });

  expect(await SpotifyTokenCache.getAccessToken()).toBe("t1");
  expect(await SpotifyTokenCache.getAccessToken()).toBe("t1");
  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore();
});

test("fetches a fresh token once the cached one expires", async () => {
  vi.useFakeTimers();
  const spy = vi.spyOn(SpotifyClient, "requestToken").mockResolvedValueOnce({ accessToken: "t1", expiresIn: 60 }).mockResolvedValueOnce({ accessToken: "t2", expiresIn: 60 });

  expect(await SpotifyTokenCache.getAccessToken()).toBe("t1");
  vi.advanceTimersByTime(61_000);
  expect(await SpotifyTokenCache.getAccessToken()).toBe("t2");
  expect(spy).toHaveBeenCalledTimes(2);

  spy.mockRestore();
});

test("clear drops the cached token", async () => {
  const spy = vi.spyOn(SpotifyClient, "requestToken").mockResolvedValue({ accessToken: "t1", expiresIn: 3600 });

  await SpotifyTokenCache.getAccessToken();
  SpotifyTokenCache.clear();
  await SpotifyTokenCache.getAccessToken();
  expect(spy).toHaveBeenCalledTimes(2);

  spy.mockRestore();
});
