import * as Sentry from "@sentry/react";
import { ApiError } from "@/lib/client";

/**
 * Builds the SDK options. Only the integrations listed here run, so the SDK never collects
 * request data such as cookies, headers or query strings by itself. The default integrations
 * would collect some of it, so they stay off. beforeSend drops any that arrives anyway.
 *
 * @param dsn Where GlitchTip takes events. It is public, like any browser DSN.
 * @param environment Where the events come from, such as production or staging.
 * @param release The commit the running image was built from.
 */
export function buildBrowserErrorReportingOptions(dsn: string, environment: string, release: string): Sentry.BrowserOptions {
  return {
    dsn,
    environment,
    release,
    defaultIntegrations: false,
    integrations: [Sentry.linkedErrorsIntegration(), Sentry.globalHandlersIntegration()],
    beforeSend: event => ({ ...event, request: undefined }),
  };
}

/**
 * Starts error reporting in the browser, with the values server.js hands out in window.__GLITCHTIP__.
 * Does nothing when that is empty, or when reporting has already started.
 */
export function startBrowserErrorReporting(): void {
  const config = window.__GLITCHTIP__;
  if (!config || Sentry.getClient()) return;
  Sentry.init(buildBrowserErrorReportingOptions(config.dsn, config.environment, __GIT_SHA__));
}

/**
 * Sends an error to GlitchTip. Does nothing when reporting is off.
 * An ApiError is left out, because the API reports its own errors.
 */
export function reportBrowserError(error: unknown): void {
  if (error instanceof ApiError) return;
  Sentry.captureException(error, { tags: { side: "browser" } });
}

/** The part of a router match that isLoaderError reads. */
interface RouteMatch {
  error?: unknown;
}

/**
 * Tells whether a route's loader threw this error. The router rethrows a loader error to the page, which
 * is how the error reaches defaultOnCatch. Loader errors are reported where they happen, so this keeps
 * them from being reported a second time. A loader error on the server also reaches the browser as a
 * plain Error, so the browser could not tell an ApiError from any other error.
 */
export function isLoaderError(matches: readonly RouteMatch[], error: unknown): boolean {
  return matches.some(match => match.error === error);
}
