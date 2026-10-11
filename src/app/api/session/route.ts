import { NextResponse } from "next/server";

import { getSession, readCsrfToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/session — returns the current session shape (or null) plus a CSRF
 * token for mutations. Never returns a password hash, role escalation data or
 * anything else the client does not need.
 */
export async function GET() {
  const [user, csrf] = await Promise.all([getSession(), readCsrfToken()]);
  return NextResponse.json({
    ok: true,
    user: user
      ? { id: user.id, name: user.name, email: user.email, role: user.role, image: user.image }
      : null,
    csrf,
  });
}
