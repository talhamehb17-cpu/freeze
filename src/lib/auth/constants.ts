/**
 * Shared, dependency-free auth constants.
 *
 * Lives on its own so edge middleware can import the cookie name without
 * pulling `next/headers` or `server-only` into the edge bundle.
 */

export const SESSION_COOKIE = "tj_session";
export const CSRF_COOKIE = "tj_csrf";

export const AUTH_ISSUER = "tahseen-jaber-cold-storage";
export const AUTH_AUDIENCE = "tj-web";
