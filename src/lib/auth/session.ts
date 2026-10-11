import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

import { serverEnv } from "@/lib/env";
import type { SessionUser } from "@/types";

/**
 * Session layer.
 *
 *  • JWT signed with AUTH_SECRET (HS256) — no session data in the browser.
 *  • httpOnly + SameSite=Lax + Secure cookies. The client cannot read or
 *    forge the token, and CSRF is handled by a double-submit token that every
 *    mutation must echo back.
 *  • Authorization ALWAYS happens server-side (see ./guards.ts). Frontend
 *    route guards are cosmetic only.
 */

import { AUTH_AUDIENCE as AUDIENCE, AUTH_ISSUER as ISSUER, CSRF_COOKIE, SESSION_COOKIE } from "./constants";

export { CSRF_COOKIE, SESSION_COOKIE };

function encoder() {
  return new TextEncoder().encode(serverEnv.authSecret());
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    clientId: user.clientId,
    image: user.image,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + serverEnv.sessionTtlSeconds)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .sign(encoder());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, encoder(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      id: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: (payload.role as SessionUser["role"]) ?? "CLIENT",
      clientId: (payload.clientId as string | null) ?? null,
      image: (payload.image as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Read the current session from cookies. Returns null when unauthenticated. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  const token = await createSessionToken(user);
  const secure = process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: serverEnv.sessionTtlSeconds,
  });
  await issueCsrfToken();
}

export async function clearSession() {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  store.set(CSRF_COOKIE, "", { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 0 });
}

/* ------------------------------- CSRF ----------------------------------- */

/**
 * Double-submit CSRF token. The cookie is readable by JS so the client can echo
 * it in the `x-csrf-token` header; an attacker on another origin cannot read it.
 */
export async function issueCsrfToken(): Promise<string> {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = Buffer.from(bytes).toString("base64url");
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";
  store.set(CSRF_COOKIE, token, {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: serverEnv.sessionTtlSeconds,
  });
  return token;
}

export async function readCsrfToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? null;
}

/**
 * Resolve the CSRF token for a page render.
 *
 * Prefers the round-tripped cookie; falls back to the header the edge proxy
 * forwards, which covers a first-time visitor whose Set-Cookie has not come
 * back yet. Never writes — cookies can only be mutated in an action or route
 * handler under Next 16.
 */
export async function resolveCsrfToken(): Promise<string | null> {
  const fromCookie = await readCsrfToken();
  if (fromCookie) return fromCookie;
  const h = await headers();
  const forwarded = h.get("x-csrf-token");
  return forwarded && forwarded.length >= 16 ? forwarded : null;
}

/** Constant-time comparison so timing cannot be used to guess a token. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function assertCsrf(headerValue: string | null): Promise<boolean> {
  const cookieValue = await readCsrfToken();
  if (!cookieValue || !headerValue) return false;
  return safeEqual(cookieValue, headerValue);
}

/* --------------------------- client ip hashing --------------------------- */

/** We store a salted hash of the caller IP for rate limiting / audit — never the raw IP. */
export async function hashIp(ip: string | null): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(`ip|${serverEnv.authSecret().slice(0, 16)}|${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex").slice(0, 32);
}
