const umamiOrigin = "https://umami.vps.jamesmddoyle.com";

/**
 * Builds the page's content security policy. It allows only what the site loads: its own files,
 * Umami, Spotify's images and GlitchTip.
 *
 * @param nonce The value the router puts on its inline scripts, new for each request.
 * @param errorReportingDSN The GlitchTip DSN, when error reporting is on. The browser sends its events there.
 */
export function contentSecurityPolicy(nonce: string, errorReportingDSN: string | undefined): string {
  const connectSources = ["'self'", umamiOrigin];
  if (errorReportingDSN) connectSources.push(new URL(errorReportingDSN).origin);

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' ${umamiOrigin}`,
    // Components set colours through style attributes, and a nonce can't cover those
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.scdn.co https://*.spotifycdn.com",
    "font-src 'self'",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  return directives.join("; ");
}
