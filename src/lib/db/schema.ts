/**
 * Production database contract — PostgreSQL via Drizzle ORM.
 *
 * Applied with:  npm run db:generate && npm run db:migrate   (needs DATABASE_URL)
 *
 * When DATABASE_URL is absent the app transparently uses the file-backed store
 * in `./file-store.ts` so the product stays fully functional in demo/CI.
 * The repository API in `./repositories.ts` is identical for both drivers.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------- enums ---------------------------------- */

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "OPERATOR", "CLIENT"]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
]);

export const productCategoryEnum = pgEnum("product_category", [
  "PRODUCE",
  "MEAT",
  "SEAFOOD",
  "PHARMA",
  "OTHER",
]);

export const unitOfMeasureEnum = pgEnum("unit_of_measure", [
  "PALLET",
  "TONNE",
  "KG",
  "CARTON",
  "UNIT",
]);

export const inventoryStatusEnum = pgEnum("inventory_status", [
  "RECEIVED",
  "IN_STORAGE",
  "RESERVED",
  "IN_TRANSIT",
  "DISPATCHED",
  "QUARANTINE",
]);

export const storageStatusEnum = pgEnum("storage_status", [
  "ACTIVE",
  "SUSPENDED",
  "COMPLETED",
  "CANCELLED",
]);

export const zoneKindEnum = pgEnum("zone_kind", [
  "RECEIVING",
  "COLD",
  "FROZEN",
  "PHARMA",
  "LOADING",
  "DISPATCH",
  "SECURITY",
]);

export const documentKindEnum = pgEnum("document_kind", [
  "CONTRACT",
  "INVOICE",
  "GATE_PASS",
  "CERTIFICATE",
  "RECEIPT",
  "OTHER",
]);

export const eventSeverityEnum = pgEnum("event_severity", ["INFO", "WARNING", "CRITICAL"]);

/* ------------------------------- tables --------------------------------- */

/** A client company. Users belong to a client; admins do not. */
export const clients = pgTable(
  "clients",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    code: varchar("code", { length: 16 }).notNull(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    taxNumber: text("tax_number"),
    notes: text("notes"),
    status: storageStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("clients_code_idx").on(t.code), index("clients_status_idx").on(t.status)],
);

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    email: varchar("email", { length: 254 }).notNull(),
    /** bcrypt hash. NEVER a plain-text password. */
    passwordHash: text("password_hash"),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull().default("CLIENT"),
    clientId: varchar("client_id", { length: 32 }).references(() => clients.id, {
      onDelete: "set null",
    }),
    image: text("image"),
    /** Set for Google OAuth accounts; null for password accounts. */
    oauthProvider: varchar("oauth_provider", { length: 32 }),
    oauthSubject: varchar("oauth_subject", { length: 190 }),
    emailVerified: boolean("email_verified").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_idx").on(t.email),
    uniqueIndex("users_oauth_idx").on(t.oauthProvider, t.oauthSubject),
    index("users_client_idx").on(t.clientId),
    index("users_role_idx").on(t.role),
  ],
);

export const storageInquiries = pgTable(
  "storage_inquiries",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull(),
    name: text("name").notNull(),
    company: text("company"),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    product: productCategoryEnum("product").notNull(),
    quantity: integer("quantity").notNull(),
    unit: unitOfMeasureEnum("unit").notNull().default("PALLET"),
    durationMonths: integer("duration_months").notNull(),
    message: text("message"),
    source: varchar("source", { length: 64 }),
    status: inquiryStatusEnum("status").notNull().default("NEW"),
    notes: text("notes"),
    assignedTo: varchar("assigned_to", { length: 32 }).references(() => users.id, {
      onDelete: "set null",
    }),
    clientId: varchar("client_id", { length: 32 }).references(() => clients.id, {
      onDelete: "set null",
    }),
    ipAddressHash: varchar("ip_address_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("storage_inquiries_reference_idx").on(t.reference),
    index("storage_inquiries_status_idx").on(t.status),
    index("storage_inquiries_created_idx").on(t.createdAt),
    index("storage_inquiries_email_idx").on(t.email),
  ],
);

export const storageZones = pgTable(
  "storage_zones",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    code: varchar("code", { length: 16 }).notNull(),
    name: text("name").notNull(),
    kind: zoneKindEnum("kind").notNull(),
    status: storageStatusEnum("status").notNull().default("ACTIVE"),
    /** Null = configurable / not yet agreed with a client. Never invent a figure. */
    targetTemperature: text("target_temperature"),
    temperatureC: integer("temperature_c"),
    humidityPct: integer("humidity_pct"),
    palletCapacity: integer("pallet_capacity"),
    palletsUsed: integer("pallets_used").notNull().default(0),
    monitored: boolean("monitored").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("storage_zones_code_idx").on(t.code), index("storage_zones_kind_idx").on(t.kind)],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    batch: varchar("batch", { length: 24 }).notNull(),
    productName: text("product_name").notNull(),
    product: productCategoryEnum("product").notNull(),
    zoneId: varchar("zone_id", { length: 32 })
      .notNull()
      .references(() => storageZones.id, { onDelete: "restrict" }),
    location: varchar("location", { length: 32 }).notNull(),
    quantity: integer("quantity").notNull(),
    unit: unitOfMeasureEnum("unit").notNull().default("PALLET"),
    status: inventoryStatusEnum("status").notNull().default("IN_STORAGE"),
    temperatureLabel: text("temperature_label"),
    trackingActive: boolean("tracking_active").notNull().default(true),
    clientId: varchar("client_id", { length: 32 }).references(() => clients.id, {
      onDelete: "cascade",
    }),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }).notNull().defaultNow(),
    dispatchAt: timestamp("dispatch_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("inventory_items_batch_idx").on(t.batch),
    index("inventory_items_zone_idx").on(t.zoneId),
    index("inventory_items_client_idx").on(t.clientId),
    index("inventory_items_status_idx").on(t.status),
  ],
);

export const storageContracts = pgTable(
  "storage_contracts",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull(),
    clientId: varchar("client_id", { length: 32 })
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    zoneId: varchar("zone_id", { length: 32 }).references(() => storageZones.id, {
      onDelete: "set null",
    }),
    product: productCategoryEnum("product").notNull(),
    pallets: integer("pallets").notNull(),
    temperatureProfile: text("temperature_profile"),
    status: storageStatusEnum("status").notNull().default("ACTIVE"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    /** Pricing is intentionally null until the client supplies real rules. */
    terms: jsonb("terms"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("storage_contracts_reference_idx").on(t.reference),
    index("storage_contracts_client_idx").on(t.clientId),
    index("storage_contracts_status_idx").on(t.status),
  ],
);

/** A lease binds inventory to a contract for a bounded period. */
export const leases = pgTable(
  "lease",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    contractId: varchar("contract_id", { length: 32 })
      .notNull()
      .references(() => storageContracts.id, { onDelete: "cascade" }),
    inventoryItemId: varchar("inventory_item_id", { length: 32 })
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("lease_contract_idx").on(t.contractId),
    index("lease_item_idx").on(t.inventoryItemId),
  ],
);

export const telemetryLogs = pgTable(
  "telemetry_logs",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    zoneId: varchar("zone_id", { length: 32 })
      .notNull()
      .references(() => storageZones.id, { onDelete: "cascade" }),
    temperatureC: integer("temperature_c").notNull(),
    humidityPct: integer("humidity_pct"),
    /** False while the feed is synthetic. Never present simulated data as live. */
    simulated: boolean("simulated").notNull().default(true),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("telemetry_logs_zone_time_idx").on(t.zoneId, t.recordedAt),
    index("telemetry_logs_recorded_idx").on(t.recordedAt),
  ],
);

export const facilityEvents = pgTable(
  "facility_events",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    zoneId: varchar("zone_id", { length: 32 }).references(() => storageZones.id, {
      onDelete: "set null",
    }),
    type: varchar("type", { length: 48 }).notNull(),
    severity: eventSeverityEnum("severity").notNull().default("INFO"),
    message: text("message").notNull(),
    payload: jsonb("payload"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("facility_events_occurred_idx").on(t.occurredAt),
    index("facility_events_severity_idx").on(t.severity),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    kind: documentKindEnum("kind").notNull(),
    reference: varchar("reference", { length: 32 }).notNull(),
    title: text("title").notNull(),
    url: text("url"),
    mimeType: varchar("mime_type", { length: 96 }),
    sizeBytes: integer("size_bytes"),
    clientId: varchar("client_id", { length: 32 }).references(() => clients.id, {
      onDelete: "cascade",
    }),
    inquiryId: varchar("inquiry_id", { length: 32 }).references(() => storageInquiries.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("documents_client_idx").on(t.clientId),
    index("documents_kind_idx").on(t.kind),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    channel: varchar("channel", { length: 24 }).notNull(),
    recipient: text("recipient").notNull(),
    subject: text("subject"),
    body: text("body"),
    status: varchar("status", { length: 24 }).notNull().default("QUEUED"),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    userId: varchar("user_id", { length: 32 }).references(() => users.id, { onDelete: "cascade" }),
    inquiryId: varchar("inquiry_id", { length: 32 }).references(() => storageInquiries.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (t) => [index("notifications_status_idx").on(t.status)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 32 }).primaryKey(),
    actorId: varchar("actor_id", { length: 32 }),
    actorRole: userRoleEnum("actor_role"),
    action: varchar("action", { length: 64 }).notNull(),
    entity: varchar("entity", { length: 48 }).notNull(),
    entityId: varchar("entity_id", { length: 32 }),
    meta: jsonb("meta"),
    ipAddressHash: varchar("ip_address_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_created_idx").on(t.createdAt),
    index("audit_logs_entity_idx").on(t.entity, t.entityId),
  ],
);

export type Client = typeof clients.$inferSelect;
export type User = typeof users.$inferSelect;
export type StorageInquiry = typeof storageInquiries.$inferSelect;
export type StorageZone = typeof storageZones.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type StorageContract = typeof storageContracts.$inferSelect;
export type Lease = typeof leases.$inferSelect;
export type TelemetryLog = typeof telemetryLogs.$inferSelect;
export type FacilityEvent = typeof facilityEvents.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
