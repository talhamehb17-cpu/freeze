import "server-only";

/**
 * Repository layer — the ONLY way the application touches data.
 *
 *  • PostgreSQL + Drizzle when DATABASE_URL is configured (production).
 *  • File-backed store otherwise (demo / CI / local first run).
 *
 * Server components, server actions and route handlers import from here.
 * No client component may import this module (it is `server-only`).
 */

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { isDatabaseConfigured } from "@/lib/env";
import type {
  DocumentKind,
  EventSeverity,
  FacilityEventView,
  InquiryPayload,
  InquiryStatus,
  InquiryView,
  InventoryStatus,
  InventoryView,
  ProductCategory,
  SessionUser,
  TelemetrySample,
  UnitOfMeasure,
  UserRole,
  ZoneKind,
  ZoneView,
} from "@/types";
import { cleanText, makeBatchCode, makeReferenceId } from "@/lib/utils";

import { getDb, schema } from "./client";
import { newId, nextCounter, withStore, type StoreShape } from "./file-store";
import { buildSeed } from "./seed";

const {
  users,
  clients,
  storageInquiries,
  storageZones,
  inventoryItems,
  storageContracts,
  documents,
  facilityEvents,
  telemetryLogs,
  notifications,
  auditLogs,
} = schema;

/* ========================================================================== */
/* Bootstrap                                                                   */
/* ========================================================================== */

let seeded = false;

async function ensureSeeded(store: StoreShape) {
  if (seeded || store.storageZones.length > 0) {
    seeded = true;
    return;
  }
  const seed = await buildSeed();
  store.users = seed.users;
  store.clients = seed.clients;
  store.storageZones = seed.zones;
  store.inventoryItems = seed.inventory;
  // Seeded enquiries give the command centre a populated queue to demo —
  // without this line the pipeline silently starts empty.
  store.storageInquiries = seed.storageInquiries;
  store.storageContracts = seed.contracts;
  store.documents = seed.documents;
  store.facilityEvents = seed.events;
  store.telemetryLogs = seed.telemetry;
  store.notifications = [];
  store.auditLogs = seed.audit;
  store.counters = {
    inventory: seed.inventory.length,
    inquiry: seed.storageInquiries.length,
  };
  seeded = true;
}

/** Idempotent — safe to call from every request path. */
export async function ensureReady() {
  if (isDatabaseConfigured) return;
  await withStore((store) => ensureSeeded(store));
}

/* ========================================================================== */
/* Mappers — DB rows → public views (never leak internal columns)             */
/* ========================================================================== */

const asDate = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v ?? new Date().toISOString()));

function toInquiryView(row: any): InquiryView {
  return {
    id: String(row.id),
    reference: String(row.reference),
    name: String(row.name),
    company: row.company ?? null,
    email: String(row.email),
    phone: String(row.phone),
    product: row.product as ProductCategory,
    quantity: Number(row.quantity ?? 0),
    unit: (row.unit ?? "PALLET") as UnitOfMeasure,
    durationMonths: Number(row.durationMonths ?? row.duration_months ?? 1),
    message: row.message ?? null,
    status: (row.status ?? "NEW") as InquiryStatus,
    notes: row.notes ?? null,
    source: row.source ?? null,
    createdAt: asDate(row.createdAt ?? row.created_at),
    updatedAt: asDate(row.updatedAt ?? row.updated_at),
  };
}

function toInventoryView(row: any, zoneName?: string | null): InventoryView {
  return {
    id: String(row.id),
    batch: String(row.batch),
    product: row.product as ProductCategory,
    productName: String(row.productName ?? row.product_name ?? ""),
    zone: String(zoneName ?? row.zoneCode ?? row.zone ?? ""),
    location: String(row.location ?? ""),
    quantity: Number(row.quantity ?? 0),
    unit: (row.unit ?? "PALLET") as UnitOfMeasure,
    status: (row.status ?? "IN_STORAGE") as InventoryStatus,
    temperature: String(row.temperatureLabel ?? row.temperature_label ?? "CLIENT CONFIGURED"),
    tracking: row.trackingActive ?? row.tracking_active ? "ACTIVE" : "PAUSED",
    arrivedAt: asDate(row.arrivedAt ?? row.arrived_at),
    dispatchAt: row.dispatchAt ?? row.dispatch_at ? asDate(row.dispatchAt ?? row.dispatch_at) : null,
    clientId: row.clientId ?? row.client_id ?? null,
  };
}

function toZoneView(row: any): ZoneView {
  const cap = Number(row.palletCapacity ?? row.pallet_capacity ?? 0);
  const used = Number(row.palletsUsed ?? row.pallets_used ?? 0);
  const temp = row.temperatureC ?? row.temperature_c;
  return {
    id: String(row.id),
    name: String(row.name),
    code: String(row.code),
    kind: (row.kind ?? "COLD") as ZoneKind,
    status: (row.status ?? "ACTIVE") as ZoneView["status"],
    temperature: temp === null || temp === undefined ? null : Number(temp),
    humidity: row.humidityPct ?? row.humidity_pct ?? null,
    occupancyPct: cap > 0 ? Math.round((used / cap) * 100) : 0,
    monitored: Boolean(row.monitored ?? true),
  };
}

function toEventView(row: any, zoneName?: string | null): FacilityEventView {
  return {
    id: String(row.id),
    at: asDate(row.occurredAt ?? row.occurred_at),
    zone: String(zoneName ?? row.zone ?? "FACILITY"),
    type: String(row.type),
    severity: (row.severity ?? "INFO") as EventSeverity,
    message: String(row.message),
  };
}

export function toSessionUser(row: any): SessionUser {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: (row.role ?? "CLIENT") as UserRole,
    clientId: row.clientId ?? row.client_id ?? null,
    image: row.image ?? null,
  };
}

/* ========================================================================== */
/* Inquiries                                                                   */
/* ========================================================================== */

export interface CreateInquiryMeta {
  source?: string | null;
  ipAddressHash?: string | null;
}

export async function createInquiry(
  payload: InquiryPayload,
  meta: CreateInquiryMeta = {},
): Promise<InquiryView> {
  const reference = makeReferenceId("TJ");
  const now = new Date();

  const row = {
    id: newId("inq_"),
    reference,
    name: cleanText(payload.name, 120),
    company: payload.company ? cleanText(payload.company, 160) : null,
    email: payload.email.toLowerCase().trim(),
    phone: cleanText(payload.phone, 40),
    product: payload.product,
    quantity: payload.quantity,
    unit: payload.unit,
    durationMonths: payload.durationMonths,
    message: payload.message ? cleanText(payload.message, 4000) : null,
    source: meta.source ?? payload.source ?? "website",
    status: "NEW" as InquiryStatus,
    notes: null,
    assignedTo: null,
    clientId: null,
    ipAddressHash: meta.ipAddressHash ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (isDatabaseConfigured) {
    const db = await getDb();
    const [inserted] = await db.insert(storageInquiries).values(row as any).returning();
    return toInquiryView(inserted);
  }

  return withStore(async (store) => {
    await ensureSeeded(store);
    store.storageInquiries.unshift({
      ...row,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
    store.auditLogs.unshift({
      id: newId("aud_"),
      actorId: null,
      actorRole: null,
      action: "inquiry.create",
      entity: "storage_inquiries",
      entityId: row.id,
      meta: { reference, source: row.source },
      ipAddressHash: row.ipAddressHash,
      createdAt: now.toISOString(),
    });
    return toInquiryView(row);
  });
}

export interface InquiryFilter {
  status?: InquiryStatus | "ALL";
  query?: string;
  limit?: number;
  offset?: number;
}

export async function listInquiries(filter: InquiryFilter = {}): Promise<InquiryView[]> {
  const limit = Math.min(filter.limit ?? 100, 500);

  if (isDatabaseConfigured) {
    const db = await getDb();
    const conditions = [];
    if (filter.status && filter.status !== "ALL") conditions.push(eq(storageInquiries.status, filter.status));
    if (filter.query) {
      const q = `%${filter.query}%`;
      conditions.push(
        or(
          ilike(storageInquiries.name, q),
          ilike(storageInquiries.company, q),
          ilike(storageInquiries.email, q),
          ilike(storageInquiries.reference, q),
        )!,
      );
    }
    const rows = await db
      .select()
      .from(storageInquiries)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(storageInquiries.createdAt))
      .limit(limit)
      .offset(filter.offset ?? 0);
    return rows.map(toInquiryView);
  }

  return withStore(async (store) => {
    await ensureSeeded(store);
    const q = filter.query?.toLowerCase().trim();
    return store.storageInquiries
      .filter((r) => (filter.status && filter.status !== "ALL" ? r.status === filter.status : true))
      .filter((r) =>
        q
          ? [r.name, r.company, r.email, r.reference, r.phone].some((v) =>
              String(v ?? "").toLowerCase().includes(q),
            )
          : true,
      )
      .slice(filter.offset ?? 0, (filter.offset ?? 0) + limit)
      .map(toInquiryView);
  });
}

export async function getInquiry(id: string): Promise<InquiryView | null> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const [row] = await db.select().from(storageInquiries).where(eq(storageInquiries.id, id)).limit(1);
    return row ? toInquiryView(row) : null;
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    const row = store.storageInquiries.find((r) => r.id === id);
    return row ? toInquiryView(row) : null;
  });
}

export async function getInquiryByReference(reference: string): Promise<InquiryView | null> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(storageInquiries)
      .where(eq(storageInquiries.reference, reference.toUpperCase()))
      .limit(1);
    return row ? toInquiryView(row) : null;
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    const row = store.storageInquiries.find((r) => r.reference === reference.toUpperCase());
    return row ? toInquiryView(row) : null;
  });
}

export async function updateInquiry(
  id: string,
  patch: Partial<Pick<InquiryView, "status" | "notes">>,
): Promise<InquiryView | null> {
  const now = new Date();
  if (isDatabaseConfigured) {
    const db = await getDb();
    const [row] = await db
      .update(storageInquiries)
      .set({ ...patch, updatedAt: now } as any)
      .where(eq(storageInquiries.id, id))
      .returning();
    return row ? toInquiryView(row) : null;
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    const row = store.storageInquiries.find((r) => r.id === id);
    if (!row) return null;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.notes !== undefined) row.notes = patch.notes;
    row.updatedAt = now.toISOString();
    return toInquiryView(row);
  });
}

export async function countInquiriesByStatus(): Promise<Record<InquiryStatus, number>> {
  const base: Record<InquiryStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    QUOTED: 0,
    APPROVED: 0,
    REJECTED: 0,
    COMPLETED: 0,
  };
  if (isDatabaseConfigured) {
    const db = await getDb();
    const rows = await db
      .select({ status: storageInquiries.status, n: sql<number>`count(*)::int` })
      .from(storageInquiries)
      .groupBy(storageInquiries.status);
    for (const r of rows) base[r.status as InquiryStatus] = Number(r.n);
    return base;
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    for (const r of store.storageInquiries) {
      const k = r.status as InquiryStatus;
      if (k in base) base[k] += 1;
    }
    return base;
  });
}

/** Inquiry volume per day for the analytics chart. */
export async function inquiryVolume(days = 14): Promise<{ day: string; count: number }[]> {
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  if (isDatabaseConfigured) {
    const db = await getDb();
    const rows = await db
      .select({ day: sql<string>`to_char(${storageInquiries.createdAt}, 'YYYY-MM-DD')`, n: sql<number>`count(*)::int` })
      .from(storageInquiries)
      .groupBy(sql`to_char(${storageInquiries.createdAt}, 'YYYY-MM-DD')`);
    for (const r of rows) if (buckets.has(r.day)) buckets.set(r.day, Number(r.n));
  } else {
    await withStore(async (store) => {
      await ensureSeeded(store);
      for (const r of store.storageInquiries) {
        const day = String(r.createdAt).slice(0, 10);
        if (buckets.has(day)) buckets.set(day, (buckets.get(day) ?? 0) + 1);
      }
    });
  }
  return [...buckets.entries()].map(([day, count]) => ({ day, count }));
}

/* ========================================================================== */
/* Zones                                                                       */
/* ========================================================================== */

export async function listZones(): Promise<ZoneView[]> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const rows = await db.select().from(storageZones).orderBy(storageZones.code);
    return rows.map(toZoneView);
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    return [...store.storageZones].sort((a, b) => a.code.localeCompare(b.code)).map(toZoneView);
  });
}

export async function getZone(idOrCode: string): Promise<ZoneView | null> {
  const zones = await listZones();
  return zones.find((z) => z.id === idOrCode || z.code === idOrCode) ?? null;
}

/* ========================================================================== */
/* Inventory                                                                   */
/* ========================================================================== */

export interface InventoryFilter {
  clientId?: string | null;
  zone?: string;
  status?: InventoryStatus | "ALL";
  query?: string;
  limit?: number;
}

export async function listInventory(filter: InventoryFilter = {}): Promise<InventoryView[]> {
  const limit = Math.min(filter.limit ?? 200, 500);

  if (isDatabaseConfigured) {
    const db = await getDb();
    const conditions = [];
    if (filter.clientId) conditions.push(eq(inventoryItems.clientId, filter.clientId));
    if (filter.status && filter.status !== "ALL") conditions.push(eq(inventoryItems.status, filter.status));
    if (filter.zone) conditions.push(eq(storageZones.code, filter.zone));
    if (filter.query) {
      const q = `%${filter.query}%`;
      conditions.push(or(ilike(inventoryItems.batch, q), ilike(inventoryItems.productName, q))!);
    }
    const rows = await db
      .select({ item: inventoryItems, zone: storageZones.name })
      .from(inventoryItems)
      .leftJoin(storageZones, eq(inventoryItems.zoneId, storageZones.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(inventoryItems.arrivedAt))
      .limit(limit);
    return rows.map((r) => toInventoryView(r.item, r.zone));
  }

  return withStore(async (store) => {
    await ensureSeeded(store);
    const zoneById = new Map(store.storageZones.map((z) => [z.id, z]));
    const q = filter.query?.toLowerCase().trim();
    return store.inventoryItems
      .filter((r) => (filter.clientId ? r.clientId === filter.clientId : true))
      .filter((r) => (filter.status && filter.status !== "ALL" ? r.status === filter.status : true))
      .filter((r) => (filter.zone ? zoneById.get(r.zoneId)?.code === filter.zone : true))
      .filter((r) =>
        q ? [r.batch, r.productName, r.location].some((v) => String(v).toLowerCase().includes(q)) : true,
      )
      .sort((a, b) => String(b.arrivedAt).localeCompare(String(a.arrivedAt)))
      .slice(0, limit)
      .map((r) => toInventoryView(r, zoneById.get(r.zoneId)?.name ?? null));
  });
}

export async function updateInventoryStatus(
  id: string,
  status: InventoryStatus,
): Promise<InventoryView | null> {
  const now = new Date();
  if (isDatabaseConfigured) {
    const db = await getDb();
    const [row] = await db
      .update(inventoryItems)
      .set({ status, updatedAt: now, ...(status === "DISPATCHED" ? { dispatchAt: now } : {}) } as any)
      .where(eq(inventoryItems.id, id))
      .returning();
    if (!row) return null;
    const [zone] = await db.select().from(storageZones).where(eq(storageZones.id, row.zoneId)).limit(1);
    return toInventoryView(row, zone?.name ?? null);
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    const row = store.inventoryItems.find((r) => r.id === id);
    if (!row) return null;
    row.status = status;
    row.updatedAt = now.toISOString();
    if (status === "DISPATCHED") row.dispatchAt = now.toISOString();
    const zone = store.storageZones.find((z) => z.id === row.zoneId);
    return toInventoryView(row, zone?.name ?? null);
  });
}

export async function createInventoryItem(input: {
  productName: string;
  product: ProductCategory;
  zoneId: string;
  location: string;
  quantity: number;
  unit: UnitOfMeasure;
  clientId?: string | null;
  status?: InventoryStatus;
  temperatureLabel?: string;
}): Promise<InventoryView> {
  const now = new Date();
  return withStore(async (store) => {
    await ensureSeeded(store);
    const seq = nextCounter(store, "inventory", store.inventoryItems.length + 1);
    const zone = store.storageZones.find((z) => z.id === input.zoneId);

    if (isDatabaseConfigured) {
      const db = await getDb();
      const [row] = await db
        .insert(inventoryItems)
        .values({
          id: newId("inv_"),
          batch: makeBatchCode(seq),
          productName: cleanText(input.productName, 160),
          product: input.product,
          zoneId: input.zoneId,
          location: input.location,
          quantity: input.quantity,
          unit: input.unit,
          status: input.status ?? "IN_STORAGE",
          temperatureLabel: input.temperatureLabel ?? "CLIENT CONFIGURED",
          trackingActive: true,
          clientId: input.clientId ?? null,
          arrivedAt: now,
        } as any)
        .returning();
      return toInventoryView(row, zone?.name ?? null);
    }

    const row = {
      id: newId("inv_"),
      batch: makeBatchCode(seq),
      productName: cleanText(input.productName, 160),
      product: input.product,
      zoneId: input.zoneId,
      location: input.location,
      quantity: input.quantity,
      unit: input.unit,
      status: input.status ?? "IN_STORAGE",
      temperatureLabel: input.temperatureLabel ?? "CLIENT CONFIGURED",
      trackingActive: true,
      clientId: input.clientId ?? null,
      arrivedAt: now.toISOString(),
      dispatchAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    store.inventoryItems.unshift(row);
    if (zone) zone.palletsUsed = Number(zone.palletsUsed ?? 0) + (input.unit === "PALLET" ? input.quantity : 1);
    return toInventoryView(row, zone?.name ?? null);
  });
}

/* ========================================================================== */
/* Telemetry & events                                                          */
/* ========================================================================== */

export async function getTelemetry(opts: {
  zoneId?: string;
  points?: number;
}): Promise<TelemetrySample[]> {
  const points = Math.min(opts.points ?? 48, 240);

  if (isDatabaseConfigured) {
    const db = await getDb();
    const conditions = opts.zoneId ? [eq(telemetryLogs.zoneId, opts.zoneId)] : [];
    const rows = await db
      .select({ log: telemetryLogs, zone: storageZones.code })
      .from(telemetryLogs)
      .leftJoin(storageZones, eq(telemetryLogs.zoneId, storageZones.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(telemetryLogs.recordedAt))
      .limit(points);
    return rows
      .map((r) => ({
        at: asDate(r.log.recordedAt),
        zone: r.zone ?? "FACILITY",
        temperature: Number(r.log.temperatureC),
        humidity: Number(r.log.humidityPct ?? 0),
        simulated: Boolean(r.log.simulated),
      }))
      .reverse();
  }

  return withStore(async (store) => {
    await ensureSeeded(store);
    const byZone = new Map(store.storageZones.map((z) => [z.id, z.code]));
    return store.telemetryLogs
      .filter((r) => (opts.zoneId ? r.zoneId === opts.zoneId : true))
      .slice(-points)
      .map((r) => ({
        at: String(r.recordedAt),
        zone: byZone.get(r.zoneId) ?? "FACILITY",
        temperature: Number(r.temperatureC),
        humidity: Number(r.humidityPct ?? 0),
        simulated: r.simulated !== false,
      }));
  });
}

export async function listEvents(limit = 12): Promise<FacilityEventView[]> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const rows = await db
      .select({ event: facilityEvents, zone: storageZones.name })
      .from(facilityEvents)
      .leftJoin(storageZones, eq(facilityEvents.zoneId, storageZones.id))
      .orderBy(desc(facilityEvents.occurredAt))
      .limit(limit);
    return rows.map((r) => toEventView(r.event, r.zone ?? "FACILITY"));
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    const byZone = new Map(store.storageZones.map((z) => [z.id, z.name]));
    return store.facilityEvents
      .slice()
      .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
      .slice(0, limit)
      .map((r) => toEventView(r, byZone.get(r.zoneId) ?? "FACILITY"));
  });
}

/* ========================================================================== */
/* Clients, contracts, documents                                              */
/* ========================================================================== */

export interface ClientView {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  pallets: number;
  batches: number;
}

export async function listClients(): Promise<ClientView[]> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const rows = await db.select().from(clients).orderBy(clients.name);
    const counts = await db
      .select({
        clientId: inventoryItems.clientId,
        pallets: sql<number>`coalesce(sum(${inventoryItems.quantity}),0)::int`,
        batches: sql<number>`count(*)::int`,
      })
      .from(inventoryItems)
      .where(inArray(inventoryItems.status, ["RECEIVED", "IN_STORAGE", "RESERVED"]))
      .groupBy(inventoryItems.clientId);
    const map = new Map(counts.map((c) => [c.clientId, c]));
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      contactName: r.contactName,
      email: r.email,
      phone: r.phone,
      status: r.status,
      pallets: map.get(r.id)?.pallets ?? 0,
      batches: map.get(r.id)?.batches ?? 0,
    }));
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    return store.clients
      .map((c) => {
        const items = store.inventoryItems.filter(
          (i) => i.clientId === c.id && ["RECEIVED", "IN_STORAGE", "RESERVED"].includes(i.status),
        );
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          contactName: c.contactName ?? null,
          email: c.email ?? null,
          phone: c.phone ?? null,
          status: c.status ?? "ACTIVE",
          pallets: items.reduce((sum, i) => sum + Number(i.quantity ?? 0), 0),
          batches: items.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

export interface ContractView {
  id: string;
  reference: string;
  clientName: string;
  zoneName: string | null;
  product: ProductCategory;
  pallets: number;
  status: string;
  startsAt: string;
  endsAt: string | null;
  temperatureProfile: string | null;
}

export async function listContracts(clientId?: string | null): Promise<ContractView[]> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const rows = await db
      .select({ contract: storageContracts, client: clients.name, zone: storageZones.name })
      .from(storageContracts)
      .leftJoin(clients, eq(storageContracts.clientId, clients.id))
      .leftJoin(storageZones, eq(storageContracts.zoneId, storageZones.id))
      .where(clientId ? eq(storageContracts.clientId, clientId) : undefined)
      .orderBy(desc(storageContracts.startsAt));
    return rows.map((r) => ({
      id: r.contract.id,
      reference: r.contract.reference,
      clientName: r.client ?? "—",
      zoneName: r.zone ?? null,
      product: r.contract.product,
      pallets: r.contract.pallets,
      status: r.contract.status,
      startsAt: asDate(r.contract.startsAt),
      endsAt: r.contract.endsAt ? asDate(r.contract.endsAt) : null,
      temperatureProfile: r.contract.temperatureProfile,
    }));
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    const clientById = new Map(store.clients.map((c) => [c.id, c.name]));
    const zoneById = new Map(store.storageZones.map((z) => [z.id, z.name]));
    return store.storageContracts
      .filter((c) => (clientId ? c.clientId === clientId : true))
      .sort((a, b) => String(b.startsAt).localeCompare(String(a.startsAt)))
      .map((c) => ({
        id: c.id,
        reference: c.reference,
        clientName: clientById.get(c.clientId) ?? "—",
        zoneName: zoneById.get(c.zoneId) ?? null,
        product: c.product,
        pallets: Number(c.pallets),
        status: c.status,
        startsAt: String(c.startsAt),
        endsAt: c.endsAt ? String(c.endsAt) : null,
        temperatureProfile: c.temperatureProfile ?? null,
      }));
  });
}

export interface DocumentView {
  id: string;
  kind: DocumentKind;
  reference: string;
  title: string;
  url: string | null;
  createdAt: string;
}

export async function listDocuments(clientId?: string | null): Promise<DocumentView[]> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const rows = await db
      .select()
      .from(documents)
      .where(clientId ? eq(documents.clientId, clientId) : undefined)
      .orderBy(desc(documents.createdAt));
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      reference: r.reference,
      title: r.title,
      url: r.url,
      createdAt: asDate(r.createdAt),
    }));
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    return store.documents
      .filter((d) => (clientId ? d.clientId === clientId : true))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((d) => ({
        id: d.id,
        kind: d.kind,
        reference: d.reference,
        title: d.title,
        url: d.url ?? null,
        createdAt: String(d.createdAt),
      }));
  });
}

/* ========================================================================== */
/* Users                                                                       */
/* ========================================================================== */

export async function findUserByEmail(email: string): Promise<any | null> {
  const normalized = email.toLowerCase().trim();
  if (isDatabaseConfigured) {
    const db = await getDb();
    const [row] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
    return row ?? null;
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    return store.users.find((u) => String(u.email).toLowerCase() === normalized) ?? null;
  });
}

export async function findUserById(id: string): Promise<any | null> {
  if (isDatabaseConfigured) {
    const db = await getDb();
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    return store.users.find((u) => u.id === id) ?? null;
  });
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash?: string | null;
  role?: UserRole;
  clientId?: string | null;
  oauthProvider?: string | null;
  oauthSubject?: string | null;
}): Promise<SessionUser> {
  const now = new Date();
  const row = {
    id: newId("usr_"),
    email: input.email.toLowerCase().trim(),
    passwordHash: input.passwordHash ?? null,
    name: cleanText(input.name, 120),
    role: input.role ?? "CLIENT",
    clientId: input.clientId ?? null,
    image: null,
    oauthProvider: input.oauthProvider ?? null,
    oauthSubject: input.oauthSubject ?? null,
    emailVerified: Boolean(input.oauthProvider),
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (isDatabaseConfigured) {
    const db = await getDb();
    const [inserted] = await db.insert(users).values(row as any).returning();
    return toSessionUser(inserted);
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    store.users.push({ ...row, createdAt: now.toISOString(), updatedAt: now.toISOString() });
    return toSessionUser(row);
  });
}

export async function createClient(input: {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
}): Promise<{ id: string; code: string }> {
  return withStore(async (store) => {
    await ensureSeeded(store);
    const seq = nextCounter(store, "client", store.clients.length + 1);
    const code = `CL-${String(seq).padStart(4, "0")}`;
    const id = newId("cli_");

    if (isDatabaseConfigured) {
      const db = await getDb();
      await db.insert(clients).values({
        id,
        code,
        name: cleanText(input.name, 160),
        contactName: input.contactName ? cleanText(input.contactName, 120) : null,
        email: input.email?.toLowerCase().trim() ?? null,
        phone: input.phone ?? null,
        status: "ACTIVE",
      } as any);
      return { id, code };
    }

    store.clients.push({
      id,
      code,
      name: cleanText(input.name, 160),
      contactName: input.contactName ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: null,
      taxNumber: null,
      notes: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { id, code };
  });
}

export async function touchLogin(userId: string) {
  const now = new Date();
  if (isDatabaseConfigured) {
    const db = await getDb();
    await db.update(users).set({ lastLoginAt: now } as any).where(eq(users.id, userId));
    return;
  }
  await withStore(async (store) => {
    await ensureSeeded(store);
    const u = store.users.find((x) => x.id === userId);
    if (u) u.lastLoginAt = now.toISOString();
  });
}

/* ========================================================================== */
/* Notifications & audit                                                       */
/* ========================================================================== */

export async function recordNotification(input: {
  channel: "EMAIL" | "WHATSAPP" | "IN_APP";
  recipient: string;
  subject?: string;
  body?: string;
  status?: "QUEUED" | "SENT" | "FAILED" | "DISABLED";
  inquiryId?: string | null;
  error?: string | null;
}) {
  const now = new Date();
  const row = {
    id: newId("ntf_"),
    channel: input.channel,
    recipient: input.recipient,
    subject: input.subject ?? null,
    body: input.body ?? null,
    status: input.status ?? "QUEUED",
    providerMessageId: null,
    error: input.error ?? null,
    userId: null,
    inquiryId: input.inquiryId ?? null,
    createdAt: now,
    sentAt: input.status === "SENT" ? now : null,
  };
  if (isDatabaseConfigured) {
    const db = await getDb();
    await db.insert(notifications).values(row as any);
    return;
  }
  await withStore(async (store) => {
    await ensureSeeded(store);
    store.notifications.unshift({ ...row, createdAt: now.toISOString() });
  });
}

export async function addAudit(input: {
  actorId?: string | null;
  actorRole?: UserRole | null;
  action: string;
  entity: string;
  entityId?: string | null;
  meta?: Record<string, unknown> | null;
  ipAddressHash?: string | null;
}) {
  const now = new Date();
  const row = {
    id: newId("aud_"),
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    meta: input.meta ?? null,
    ipAddressHash: input.ipAddressHash ?? null,
    createdAt: now,
  };
  if (isDatabaseConfigured) {
    const db = await getDb();
    await db.insert(auditLogs).values(row as any);
    return;
  }
  await withStore(async (store) => {
    await ensureSeeded(store);
    store.auditLogs.unshift({ ...row, createdAt: now.toISOString() });
    if (store.auditLogs.length > 500) store.auditLogs.length = 500;
  });
}

export async function listAudit(limit = 20) {
  if (isDatabaseConfigured) {
    const db = await getDb();
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  }
  return withStore(async (store) => {
    await ensureSeeded(store);
    return store.auditLogs.slice(0, limit);
  });
}

/* ========================================================================== */
/* Aggregates for the command centre                                          */
/* ========================================================================== */

export interface OverviewStats {
  inquiriesTotal: number;
  inquiriesNew: number;
  clients: number;
  batches: number;
  palletsStored: number;
  palletCapacity: number;
  occupancyPct: number;
  zones: number;
  activeZones: number;
  alerts: number;
  trackingActive: number;
  inventoryByStatus: Record<string, number>;
  inventoryByProduct: Record<string, number>;
  utilisation: { zone: string; used: number; capacity: number; pct: number }[];
  /** True whenever any figure below originates from the simulated feed. */
  simulated: boolean;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const [zones, inventory, events, byStatus, clientList] = await Promise.all([
    listZones(),
    listInventory({ limit: 500 }),
    listEvents(60),
    countInquiriesByStatus(),
    listClients(),
  ]);
  const inquiriesTotal = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const stored = inventory.filter((i) =>
    ["RECEIVED", "IN_STORAGE", "RESERVED"].includes(i.status),
  );
  const palletsStored = stored
    .filter((i) => i.unit === "PALLET")
    .reduce((sum, i) => sum + i.quantity, 0);

  const inventoryByStatus: Record<string, number> = {};
  for (const i of inventory) inventoryByStatus[i.status] = (inventoryByStatus[i.status] ?? 0) + 1;

  const inventoryByProduct: Record<string, number> = {};
  for (const i of stored)
    inventoryByProduct[i.product] = (inventoryByProduct[i.product] ?? 0) + i.quantity;

  const zoneRows = await (isDatabaseConfigured
    ? (async () => {
        const db = await getDb();
        return db.select().from(storageZones);
      })()
    : withStore(async (store) => {
        await ensureSeeded(store);
        return store.storageZones;
      }));

  const utilisation = zoneRows
    .filter((z: any) => Number(z.palletCapacity ?? z.pallet_capacity ?? 0) > 0)
    .map((z: any) => {
      const capacity = Number(z.palletCapacity ?? z.pallet_capacity);
      const used = Number(z.palletsUsed ?? z.pallets_used ?? 0);
      return { zone: z.code, used, capacity, pct: Math.round((used / capacity) * 100) };
    });

  const palletCapacity = zoneRows.reduce(
    (sum: number, z: any) => sum + Number(z.palletCapacity ?? z.pallet_capacity ?? 0),
    0,
  );

  return {
    inquiriesTotal,
    inquiriesNew: byStatus.NEW,
    clients: clientList.length,
    batches: stored.length,
    palletsStored,
    palletCapacity,
    occupancyPct: palletCapacity > 0 ? Math.round((palletsStored / palletCapacity) * 100) : 0,
    zones: zones.length,
    activeZones: zones.filter((z) => z.status === "ACTIVE").length,
    alerts: events.filter((e) => e.severity !== "INFO").length,
    trackingActive: inventory.filter((i) => i.tracking === "ACTIVE").length,
    inventoryByStatus,
    inventoryByProduct,
    utilisation,
    simulated: !isDatabaseConfigured,
  };
}
