import { NextResponse, type NextRequest } from "next/server";

import { CSRF_COOKIE, SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Edge proxy — a coarse first line of defense.
 *
 * NOTE (spec §04 / §30): this is NOT the authorization boundary. The real
 * checks live in `requireAdmin()` / `requireClientScope()` on every protected
 * page and inside every server action, because those run on the server with
 * access to the verified session and the database. Middleware only stops
 * obviously-unauthenticated traffic from rendering an empty shell, and applies
 * security headers.
 */

const PROTECTED = ["/admin", "/portal"];
const AUTH_PAGES = ["/login", "/signup"];

function isUnder(pathname: string, bases: string[]) {
  return bases.some((b) => pathname === b || pathname.startsWith(`${b}/`));
}

/** CSRF cookie lifetime — must outlast a session cookie's idle window. */
const CSRF_MAX_AGE = 60 * 60 * 24 * 7;

function newCsrfToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += String.fromCharCode(b);
  return btoa(out).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeRedirectTarget(value: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (/[\r\n]/.test(trimmed)) return null;
  return trimmed.slice(0, 200);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (isUnder(pathname, PROTECTED) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = safeRedirectTarget(request.nextUrl.searchParams.get("next")) ?? "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  /*
   * Double-submit CSRF.
   *
   * The token is minted here rather than during page render because Next 16
   * forbids writing cookies outside a Server Action or Route Handler. The value
   * is also forwarded on the request headers so a page rendered in this same
   * request can embed it in a form field — on the very first visit the cookie
   * has not round-tripped yet.
   */
  const requestHeaders = new Headers(request.headers);
  let csrf = request.cookies.get(CSRF_COOKIE)?.value ?? null;
  const minted = !csrf;
  if (!csrf) {
    csrf = newCsrfToken();
    requestHeaders.set("x-csrf-token", csrf);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (minted) {
    response.cookies.set(CSRF_COOKIE, csrf!, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CSRF_MAX_AGE,
    });
  }

  if (process.env.NODE_ENV === "production") {
    // Next.js requires 'unsafe-inline' for its bootstrapped inline scripts.
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ].join("; "),
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals and static assets.
     */
    "/((?!_next/static|_next/image|assets/|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|woff2?)$).*)",
  ],
};
