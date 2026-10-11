import "server-only";

import bcrypt from "bcryptjs";

import { serverEnv } from "@/lib/env";
import { makeBatchCode, makeReferenceId } from "@/lib/utils";
import { newId } from "./file-store";

/**
 * Demo seed — builds a believable, clearly-simulated operational dataset.
 *
 * Every temperature, occupancy and telemetry value here is ILLUSTRATIVE
 * (spec §40). The UI renders them behind a DEMO badge and the telemetry rows
 * are written with `simulated = true` so nothing is ever presented as live
 * facility data.
 */

const HOUR = 3_600_000;

interface SeedZone {
  id: string;
  code: string;
  name: string;
  kind: string;
  target: string;
  temp: number | null;
  humidity: number;
  capacity: number;
  used: number;
  monitored: boolean;
}

const ZONES: SeedZone[] = [
  { id: "zone_receiving", code: "Z-01", name: "Receiving Hall", kind: "RECEIVING", target: "BUFFERED", temp: 8, humidity: 58, capacity: 0, used: 0, monitored: true },
  { id: "zone_cold_a", code: "Z-02", name: "Cold Room A", kind: "COLD", target: "CLIENT CONFIGURED", temp: 2, humidity: 88, capacity: 420, used: 268, monitored: true },
  { id: "zone_cold_b", code: "Z-03", name: "Cold Room B", kind: "COLD", target: "CLIENT CONFIGURED", temp: 4, humidity: 84, capacity: 380, used: 191, monitored: true },
  { id: "zone_frozen", code: "Z-04", name: "Frozen Storage", kind: "FROZEN", target: "DEEP FROZEN", temp: -18, humidity: 72, capacity: 900, used: 663, monitored: true },
  { id: "zone_pharma", code: "Z-05", name: "Pharma Vault", kind: "PHARMA", target: "PRECISION", temp: 5, humidity: 46, capacity: 140, used: 61, monitored: true },
  { id: "zone_loading", code: "Z-06", name: "Loading Bays", kind: "LOADING", target: "SEALED", temp: 6, humidity: 54, capacity: 0, used: 0, monitored: true },
  { id: "zone_dispatch", code: "Z-07", name: "Dispatch & Gate Pass", kind: "DISPATCH", target: "VERIFIED", temp: 10, humidity: 50, capacity: 0, used: 0, monitored: true },
  { id: "zone_security", code: "Z-08", name: "Security & Control", kind: "SECURITY", target: "N/A", temp: null, humidity: 0, capacity: 0, used: 0, monitored: true },
];

const CLIENTS = [
  {
    id: "cli_aldiyar",
    code: "CL-0001",
    name: "Al-Diyar Food Import",
    contactName: "Operations Desk",
    email: "ops@aldiyar-food.example",
    phone: null,
  },
  {
    id: "cli_shatt",
    code: "CL-0002",
    name: "Shatt Al-Arab Seafood",
    contactName: "Cold Chain Manager",
    email: "coldchain@shatt-seafood.example",
    phone: null,
  },
  {
    id: "cli_zagros",
    code: "CL-0003",
    name: "Zagros Poultry Co.",
    contactName: "Logistics Lead",
    email: "logistics@zagros-poultry.example",
    phone: null,
  },
  {
    id: "cli_rasheed",
    code: "CL-0004",
    name: "Rasheed Pharma Distribution",
    contactName: "Quality Assurance",
    email: "qa@rasheed-pharma.example",
    phone: null,
  },
];

interface SeedItem {
  batch: string;
  productName: string;
  product: string;
  zoneId: string;
  location: string;
  quantity: number;
  unit: string;
  status: string;
  temperatureLabel: string;
  clientId: string;
  arrivedHoursAgo: number;
}

const INVENTORY: SeedItem[] = [
  { batch: makeBatchCode(481), productName: "Frozen Whole Shrimp 20/30", product: "SEAFOOD", zoneId: "zone_frozen", location: "C-04-A-12", quantity: 24, unit: "PALLET", status: "IN_STORAGE", temperatureLabel: "DEEP FROZEN", clientId: "cli_shatt", arrivedHoursAgo: 34 },
  { batch: makeBatchCode(482), productName: "Atlantic Salmon Fillet", product: "SEAFOOD", zoneId: "zone_frozen", location: "C-04-B-03", quantity: 18, unit: "PALLET", status: "IN_STORAGE", temperatureLabel: "DEEP FROZEN", clientId: "cli_shatt", arrivedHoursAgo: 51 },
  { batch: makeBatchCode(483), productName: "Whole Frozen Chicken 1.2kg", product: "MEAT", zoneId: "zone_frozen", location: "C-04-A-27", quantity: 32, unit: "PALLET", status: "IN_STORAGE", temperatureLabel: "DEEP FROZEN", clientId: "cli_zagros", arrivedHoursAgo: 12 },
  { batch: makeBatchCode(484), productName: "Boneless Beef Forequarter", product: "MEAT", zoneId: "zone_frozen", location: "C-04-C-08", quantity: 14, unit: "PALLET", status: "RESERVED", temperatureLabel: "DEEP FROZEN", clientId: "cli_zagros", arrivedHoursAgo: 96 },
  { batch: makeBatchCode(485), productName: "Ripe Tomatoes — Grade A", product: "PRODUCE", zoneId: "zone_cold_a", location: "A-02-A-05", quantity: 16, unit: "PALLET", status: "IN_STORAGE", temperatureLabel: "CLIENT CONFIGURED", clientId: "cli_aldiyar", arrivedHoursAgo: 8 },
  { batch: makeBatchCode(486), productName: "Oak Lettuce — Crate", product: "PRODUCE", zoneId: "zone_cold_a", location: "A-02-B-11", quantity: 22, unit: "PALLET", status: "IN_STORAGE", temperatureLabel: "CLIENT CONFIGURED", clientId: "cli_aldiyar", arrivedHoursAgo: 20 },
  { batch: makeBatchCode(487), productName: "Citrus Assortment", product: "PRODUCE", zoneId: "zone_cold_b", location: "B-03-A-02", quantity: 28, unit: "PALLET", status: "IN_STORAGE", temperatureLabel: "CLIENT CONFIGURED", clientId: "cli_aldiyar", arrivedHoursAgo: 63 },
  { batch: makeBatchCode(488), productName: "Vaccine Carrier Cartons", product: "PHARMA", zoneId: "zone_pharma", location: "P-05-R2-04", quantity: 9, unit: "CARTON", status: "IN_STORAGE", temperatureLabel: "PRECISION", clientId: "cli_rasheed", arrivedHoursAgo: 27 },
  { batch: makeBatchCode(489), productName: "Biologics Palletised", product: "PHARMA", zoneId: "zone_pharma", location: "P-05-R1-09", quantity: 6, unit: "PALLET", status: "IN_STORAGE", temperatureLabel: "PRECISION", clientId: "cli_rasheed", arrivedHoursAgo: 44 },
  { batch: makeBatchCode(490), productName: "Frozen Sardine Blocks", product: "SEAFOOD", zoneId: "zone_frozen", location: "C-04-D-15", quantity: 20, unit: "PALLET", status: "IN_TRANSIT", temperatureLabel: "DEEP FROZEN", clientId: "cli_shatt", arrivedHoursAgo: 5 },
  { batch: makeBatchCode(491), productName: "Stone Fruit — Mixed", product: "PRODUCE", zoneId: "zone_cold_a", location: "A-02-C-01", quantity: 12, unit: "PALLET", status: "RECEIVED", temperatureLabel: "CLIENT CONFIGURED", clientId: "cli_aldiyar", arrivedHoursAgo: 2 },
  { batch: makeBatchCode(492), productName: "Poultry Portions — IQF", product: "MEAT", zoneId: "zone_frozen", location: "C-04-B-19", quantity: 26, unit: "PALLET", status: "DISPATCHED", temperatureLabel: "DEEP FROZEN", clientId: "cli_zagros", arrivedHoursAgo: 140 },
];

const EVENT_TEMPLATES: { type: string; severity: string; message: string; zoneId: string }[] = [
  { type: "DOCK_OPEN", severity: "INFO", message: "Loading bay 2 dock seal engaged for outbound vehicle.", zoneId: "zone_loading" },
  { type: "TEMP_HOLD", severity: "INFO", message: "Zone held within the configured profile.", zoneId: "zone_frozen" },
  { type: "ACCESS_GRANTED", severity: "INFO", message: "Authorised operator badge accepted at Pharma Vault.", zoneId: "zone_pharma" },
  { type: "BATCH_PUTAWAY", severity: "INFO", message: "Batch put away to racking; location bound to record.", zoneId: "zone_cold_a" },
  { type: "DOOR_AJAR", severity: "WARNING", message: "Cold Room B door held open beyond the configured threshold.", zoneId: "zone_cold_b" },
  { type: "DEVIATION", severity: "WARNING", message: "Temperature deviation detected during the defrost cycle.", zoneId: "zone_cold_a" },
  { type: "GATE_PASS_ISSUED", severity: "INFO", message: "Gate pass issued and verified against the manifest.", zoneId: "zone_dispatch" },
  { type: "COMPRESSOR_CYCLE", severity: "INFO", message: "Refrigeration compressor completed a normal cycle.", zoneId: "zone_frozen" },
  { type: "CAMERA_RESTORED", severity: "WARNING", message: "Camera feed restored after a brief interruption.", zoneId: "zone_security" },
  { type: "ACCESS_DENIED", severity: "CRITICAL", message: "Badge rejected at a restricted zone boundary.", zoneId: "zone_pharma" },
];

function iso(hoursAgo: number, base = Date.now()) {
  return new Date(base - hoursAgo * HOUR).toISOString();
}

export async function buildSeed() {
  const now = Date.now();

  const adminEmail = serverEnv.seed.adminEmail ?? "admin@tahseenjaber.iq";
  const adminPassword = serverEnv.seed.adminPassword ?? "ColdChain!2026";
  const operatorPassword = "Operator!2026";
  const clientPassword = "Client!2026";

  const [adminHash, operatorHash, clientHash] = await Promise.all([
    bcrypt.hash(adminPassword, 10),
    bcrypt.hash(operatorPassword, 10),
    bcrypt.hash(clientPassword, 10),
  ]);

  const users = [
    {
      id: "usr_admin",
      email: adminEmail,
      passwordHash: adminHash,
      name: "Facility Administrator",
      role: "ADMIN",
      clientId: null,
      image: null,
      oauthProvider: null,
      oauthSubject: null,
      emailVerified: true,
      lastLoginAt: iso(3, now),
      createdAt: iso(24 * 120, now),
      updatedAt: iso(3, now),
    },
    {
      id: "usr_operator",
      email: "operator@tahseenjaber.iq",
      passwordHash: operatorHash,
      name: "Shift Operator",
      role: "OPERATOR",
      clientId: null,
      image: null,
      oauthProvider: null,
      oauthSubject: null,
      emailVerified: true,
      lastLoginAt: iso(9, now),
      createdAt: iso(24 * 90, now),
      updatedAt: iso(9, now),
    },
    {
      id: "usr_client_shatt",
      email: "client@shatt-seafood.example",
      passwordHash: clientHash,
      name: "Shatt Al-Arab Seafood",
      role: "CLIENT",
      clientId: "cli_shatt",
      image: null,
      oauthProvider: null,
      oauthSubject: null,
      emailVerified: true,
      lastLoginAt: iso(26, now),
      createdAt: iso(24 * 60, now),
      updatedAt: iso(26, now),
    },
    {
      id: "usr_client_aldiyar",
      email: "client@aldiyar-food.example",
      passwordHash: clientHash,
      name: "Al-Diyar Food Import",
      role: "CLIENT",
      clientId: "cli_aldiyar",
      image: null,
      oauthProvider: null,
      oauthSubject: null,
      emailVerified: true,
      lastLoginAt: iso(50, now),
      createdAt: iso(24 * 45, now),
      updatedAt: iso(50, now),
    },
  ];

  const clients = CLIENTS.map((c) => ({
    ...c,
    address: "Baghdad, Iraq",
    taxNumber: null,
    notes: "Demo client record — replace with verified account data.",
    status: "ACTIVE",
    createdAt: iso(24 * 120, now),
    updatedAt: iso(24 * 3, now),
  }));

  const zones = ZONES.map((z) => ({
    id: z.id,
    code: z.code,
    name: z.name,
    kind: z.kind,
    status: "ACTIVE",
    targetTemperature: z.target,
    temperatureC: z.temp,
    humidityPct: z.humidity,
    palletCapacity: z.capacity,
    palletsUsed: z.used,
    monitored: z.monitored,
    createdAt: iso(24 * 120, now),
    updatedAt: iso(1, now),
  }));

  const inventory = INVENTORY.map((i) => ({
    id: newId("inv_"),
    batch: i.batch,
    productName: i.productName,
    product: i.product,
    zoneId: i.zoneId,
    location: i.location,
    quantity: i.quantity,
    unit: i.unit,
    status: i.status,
    temperatureLabel: i.temperatureLabel,
    trackingActive: i.status !== "DISPATCHED",
    clientId: i.clientId,
    arrivedAt: iso(i.arrivedHoursAgo, now),
    dispatchAt: i.status === "DISPATCHED" ? iso(i.arrivedHoursAgo - 4, now) : null,
    createdAt: iso(i.arrivedHoursAgo, now),
    updatedAt: iso(Math.max(0, i.arrivedHoursAgo - 1), now),
  }));

  const contracts = [
    {
      id: newId("ctr_"),
      reference: makeReferenceId("SC"),
      clientId: "cli_shatt",
      zoneId: "zone_frozen",
      product: "SEAFOOD",
      pallets: 62,
      temperatureProfile: "DEEP FROZEN — CLIENT CONFIGURED",
      status: "ACTIVE",
      startsAt: iso(24 * 70, now),
      endsAt: iso(-24 * 90, now),
      terms: null,
      createdAt: iso(24 * 70, now),
      updatedAt: iso(24 * 4, now),
    },
    {
      id: newId("ctr_"),
      reference: makeReferenceId("SC"),
      clientId: "cli_zagros",
      zoneId: "zone_frozen",
      product: "MEAT",
      pallets: 72,
      temperatureProfile: "DEEP FROZEN — CLIENT CONFIGURED",
      status: "ACTIVE",
      startsAt: iso(24 * 40, now),
      endsAt: iso(-24 * 140, now),
      terms: null,
      createdAt: iso(24 * 40, now),
      updatedAt: iso(24 * 2, now),
    },
    {
      id: newId("ctr_"),
      reference: makeReferenceId("SC"),
      clientId: "cli_aldiyar",
      zoneId: "zone_cold_a",
      product: "PRODUCE",
      pallets: 44,
      temperatureProfile: "CHILLED — CLIENT CONFIGURED",
      status: "ACTIVE",
      startsAt: iso(24 * 21, now),
      endsAt: iso(-24 * 60, now),
      terms: null,
      createdAt: iso(24 * 21, now),
      updatedAt: iso(24 * 1, now),
    },
    {
      id: newId("ctr_"),
      reference: makeReferenceId("SC"),
      clientId: "cli_rasheed",
      zoneId: "zone_pharma",
      product: "PHARMA",
      pallets: 15,
      temperatureProfile: "PRECISION — CLIENT CONFIGURED",
      status: "ACTIVE",
      startsAt: iso(24 * 12, now),
      endsAt: iso(-24 * 180, now),
      terms: null,
      createdAt: iso(24 * 12, now),
      updatedAt: iso(12, now),
    },
    {
      id: newId("ctr_"),
      reference: makeReferenceId("SC"),
      clientId: "cli_aldiyar",
      zoneId: "zone_cold_b",
      product: "PRODUCE",
      pallets: 30,
      temperatureProfile: "CHILLED — CLIENT CONFIGURED",
      status: "COMPLETED",
      startsAt: iso(24 * 150, now),
      endsAt: iso(24 * 60, now),
      terms: null,
      createdAt: iso(24 * 150, now),
      updatedAt: iso(24 * 60, now),
    },
  ];

  const documents = [
    { id: newId("doc_"), kind: "CONTRACT", reference: "SC-0001", title: "Frozen storage contract — Shatt Al-Arab Seafood", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_shatt", inquiryId: null, createdAt: iso(24 * 70, now) },
    { id: newId("doc_"), kind: "GATE_PASS", reference: "GP-4471", title: "Gate pass — outbound frozen load", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_shatt", inquiryId: null, createdAt: iso(5, now) },
    { id: newId("doc_"), kind: "INVOICE", reference: "INV-0231", title: "Storage invoice — current period", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_shatt", inquiryId: null, createdAt: iso(24 * 6, now) },
    { id: newId("doc_"), kind: "RECEIPT", reference: "RC-1188", title: "Receiving receipt — batch intake", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_aldiyar", inquiryId: null, createdAt: iso(2, now) },
    { id: newId("doc_"), kind: "CERTIFICATE", reference: "TZ-0092", title: "Zone condition record — Cold Room A", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_aldiyar", inquiryId: null, createdAt: iso(24 * 2, now) },
    { id: newId("doc_"), kind: "CONTRACT", reference: "SC-0003", title: "Chilled storage contract — Al-Diyar Food Import", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_aldiyar", inquiryId: null, createdAt: iso(24 * 21, now) },
    { id: newId("doc_"), kind: "INVOICE", reference: "INV-0228", title: "Storage invoice — previous period", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_zagros", inquiryId: null, createdAt: iso(24 * 33, now) },
    { id: newId("doc_"), kind: "GATE_PASS", reference: "GP-4462", title: "Gate pass — poultry dispatch", url: null, mimeType: "application/pdf", sizeBytes: null, clientId: "cli_zagros", inquiryId: null, createdAt: iso(24 * 5, now) },
  ];

  // Spread facility events across the last 30 hours.
  const events = Array.from({ length: 26 }, (_, i) => {
    const tpl = EVENT_TEMPLATES[(i * 3) % EVENT_TEMPLATES.length]!;
    return {
      id: newId("evt_"),
      zoneId: tpl.zoneId,
      type: tpl.type,
      severity: tpl.severity,
      message: tpl.message,
      payload: { simulated: true },
      occurredAt: iso((i * 1.15) % 30, now),
    };
  });

  // 48 telemetry points per monitored zone across the last 24 hours.
  const telemetry: any[] = [];
  for (const z of ZONES) {
    if (z.temp === null) continue;
    for (let i = 47; i >= 0; i--) {
      const drift = Math.sin(i / 3.4 + z.code.charCodeAt(3)) * 0.6 + Math.cos(i / 7.1) * 0.35;
      telemetry.push({
        id: newId("tel_"),
        zoneId: z.id,
        temperatureC: Math.round((z.temp + drift) * 10) / 10,
        humidityPct: Math.round(z.humidity + Math.sin(i / 5.2) * 2.4),
        simulated: true,
        recordedAt: iso((i * 0.5) + 0.1, now),
      });
    }
  }

  // Historic inquiries so the command centre and analytics are populated.
  const inquirySeeds = [
    { name: "Hussein Al-Bayati", company: "Tigris Fresh Market", product: "PRODUCE", quantity: 40, unit: "PALLET", durationMonths: 3, status: "NEW", hoursAgo: 2 },
    { name: "Sara Mahmoud", company: "Basra Marine Exports", product: "SEAFOOD", quantity: 25, unit: "PALLET", durationMonths: 6, status: "CONTACTED", hoursAgo: 9 },
    { name: "Ali Kareem", company: "Zagros Poultry Co.", product: "MEAT", quantity: 60, unit: "PALLET", durationMonths: 12, status: "QUOTED", hoursAgo: 28 },
    { name: "Dr. Layla Haddad", company: "Rasheed Pharma Distribution", product: "PHARMA", quantity: 12, unit: "PALLET", durationMonths: 9, status: "APPROVED", hoursAgo: 52 },
    { name: "Omar Jasim", company: "Nineveh Agro Trading", product: "PRODUCE", quantity: 18, unit: "TONNE", durationMonths: 2, status: "NEW", hoursAgo: 74 },
    { name: "Fatima Nouri", company: "Euphrates Cold Logistics", product: "OTHER", quantity: 33, unit: "PALLET", durationMonths: 4, status: "COMPLETED", hoursAgo: 120 },
    { name: "Mustafa Ridha", company: "Karbala Dairy Supply", product: "OTHER", quantity: 21, unit: "PALLET", durationMonths: 5, status: "REJECTED", hoursAgo: 168 },
    { name: "Zainab Abbas", company: "Mosul Frozen Foods", product: "MEAT", quantity: 45, unit: "PALLET", durationMonths: 8, status: "APPROVED", hoursAgo: 210 },
    { name: "Karim Salih", company: "Babylon Produce Co.", product: "PRODUCE", quantity: 30, unit: "PALLET", durationMonths: 3, status: "QUOTED", hoursAgo: 260 },
    { name: "Nadia Faisal", company: "Shatt Al-Arab Seafood", product: "SEAFOOD", quantity: 52, unit: "PALLET", durationMonths: 12, status: "COMPLETED", hoursAgo: 320 },
  ];

  const storageInquiries = inquirySeeds.map((s, i) => ({
    id: newId("inq_"),
    reference: makeReferenceId("TJ"),
    name: s.name,
    company: s.company,
    email: `${s.name.split(" ")[0]!.toLowerCase()}@${s.company.split(" ")[0]!.toLowerCase().replace(/[^a-z]/g, "")}.example`,
    phone: "+964 7xx xxx xxxx",
    product: s.product,
    quantity: s.quantity,
    unit: s.unit,
    durationMonths: s.durationMonths,
    message: "Requesting temperature-controlled storage for the stated volume and duration.",
    source: i % 3 === 0 ? "calculator" : "contact-form",
    status: s.status,
    notes: null,
    assignedTo: i % 2 === 0 ? "usr_operator" : null,
    clientId: null,
    ipAddressHash: null,
    createdAt: iso(s.hoursAgo, now),
    updatedAt: iso(Math.max(0, s.hoursAgo - 2), now),
  }));

  const audit = [
    { id: newId("aud_"), actorId: "usr_admin", actorRole: "ADMIN", action: "seed.bootstrap", entity: "system", entityId: null, meta: { simulated: true }, ipAddressHash: null, createdAt: iso(0.2, now) },
    { id: newId("aud_"), actorId: "usr_operator", actorRole: "OPERATOR", action: "inquiry.status.update", entity: "storage_inquiries", entityId: storageInquiries[2]?.id ?? null, meta: { to: "QUOTED" }, ipAddressHash: null, createdAt: iso(6, now) },
    { id: newId("aud_"), actorId: "usr_admin", actorRole: "ADMIN", action: "zone.review", entity: "storage_zones", entityId: "zone_frozen", meta: {}, ipAddressHash: null, createdAt: iso(18, now) },
  ];

  return { users, clients, zones, inventory, contracts, documents, events, telemetry, audit, storageInquiries };
}

export { DEMO_CREDENTIALS } from "@/lib/auth/demo-credentials";
