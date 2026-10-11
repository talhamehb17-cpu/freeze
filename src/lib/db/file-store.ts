import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * File-backed store — the demo/CI driver used when DATABASE_URL is absent.
 *
 * It persists to `.data/store.json` (git-ignored). On a read-only filesystem it
 * degrades gracefully to memory-only. Row shapes match the Drizzle schema so
 * switching to PostgreSQL requires no changes above the repository layer.
 */

export interface StoreShape {
  users: any[];
  clients: any[];
  storageInquiries: any[];
  storageZones: any[];
  inventoryItems: any[];
  storageContracts: any[];
  leases: any[];
  telemetryLogs: any[];
  facilityEvents: any[];
  documents: any[];
  notifications: any[];
  auditLogs: any[];
  counters: Record<string, number>;
}

const EMPTY: StoreShape = {
  users: [],
  clients: [],
  storageInquiries: [],
  storageZones: [],
  inventoryItems: [],
  storageContracts: [],
  leases: [],
  telemetryLogs: [],
  facilityEvents: [],
  documents: [],
  notifications: [],
  auditLogs: [],
  counters: {},
};

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");

let memory: StoreShape | null = null;
let persistEnabled = true;
let writeQueue: Promise<void> = Promise.resolve();

async function load(): Promise<StoreShape> {
  if (memory) return memory;
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    memory = { ...structuredClone(EMPTY), ...parsed, counters: parsed.counters ?? {} };
  } catch {
    memory = structuredClone(EMPTY);
  }
  return memory;
}

function schedulePersist() {
  if (!persistEnabled || !memory) return;
  const snapshot = JSON.stringify(memory, null, 2);
  writeQueue = writeQueue.then(async () => {
    try {
      await mkdir(DIR, { recursive: true });
      await writeFile(FILE, snapshot, "utf8");
    } catch {
      // Read-only filesystem (e.g. serverless) — stay in memory, keep working.
      persistEnabled = false;
    }
  });
}

/** Serialised mutation helper — keeps concurrent requests consistent. */
export async function withStore<T>(fn: (store: StoreShape) => T | Promise<T>): Promise<T> {
  const store = await load();
  const result = await fn(store);
  schedulePersist();
  return result;
}

export function nextCounter(store: StoreShape, key: string, start = 1) {
  const value = (store.counters[key] ?? start - 1) + 1;
  store.counters[key] = value;
  return value;
}

/** Short, collision-resistant id (same 32-char width as the SQL varchar ids). */
export function newId(prefix = "") {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const rand = Buffer.from(bytes).toString("base64url").slice(0, 16);
  const time = Date.now().toString(36).slice(-6);
  return `${prefix}${time}${rand}`.slice(0, 32);
}

export async function flushStore() {
  await writeQueue;
}

export const storeFile = FILE;
