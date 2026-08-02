/**
 * Site Mode Helper
 * ================
 * Single source of truth for determining whether the full website
 * should be displayed or the Coming Soon page.
 *
 * Reads WEBSITE_LIVE and APP_SUBDOMAIN internally.
 * No other file should duplicate this logic.
 */

/**
 * Allowed base domains for the application.
 * The app subdomain is only recognized on these domains and on localhost.
 */
const ALLOWED_BASE_DOMAINS = ['sushantghadge.com'];

/**
 * Determines whether the full website should be shown for the given hostname.
 *
 * Returns true (show full website) when:
 *   - WEBSITE_LIVE is 'true', OR
 *   - The hostname is the configured app subdomain on an allowed domain
 *     (e.g., app.sushantghadge.com, app.localhost)
 *
 * Returns false (show Coming Soon) otherwise.
 */
export function shouldShowWebsite(hostname: string | null): boolean {
  // If the site is globally live, always show the full website
  if (process.env.WEBSITE_LIVE === 'true') {
    return true;
  }

  const appSubdomain = (process.env.APP_SUBDOMAIN || 'app').toLowerCase();

  // Normalize: lowercase, strip port
  const normalizedHost = (hostname || '').split(':')[0].toLowerCase().trim();

  // Split into labels
  const parts = normalizedHost.split('.');

  // Check for app.localhost (development)
  if (parts.length === 2 && parts[0] === appSubdomain && parts[1] === 'localhost') {
    return true;
  }

  // Check for app.<allowed-domain> (production)
  if (parts.length >= 3 && parts[0] === appSubdomain) {
    const baseDomain = parts.slice(1).join('.');
    if (ALLOWED_BASE_DOMAINS.includes(baseDomain)) {
      return true;
    }
  }

  return false;
}
