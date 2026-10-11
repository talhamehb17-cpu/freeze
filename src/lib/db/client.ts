import "server-only";

import { isDatabaseConfigured, serverEnv } from "@/lib/env";

/**
 * Lazy Drizzle/PostgreSQL connection.
 *
 * `pg` is imported dynamically so the driver is only ever loaded when a real
 * DATABASE_URL exists — the demo file store path ships zero database code to
 * the runtime that does not need it.
 */

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

let cached: Db | null = null;
let pool: import("pg").Pool | null = null;

export async function getDb(): Promise<Db> {
  if (cached) return cached;
  if (!isDatabaseConfigured) {
    throw new Error(
      "DATABASE_URL is not configured. Use the repository layer (src/lib/db/repositories.ts) " +
        "which falls back to the file store, or set DATABASE_URL to enable PostgreSQL.",
    );
  }
  const { default: pg } = await import("pg");
  pool =
    pool ??
    new pg.Pool({
      connectionString: serverEnv.databaseUrl!,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      // TLS on in production unless explicitly disabled.
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
    });
  cached = drizzle(pool, { schema });
  return cached;
}

export async function closeDb() {
  await pool?.end();
  pool = null;
  cached = null;
}

export { schema };
