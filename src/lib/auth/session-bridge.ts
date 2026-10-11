import "server-only";

import { toSessionUser } from "@/lib/db/repositories";
import type { SessionUser } from "@/types";

/**
 * Small bridge so `actions.ts` (a "use server" module) can pull session
 * helpers without dragging `server-only` side effects into the action bundle.
 */
export {
  assertCsrf,
  clearSession,
  createSessionToken,
  getSession,
  hashIp,
  issueCsrfToken,
  readCsrfToken,
  resolveCsrfToken,
  setSessionCookie,
  verifySessionToken,
  CSRF_COOKIE,
  SESSION_COOKIE,
} from "./session";

export function toSessionUserBridge(row: any): SessionUser {
  return toSessionUser(row);
}
