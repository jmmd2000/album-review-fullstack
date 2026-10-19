import * as Sentry from "@sentry/react";
import { ApiError } from "@/lib/client";

/**
 * The address of the page, with its query string, and the browser's own description of itself.
 * Nothing else about the request goes in an event, so there are no cookies, referrer or other headers.
 */
function describePage() {
  return { url: `${window.location.origin}${window.location.pathname}${window.location.search}`, headers: { "User-Agent": navigator.userAgent } };
}

/**
 * Builds the SDK options. Only the integrations listed here run, so the SDK never collects
 * request data such as cookies or headers by itself. The default integrations would collect
 * some of it, so they stay off. beforeSend adds the page address and the browser, and nothing more.
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
    integrations: [
      Sentry.linkedErrorsIntegration(),
      Sentry.globalHandlersIntegration(),
      // The clicks, page changes and API calls before an error. This integration does not record console messages, which could hold data.
      Sentry.breadcrumbsIntegration({ sentry: false }),
    ],
    maxBreadcrumbs: 20,
    // A typing breadcrumb names the field that the person typed in. Nothing about typing goes in an event.
    beforeBreadcrumb: breadcrumb => (breadcrumb.category === "ui.input" ? null : breadcrumb),
    beforeSend: event => ({ ...event, request: describePage() }),
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
