import * as Sentry from "@sentry/node";

/**
 * Builds the SDK options. Only the integrations listed here run, so the SDK never collects
 * request data such as cookies, headers or bodies by itself. The default integrations would
 * collect it, so they stay off. beforeSend keeps only the page address from the request.
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
    beforeSend: event => ({ ...event, request: event.request?.url ? { url: event.request.url } : undefined }),
  };
}

/**
 * Starts error reporting on the web server. Does nothing unless GLITCHTIP_DSN is set.
 * server.js has already checked both variables by the time this runs.
 */
export function startErrorReporting(): void {
  const dsn = process.env.GLITCHTIP_DSN;
  const environment = process.env.GLITCHTIP_ENVIRONMENT;
  if (!dsn || !environment) return;
  Sentry.init(buildErrorReportingOptions(dsn, environment, __GIT_SHA__));
}

/**
 * Sends an error to GlitchTip. Does nothing when reporting is off.
 *
 * @param error The error to send.
 * @param tags Values to search by in GlitchTip.
 * @param pageURL The address of the page that failed, with its query string.
 */
export function reportError(error: unknown, tags: Record<string, string> = {}, pageURL?: string): void {
  Sentry.withScope(scope => {
    scope.setTags(tags);
    if (pageURL) scope.addEventProcessor(event => ({ ...event, request: { url: pageURL } }));
    Sentry.captureException(error);
  });
}
