import "server-only";

import { redirect } from "next/navigation";

import type { SessionUser, UserRole } from "@/types";
import { getSession } from "./session";

/**
 * Server-side authorization (spec §04, §30, §38).
 *
 * Every protected page and every server action MUST call one of these.
 * Client-side route guards are decoration — never a security boundary.
 */

export class AuthorizationError extends Error {
  readonly code: "UNAUTHORIZED" | "FORBIDDEN";
  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export async function currentUser(): Promise<SessionUser | null> {
  return getSession();
}

export async function requireUser(redirectTo = "/login"): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect(redirectTo);
  return session;
}

export async function requireRole(roles: UserRole[], redirectTo = "/login"): Promise<SessionUser> {
  const session = await requireUser(redirectTo);
  if (!roles.includes(session.role)) redirect("/portal");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["ADMIN"], "/login?next=/admin");
}

export async function requireStaff(): Promise<SessionUser> {
  return requireRole(["ADMIN", "OPERATOR"], "/login?next=/admin");
}

/** Clients only reach their own data; staff may pass an explicit clientId. */
export async function requireClientScope(): Promise<{ user: SessionUser; clientId: string }> {
  const session = await requireUser("/login?next=/portal");
  if (session.role === "CLIENT") {
    if (!session.clientId) redirect("/portal?error=no-client");
    return { user: session, clientId: session.clientId };
  }
  // Staff get read access across the portal surface.
  return { user: session, clientId: session.clientId ?? "" };
}

/** Non-redirecting variants for server actions / API routes. */
export async function assertUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new AuthorizationError("UNAUTHORIZED", "Authentication required.");
  return session;
}

export async function assertRole(roles: UserRole[]): Promise<SessionUser> {
  const session = await assertUser();
  if (!roles.includes(session.role)) {
    throw new AuthorizationError("FORBIDDEN", "You do not have access to this resource.");
  }
  return session;
}

export async function assertAdmin(): Promise<SessionUser> {
  return assertRole(["ADMIN"]);
}

export async function assertStaff(): Promise<SessionUser> {
  return assertRole(["ADMIN", "OPERATOR"]);
}
