/**
 * Shared typed contracts (spec §02 — "typed API contracts").
 * Server and client both import from here; the database is never exposed.
 */

export type UserRole = "ADMIN" | "OPERATOR" | "CLIENT";

export type InquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "QUOTED"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED";

export type ProductCategory = "PRODUCE" | "MEAT" | "SEAFOOD" | "PHARMA" | "OTHER";

export type UnitOfMeasure = "PALLET" | "TONNE" | "KG" | "CARTON" | "UNIT";

export type InventoryStatus =
  | "RECEIVED"
  | "IN_STORAGE"
  | "RESERVED"
  | "IN_TRANSIT"
  | "DISPATCHED"
  | "QUARANTINE";

export type StorageStatus = "ACTIVE" | "SUSPENDED" | "COMPLETED" | "CANCELLED";

export type ZoneKind =
  | "RECEIVING"
  | "COLD"
  | "FROZEN"
  | "PHARMA"
  | "LOADING"
  | "DISPATCH"
  | "SECURITY";

export type DocumentKind =
  | "CONTRACT"
  | "INVOICE"
  | "GATE_PASS"
  | "CERTIFICATE"
  | "RECEIPT"
  | "OTHER";

export type EventSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface InquiryPayload {
  name: string;
  company?: string | null;
  email: string;
  phone: string;
  product: ProductCategory;
  quantity: number;
  unit: UnitOfMeasure;
  durationMonths: number;
  message?: string | null;
  source?: string | null;
  /** Honeypot field — must stay empty. Present = bot. */
  website?: string | null;
}

export interface InquiryResult {
  ok: true;
  reference: string;
  id: string;
  receivedAt: string;
  status: InquiryStatus;
}

export interface ApiError {
  ok: false;
  error: string;
  code: "VALIDATION" | "RATE_LIMITED" | "UNAUTHORIZED" | "FORBIDDEN" | "SERVER" | "NOT_FOUND";
  fields?: Record<string, string>;
}

export type ApiResponse<T> = T | ApiError;

/** Public-safe view of an inquiry (never leaks internal columns). */
export interface InquiryView {
  id: string;
  reference: string;
  name: string;
  company: string | null;
  email: string;
  phone: string;
  product: ProductCategory;
  quantity: number;
  unit: UnitOfMeasure;
  durationMonths: number;
  message: string | null;
  status: InquiryStatus;
  notes: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryView {
  id: string;
  batch: string;
  product: ProductCategory;
  productName: string;
  zone: string;
  location: string;
  quantity: number;
  unit: UnitOfMeasure;
  status: InventoryStatus;
  temperature: string;
  tracking: "ACTIVE" | "PAUSED";
  arrivedAt: string;
  dispatchAt: string | null;
  clientId?: string | null;
}

export interface ZoneView {
  id: string;
  name: string;
  code: string;
  kind: ZoneKind;
  status: StorageStatus;
  temperature: number | null;
  humidity: number | null;
  occupancyPct: number;
  monitored: boolean;
}

export interface TelemetrySample {
  at: string;
  zone: string;
  temperature: number;
  humidity: number;
  /** Always true while the feed is synthetic. */
  simulated: boolean;
}

export interface FacilityEventView {
  id: string;
  at: string;
  zone: string;
  type: string;
  severity: EventSeverity;
  message: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  clientId: string | null;
  image: string | null;
}

export interface AuthResult {
  ok: true;
  user: SessionUser;
  redirectTo: string;
}

export interface AuthFailure {
  ok: false;
  error: string;
  code: "VALIDATION" | "INVALID_CREDENTIALS" | "CONFLICT" | "RATE_LIMITED" | "SERVER";
  fields?: Record<string, string>;
}

export type AuthResponse = AuthResult | AuthFailure;
