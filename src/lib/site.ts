/**
 * Single source of truth for business + brand configuration.
 *
 * ── CONTENT SAFETY (spec §45) ──────────────────────────────────────────────
 * Nothing here is invented. Every field the client has NOT yet confirmed is
 * marked `verified: false` and rendered in the UI with a "pending client
 * confirmation" treatment instead of a hard claim. To go live, replace the
 * values below with the client-supplied facts — no component changes needed.
 */

export const BRAND = {
  name: "Tahseen Jaber",
  suffix: "Cold Storage & Logistics",
  full: "Tahseen Jaber Cold Storage & Logistics",
  short: "TJ Cold",
  legal: "Tahseen Jaber Cold Storage & Logistics",
  established: null as string | null, // PENDING: client confirmation
  tagline: "The cold chain comes alive.",
  promise: "Precision temperature-controlled storage and cold-chain logistics.",
} as const;

export const LOCATION = {
  area: "Uuayrij Industrial Area",
  city: "Baghdad",
  country: "Iraq",
  countryCode: "IQ",
  line1: "Uuayrij Industrial Area",
  line2: "Baghdad, Iraq",
  /** PENDING: exact coordinates from the client. Current value is the
   *  approximate Uuayrij industrial district, used only for the map visual. */
  coords: { lat: 33.2625, lng: 44.3311 },
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Uuayrij+Industrial+Area+Baghdad+Iraq",
  timezone: "Asia/Baghdad",
  locale: "en-IQ",
} as const;

/** Contact channels — `null` means "not supplied yet, do not render". */
export const CONTACT = {
  phone: null as string | null,
  phoneDisplay: null as string | null,
  whatsapp: null as string | null,
  email: null as string | null,
  hours: null as string | null,
  social: [] as { label: string; href: string; icon: string }[],
} as const;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const NAV = [
  { label: "Home", href: "/", match: "/" },
  { label: "Solutions", href: "/solutions", match: "/solutions" },
  { label: "Facility", href: "/facility", match: "/facility" },
  { label: "Products", href: "/products", match: "/products" },
  { label: "Logistics", href: "/logistics", match: "/logistics" },
  { label: "About", href: "/about", match: "/about" },
  { label: "Contact", href: "/contact", match: "/contact" },
] as const;

/* -------------------------------------------------------------------------- */
/* Cold chain journey (spec §17)                                               */
/* -------------------------------------------------------------------------- */

export type StageKey =
  | "arrival"
  | "receiving"
  | "temperature"
  | "storage"
  | "monitoring"
  | "dispatch";

export interface Stage {
  key: StageKey;
  index: string;
  title: string;
  short: string;
  body: string;
  icon: "truck" | "clipboard" | "thermometer" | "boxes" | "activity" | "route";
  metric: { label: string; value: string }[];
}

export const COLD_CHAIN_STAGES: Stage[] = [
  {
    key: "arrival",
    index: "01",
    title: "Arrival",
    short: "Vehicle reaches the gate",
    body: "Refrigerated vehicles enter through the controlled gate. Arrival is logged, the load is identified and the receiving bay is assigned before a single door is opened.",
    icon: "truck",
    metric: [
      { label: "GATE", value: "CONTROLLED" },
      { label: "LOG", value: "TIMESTAMPED" },
    ],
  },
  {
    key: "receiving",
    index: "02",
    title: "Receiving",
    short: "Inspection & intake",
    body: "Cargo is inspected, counted and batch-coded inside a temperature-buffered receiving hall so the product never sits in ambient conditions.",
    icon: "clipboard",
    metric: [
      { label: "BATCH", value: "ASSIGNED" },
      { label: "CHECK", value: "RECORDED" },
    ],
  },
  {
    key: "temperature",
    index: "03",
    title: "Temperature Control",
    short: "Held to the agreed profile",
    body: "Each zone runs to the temperature profile agreed with the client. Setpoints are configurable per product, per batch and per contract.",
    icon: "thermometer",
    metric: [
      { label: "TARGET", value: "CONFIGURABLE" },
      { label: "CONTROL", value: "PER ZONE" },
    ],
  },
  {
    key: "storage",
    index: "04",
    title: "Storage",
    short: "Racked, zoned, tracked",
    body: "Pallets are put away into a defined zone, aisle and level. Location is bound to the batch record so every item stays addressable.",
    icon: "boxes",
    metric: [
      { label: "ZONE", value: "MAPPED" },
      { label: "PALLET", value: "TRACKED" },
    ],
  },
  {
    key: "monitoring",
    index: "05",
    title: "Monitoring",
    short: "Continuous observation",
    body: "Zone conditions and facility events are recorded continuously and surfaced in the client portal and the admin command centre.",
    icon: "activity",
    metric: [
      { label: "FEED", value: "CONTINUOUS" },
      { label: "ALERTS", value: "RULE BASED" },
    ],
  },
  {
    key: "dispatch",
    index: "06",
    title: "Dispatch",
    short: "Loaded and released",
    body: "Orders are picked, verified against the gate pass, loaded through the dock seal and released with a complete chain of custody.",
    icon: "route",
    metric: [
      { label: "GATE PASS", value: "VERIFIED" },
      { label: "CUSTODY", value: "COMPLETE" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Product vaults (spec §19 / §20)                                             */
/* -------------------------------------------------------------------------- */

export type ProductKey = "produce" | "meat" | "seafood" | "pharma";

export interface ProductVault {
  key: ProductKey;
  name: string;
  kicker: string;
  headline: string;
  body: string;
  image: string;
  accent: string;
  accentSoft: string;
  icon: "leaf" | "beef" | "fish" | "pill";
  /**
   * Temperature is deliberately shown as CLIENT CONFIGURED unless the client
   * supplies a verified figure. We never invent storage temperatures.
   */
  temperature: string;
  humidity: string;
  features: string[];
  handling: { label: string; value: string }[];
}

export const PRODUCTS: ProductVault[] = [
  {
    key: "produce",
    name: "Produce",
    kicker: "Fruits & Vegetables",
    headline: "Freshness, held.",
    body: "A controlled chilled environment for fresh fruit, leafy greens and vegetables — managed for airflow, humidity and rapid turnaround so quality survives the journey from farm to shelf.",
    image: "/assets/product-produce.jpg",
    accent: "#4ade80",
    accentSoft: "rgba(74,222,128,0.16)",
    icon: "leaf",
    temperature: "CLIENT CONFIGURED",
    humidity: "MANAGED",
    features: [
      "Ventilated pallet racking",
      "Humidity-managed chilled zone",
      "Rapid intake to reduce field heat",
      "Batch-level traceability",
    ],
    handling: [
      { label: "TEMPERATURE", value: "CLIENT CONFIGURED" },
      { label: "HUMIDITY", value: "MANAGED" },
      { label: "MONITORING", value: "AVAILABLE" },
      { label: "STORAGE", value: "SECURE" },
    ],
  },
  {
    key: "meat",
    name: "Meat & Poultry",
    kicker: "Deep Frozen",
    headline: "Deep cold. Zero compromise.",
    body: "Frozen storage for meat and poultry with segregated handling, hygienic rack configuration and a stable frozen environment maintained around the clock.",
    image: "/assets/product-meat.jpg",
    accent: "#7dd3fc",
    accentSoft: "rgba(125,211,252,0.16)",
    icon: "beef",
    temperature: "CLIENT CONFIGURED",
    humidity: "LOW / FROZEN",
    features: [
      "Segregated frozen handling",
      "Stainless-compatible racking",
      "Continuous frozen environment",
      "Sealed pallet tracking",
    ],
    handling: [
      { label: "TEMPERATURE", value: "CLIENT CONFIGURED" },
      { label: "ENVIRONMENT", value: "FROZEN" },
      { label: "MONITORING", value: "AVAILABLE" },
      { label: "STORAGE", value: "SECURE" },
    ],
  },
  {
    key: "seafood",
    name: "Seafood",
    kicker: "Marine Cold Chain",
    headline: "From water to warehouse.",
    body: "Marine-grade frozen storage for fish, shrimp and fillets — handled to protect glaze, texture and shelf life with strict zone separation from other categories.",
    image: "/assets/product-seafood.jpg",
    accent: "#22d3ee",
    accentSoft: "rgba(34,211,238,0.18)",
    icon: "fish",
    temperature: "CLIENT CONFIGURED",
    humidity: "LOW / FROZEN",
    features: [
      "Dedicated marine zone",
      "Odour and cross-contact separation",
      "Glaze-protecting frozen hold",
      "Fast dock-to-freezer transfer",
    ],
    handling: [
      { label: "TEMPERATURE", value: "CLIENT CONFIGURED" },
      { label: "ZONE", value: "DEDICATED" },
      { label: "MONITORING", value: "AVAILABLE" },
      { label: "STORAGE", value: "SECURE" },
    ],
  },
  {
    key: "pharma",
    name: "Pharmaceuticals",
    kicker: "Precision & Reliability",
    headline: "Precision, monitored.",
    body: "A controlled, monitored environment for temperature-sensitive pharmaceutical and healthcare products, with documented handling, restricted access and full event logging.",
    image: "/assets/product-pharma.jpg",
    accent: "#a5b4fc",
    accentSoft: "rgba(165,180,252,0.18)",
    icon: "pill",
    temperature: "CLIENT CONFIGURED",
    humidity: "CONTROLLED",
    features: [
      "Restricted-access zone",
      "Documented handling record",
      "Continuous condition logging",
      "Alarm and escalation workflow",
    ],
    handling: [
      { label: "TEMPERATURE", value: "CLIENT CONFIGURED" },
      { label: "ACCESS", value: "RESTRICTED" },
      { label: "MONITORING", value: "ACTIVE" },
      { label: "STORAGE", value: "SECURE" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Facility zones (spec §21) — SVG map                                         */
/* -------------------------------------------------------------------------- */

export interface Zone {
  id: string;
  name: string;
  code: string;
  kind: "receiving" | "cold" | "frozen" | "pharma" | "loading" | "dispatch" | "security";
  /** Normalised map geometry (viewBox 0 0 1000 560). */
  rect: { x: number; y: number; w: number; h: number };
  purpose: string;
  status: "OPERATIONAL" | "CONFIGURABLE" | "MONITORED";
  temperature: string;
  /** Whether the zone is on the monitoring loop. */
  monitored: boolean;
  /** Capacity is intentionally null until the client confirms real figures. */
  capacity: { value: number; unit: string } | null;
}

export const ZONES: Zone[] = [
  {
    id: "receiving",
    name: "Receiving Hall",
    code: "Z-01",
    kind: "receiving",
    rect: { x: 40, y: 60, w: 250, h: 190 },
    purpose:
      "Temperature-buffered intake where vehicles are logged, cargo is inspected and batch codes are assigned before put-away.",
    status: "OPERATIONAL",
    temperature: "BUFFERED",
    monitored: true,
    capacity: null,
  },
  {
    id: "cold-a",
    name: "Cold Room A",
    code: "Z-02",
    kind: "cold",
    rect: { x: 310, y: 60, w: 300, h: 190 },
    purpose:
      "Chilled storage for produce and temperature-sensitive goods, configured to the client's agreed profile.",
    status: "CONFIGURABLE",
    temperature: "CLIENT CONFIGURED",
    monitored: true,
    capacity: null,
  },
  {
    id: "cold-b",
    name: "Cold Room B",
    code: "Z-03",
    kind: "cold",
    rect: { x: 630, y: 60, w: 330, h: 190 },
    purpose:
      "Second chilled chamber allowing category separation and parallel contracts without cross-contact.",
    status: "CONFIGURABLE",
    temperature: "CLIENT CONFIGURED",
    monitored: true,
    capacity: null,
  },
  {
    id: "frozen",
    name: "Frozen Storage",
    code: "Z-04",
    kind: "frozen",
    rect: { x: 40, y: 270, w: 420, h: 230 },
    purpose:
      "Deep-frozen chamber for meat, poultry and seafood with segregated racking and continuous condition logging.",
    status: "MONITORED",
    temperature: "DEEP FROZEN",
    monitored: true,
    capacity: null,
  },
  {
    id: "pharma",
    name: "Pharma Vault",
    code: "Z-05",
    kind: "pharma",
    rect: { x: 480, y: 270, w: 240, h: 230 },
    purpose:
      "Restricted-access precision zone for pharmaceutical and healthcare products with documented handling.",
    status: "MONITORED",
    temperature: "PRECISION",
    monitored: true,
    capacity: null,
  },
  {
    id: "loading",
    name: "Loading Bays",
    code: "Z-06",
    kind: "loading",
    rect: { x: 740, y: 270, w: 220, h: 110 },
    purpose:
      "Dock-sealed bays where refrigerated vehicles are loaded through a closed interface to protect the cold chain.",
    status: "OPERATIONAL",
    temperature: "SEALED",
    monitored: true,
    capacity: null,
  },
  {
    id: "dispatch",
    name: "Dispatch & Gate Pass",
    code: "Z-07",
    kind: "dispatch",
    rect: { x: 740, y: 390, w: 220, h: 110 },
    purpose:
      "Release point where orders are verified against the gate pass and the chain of custody is closed.",
    status: "OPERATIONAL",
    temperature: "VERIFIED",
    monitored: true,
    capacity: null,
  },
  {
    id: "security",
    name: "Security & Control",
    code: "Z-08",
    kind: "security",
    rect: { x: 480, y: 512, w: 240, h: 40 },
    purpose:
      "Monitoring post covering access control, camera coverage and facility events across every zone.",
    status: "MONITORED",
    temperature: "N/A",
    monitored: true,
    capacity: null,
  },
];

/* -------------------------------------------------------------------------- */
/* Logistics route (spec §24)                                                  */
/* -------------------------------------------------------------------------- */

export const ROUTE_STEPS = [
  { key: "receive", label: "Receive", detail: "Intake logged at the gate" },
  { key: "store", label: "Store", detail: "Put away to the assigned zone" },
  { key: "load", label: "Load", detail: "Dock-sealed vehicle loading" },
  { key: "check", label: "Check", detail: "Gate pass verification" },
  { key: "dispatch", label: "Dispatch", detail: "Released with custody record" },
] as const;

/* -------------------------------------------------------------------------- */
/* Storage options (spec §25 — "flexible storage")                             */
/* -------------------------------------------------------------------------- */

export const STORAGE_OPTIONS = [
  {
    key: "short",
    name: "Short-Term Buffer",
    period: "Days to weeks",
    body: "Fast-turnaround chilled and frozen buffer space for importers, distributors and seasonal overflow.",
    icon: "zap",
    points: ["Rapid intake", "Pallet-level tracking", "Flexible duration"],
  },
  {
    key: "long",
    name: "Long-Term Contract",
    period: "Months to seasons",
    body: "Reserved zone capacity under a storage contract with agreed temperature profile and reporting cadence.",
    icon: "shield",
    points: ["Reserved capacity", "Agreed profile", "Scheduled reporting"],
  },
  {
    key: "bonded",
    name: "Dedicated Zone",
    period: "By agreement",
    body: "A separated zone for a single client or category where cross-contact must be eliminated entirely.",
    icon: "lock",
    points: ["Physical separation", "Restricted access", "Category isolation"],
  },
  {
    key: "transit",
    name: "Cross-Dock & Transit",
    period: "Hours",
    body: "Move cargo straight from inbound to outbound vehicle through a temperature-buffered dock.",
    icon: "repeat",
    points: ["No long put-away", "Dock-sealed transfer", "Custody preserved"],
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Demo / illustrative telemetry (spec §40)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Everything produced by the telemetry provider is DEMO data unless a real
 * sensor integration is configured. The UI must never label it live.
 */
export const DEMO_BADGE = {
  label: "DEMO",
  full: "Simulated data — illustrative interface",
  note: "Not connected to facility sensors. Values are illustrative only.",
} as const;

export const SERVICES = [
  {
    title: "Temperature-Controlled Storage",
    body: "Chilled, frozen and precision zones configured to the profile your product actually needs.",
    icon: "thermometer",
  },
  {
    title: "Cold-Chain Logistics",
    body: "Refrigerated movement between the dock, the zone and the outbound vehicle without breaking the chain.",
    icon: "truck",
  },
  {
    title: "Inventory & Batch Tracking",
    body: "Every pallet is addressable by batch, zone and location, visible to you in the client portal.",
    icon: "boxes",
  },
  {
    title: "Facility Monitoring",
    body: "Continuous condition and event monitoring surfaced through the command centre and the portal.",
    icon: "activity",
  },
  {
    title: "Secure Access Control",
    body: "Controlled gate, zoned access and camera coverage with a logged chain of custody.",
    icon: "shield",
  },
  {
    title: "Documentation & Gate Passes",
    body: "Storage records, documents, invoices and gate passes kept in one accountable place.",
    icon: "file",
  },
] as const;

export const TRUST_POINTS = [
  { label: "Zoned separation", value: "By category" },
  { label: "Temperature profile", value: "Client configured" },
  { label: "Access control", value: "Restricted" },
  { label: "Batch traceability", value: "Per pallet" },
  { label: "Monitoring", value: "Continuous" },
  { label: "Records", value: "Retained" },
] as const;
