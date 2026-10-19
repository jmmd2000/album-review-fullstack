import * as Sentry from "@sentry/node";
import { env } from "@/config/env";

/**
 * Builds the SDK options. Only the integrations listed here run, so the SDK never collects
 * request data such as cookies, headers, bodies or query strings by itself. The default
 * integrations would collect it, so they stay off. beforeSend drops any that arrives anyway.
 *
 * @param dsn Where GlitchTip takes events.
 * @param environment Where the events come from, such as production or staging.
 * @param release The commit the running image was built from.
 */
export function buildErrorReportingOptions(dsn: string, environment: string, release: string): Sentry.NodeOptions {
  return {
    dsn,
    environment,
    release,
    defaultIntegrations: false,
    integrations: [
      Sentry.linkedErrorsIntegration(),
      Sentry.onUncaughtExceptionIntegration(),
      // "strict" keeps Node's own behaviour: an unhandled rejection stops the process
      Sentry.onUnhandledRejectionIntegration({ mode: "strict" }),
    ],
    beforeSend: event => ({ ...event, request: undefined }),
  };
}

/** Starts error reporting. Does nothing unless GLITCHTIP_DSN is set. */
export function startErrorReporting(): void {
  if (!env.GLITCHTIP_DSN || !env.GLITCHTIP_ENVIRONMENT) return;
  Sentry.init(buildErrorReportingOptions(env.GLITCHTIP_DSN, env.GLITCHTIP_ENVIRONMENT, env.GIT_SHA));
}

/**
 * Sends an error to GlitchTip. Does nothing when reporting is off.
 *
 * @param error The error to send.
 * @param tags Values to search by in GlitchTip, such as the request ID.
 */
export function reportError(error: unknown, tags: Record<string, string> = {}): void {
  Sentry.captureException(error, { tags });
}
