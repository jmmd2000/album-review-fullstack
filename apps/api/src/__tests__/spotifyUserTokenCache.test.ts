import { afterEach, beforeEach, test, expect, vi } from "vitest";
import { SpotifyUserTokenCache } from "@/api/models/SpotifyUserTokenCache";
import { SpotifyClient, SpotifyNotConnectedError } from "@/api/models/SpotifyClient";
import { env } from "@/config/env";

const originalRefreshToken = env.SPOTIFY_REFRESH_TOKEN;

beforeEach(() => {
  SpotifyUserTokenCache.clear();
  env.SPOTIFY_REFRESH_TOKEN = "refresh-1";
});

afterEach(() => {
  env.SPOTIFY_REFRESH_TOKEN = originalRefreshToken;
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test("fails as not connected without asking Spotify when no refresh token is set", async () => {
  env.SPOTIFY_REFRESH_TOKEN = undefined;
  const spy = vi.spyOn(SpotifyClient, "refreshUserToken");

  await expect(SpotifyUserTokenCache.getAccessToken()).rejects.toBeInstanceOf(SpotifyNotConnectedError);
  expect(spy).not.toHaveBeenCalled();
});

test("refreshes from the env token and hands out the cached token while it is still valid", async () => {
  const spy = vi.spyOn(SpotifyClient, "refreshUserToken").mockResolvedValue({ accessToken: "user-1", expiresIn: 3600 });

  expect(await SpotifyUserTokenCache.getAccessToken()).toBe("user-1");
  expect(await SpotifyUserTokenCache.getAccessToken()).toBe("user-1");
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy).toHaveBeenCalledWith("refresh-1");
});

test("uses the refresh token Spotify replaced the env one with on the next refresh", async () => {
  vi.useFakeTimers();
  const spy = vi
    .spyOn(SpotifyClient, "refreshUserToken")
    .mockResolvedValueOnce({ accessToken: "user-1", expiresIn: 60, refreshToken: "refresh-2" })
    .mockResolvedValueOnce({ accessToken: "user-2", expiresIn: 60 });

  await SpotifyUserTokenCache.getAccessToken();
  vi.advanceTimersByTime(61_000);
  expect(await SpotifyUserTokenCache.getAccessToken()).toBe("user-2");
  expect(spy).toHaveBeenLastCalledWith("refresh-2");
});
