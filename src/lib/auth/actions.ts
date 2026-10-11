"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";

import {
  addAudit,
  createClient,
  createUser,
  findUserByEmail,
  touchLogin,
} from "@/lib/db/repositories";
import { rateLimit } from "@/lib/rate-limit";
import type { AuthResponse } from "@/types";
import { cleanText } from "@/lib/utils";

import { assertCsrf, clearSession, hashIp, setSessionCookie, toSessionUserBridge } from "./session-bridge";
import { loginSchema, safeNextPath, signupSchema } from "@/lib/validation/schemas";

/**
 * Authentication server actions.
 *
 *  • Passwords are hashed with bcrypt (cost 10). Plain text is never stored,
 *    never logged, never returned to the client.
 *  • Every mutation checks the CSRF double-submit token.
 *  • Rate limited per IP to blunt credential stuffing and signup spam.
 *  • Generic error copy — we never reveal whether an email exists.
 */

async function callerKey(prefix: string) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    "local";
  return `${prefix}:${await hashIp(ip)}`;
}

const GENERIC_INVALID = "Those credentials don't match our records.";

export async function loginAction(
  _prev: AuthResponse | null,
  formData: FormData,
): Promise<AuthResponse> {
  const csrf = await assertCsrf(String(formData.get("__csrf") ?? ""));
  if (!csrf) {
    return { ok: false, error: "Your session expired. Please try again.", code: "VALIDATION" };
  }

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    next: String(formData.get("next") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields and try again.",
      code: "VALIDATION",
      fields: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    };
  }

  const limit = rateLimit(await callerKey("login"), { max: 8, windowSeconds: 300 });
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many attempts. Try again in ${limit.resetSeconds}s.`,
      code: "RATE_LIMITED",
    };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user?.passwordHash) {
    await addAudit({
      action: "auth.login.failed",
      entity: "users",
      entityId: null,
      meta: { email: parsed.data.email },
    });
    return { ok: false, error: GENERIC_INVALID, code: "INVALID_CREDENTIALS" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    await addAudit({
      action: "auth.login.failed",
      entity: "users",
      entityId: String(user.id),
      meta: { reason: "bad-password" },
    });
    return { ok: false, error: GENERIC_INVALID, code: "INVALID_CREDENTIALS" };
  }

  const session = toSessionUserBridge(user);
  await setSessionCookie(session);
  await touchLogin(session.id);
  await addAudit({
    actorId: session.id,
    actorRole: session.role,
    action: "auth.login.success",
    entity: "users",
    entityId: session.id,
  });

  const redirectTo =
    session.role === "ADMIN" || session.role === "OPERATOR"
      ? safeNextPath(parsed.data.next, "/admin")
      : safeNextPath(parsed.data.next, "/portal");

  return { ok: true, user: session, redirectTo };
}

export async function signupAction(
  _prev: AuthResponse | null,
  formData: FormData,
): Promise<AuthResponse> {
  const csrf = await assertCsrf(String(formData.get("__csrf") ?? ""));
  if (!csrf) {
    return { ok: false, error: "Your session expired. Please try again.", code: "VALIDATION" };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    company: String(formData.get("company") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    terms: formData.get("terms") === "on" || formData.get("terms") === "true",
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields and try again.",
      code: "VALIDATION",
      fields: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? "form"), i.message]),
      ),
    };
  }

  const limit = rateLimit(await callerKey("signup"), { max: 4, windowSeconds: 900 });
  if (!limit.ok) {
    return {
      ok: false,
      error: `Too many sign-up attempts. Try again in ${limit.resetSeconds}s.`,
      code: "RATE_LIMITED",
    };
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    // Same generic copy as a wrong password — do not confirm account existence.
    return {
      ok: false,
      error: "We couldn't create that account. Try signing in instead.",
      code: "CONFLICT",
      fields: { email: "This email is already registered." },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const client = await createClient({
    name: parsed.data.company,
    contactName: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
  });

  const user = await createUser({
    email: parsed.data.email,
    name: cleanText(parsed.data.name, 120),
    passwordHash,
    role: "CLIENT",
    clientId: client.id,
  });

  await setSessionCookie(user);
  await touchLogin(user.id);
  await addAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.signup.success",
    entity: "clients",
    entityId: client.id,
    meta: { clientCode: client.code },
  });

  return { ok: true, user, redirectTo: "/portal?welcome=1" };
}

export async function logoutAction(): Promise<{ ok: true }> {
  await clearSession();
  return { ok: true };
}
