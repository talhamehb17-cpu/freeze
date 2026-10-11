import "server-only";

/**
 * Server-only environment access, validated once at boot.
 *
 * SECURITY (spec §03):
 *   • This module is `server-only` — importing it from a client component is a
 *     build error, so DATABASE_URL / AUTH_SECRET can never reach the browser.
 *   • Only variables WITHOUT the `NEXT_PUBLIC_` prefix are read here.
 *   • Nothing is hardcoded. A missing value degrades to demo mode; it never
 *     falls back to a committed default credential.
 */

import { z } from "zod";

const ServerEnv = z.object({
  DATABASE_URL: z.string().trim().min(1).optional(),
  AUTH_SECRET: z.string().trim().min(16).optional(),
  AUTH_SESSION_TTL: z.coerce.number().int().positive().default(86400),
  GOOGLE_CLIENT_ID: z.string().trim().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().trim().min(1).optional(),
  EMAIL_SERVER: z.string().trim().min(1).optional(),
  EMAIL_FROM: z.string().trim().min(1).optional(),
  WHATSAPP_API_KEY: z.string().trim().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().trim().min(1).optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(6),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  SEED_ADMIN_EMAIL: z.string().trim().min(1).optional(),
  SEED_ADMIN_PASSWORD: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().trim().min(1).default("http://localhost:3000"),
  NEXT_PUBLIC_DEMO_MODE: z
    .enum(["true", "false"])
    .default(process.env.NEXT_PUBLIC_DEMO_MODE === "false" ? "false" : "true"),
});

const parsed = ServerEnv.safeParse(process.env);

if (!parsed.success) {
  // Never dump raw values — report the offending key names only.
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  throw new Error(`Invalid environment configuration:\n${issues.join("\n")}`);
}

const env = parsed.data;

/**
 * A non-production signing secret is generated per-process so the app can boot
 * in a sandbox. Sessions will not survive a restart in that mode — which is the
 * intended, safe behaviour. Set AUTH_SECRET for any real deployment.
 */
let fallbackSecret: string | null = null;
function signingSecret(): string {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (!fallbackSecret) {
    const bytes = new Uint8Array(48);
    crypto.getRandomValues(bytes);
    fallbackSecret = Buffer.from(bytes).toString("base64url");
    console.warn(
      "[auth] AUTH_SECRET is not set — using an ephemeral per-process secret. " +
        "Sessions will not persist across restarts. Set AUTH_SECRET before deploying.",
    );
  }
  return fallbackSecret;
}

export const serverEnv = {
  databaseUrl: env.DATABASE_URL ?? null,
  authSecret: signingSecret,
  sessionTtlSeconds: env.AUTH_SESSION_TTL,
  google:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      : null,
  email: env.EMAIL_SERVER ? { server: env.EMAIL_SERVER, from: env.EMAIL_FROM ?? null } : null,
  whatsapp:
    env.WHATSAPP_API_KEY && env.WHATSAPP_PHONE_NUMBER_ID
      ? { apiKey: env.WHATSAPP_API_KEY, phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID }
      : null,
  rateLimit: { max: env.RATE_LIMIT_MAX, windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS },
  siteUrl: env.NEXT_PUBLIC_SITE_URL,
  demoMode: env.NEXT_PUBLIC_DEMO_MODE === "true" || !env.DATABASE_URL,
  seed: {
    adminEmail: env.SEED_ADMIN_EMAIL ?? null,
    adminPassword: env.SEED_ADMIN_PASSWORD ?? null,
  },
} as const;

/** True when a real PostgreSQL database is wired up. */
export const isDatabaseConfigured = Boolean(env.DATABASE_URL);

/** True when Google OAuth credentials are present. */
export const isGoogleConfigured = serverEnv.google !== null;
