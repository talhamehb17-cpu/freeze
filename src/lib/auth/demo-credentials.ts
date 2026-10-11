/**
 * Seeded demonstration accounts.
 *
 * This module is deliberately dependency-free (no `server-only`, no DB) so the
 * login page can show the credentials to a reviewer while the server seed uses
 * the very same values. There is no live customer base in this build — the
 * accounts exist so the portal and command centre can be inspected end to end.
 *
 * ROTATE BEFORE ANY REAL DEPLOYMENT. Override with SEED_ADMIN_EMAIL /
 * SEED_ADMIN_PASSWORD in `.env.local`.
 */
export const DEMO_CREDENTIALS = {
  admin: { email: "admin@tahseenjaber.iq", password: "ColdChain!2026", label: "Administrator" },
  operator: { email: "operator@tahseenjaber.iq", password: "Operator!2026", label: "Operator" },
  client: { email: "client@shatt-seafood.example", password: "Client!2026", label: "Client" },
} as const;
