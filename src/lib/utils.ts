import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware class merge. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** True when the visitor has asked the OS to reduce motion. */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True on coarse-pointer / touch devices (custom cursor + parallax are off there). */
export function isTouchDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/** Clamp a number into a range. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Map a value from one range to another. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
) {
  if (inMax === inMin) return outMin;
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Human-safe reference id, e.g. `TJ-7K4Q2`.
 * Ambiguous characters (I, O, 0, 1) are excluded so it can be read over the phone.
 */
export function makeReferenceId(prefix = "TJ", length = 5) {
  const bytes = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += REF_ALPHABET[bytes[i]! % REF_ALPHABET.length];
  }
  return `${prefix}-${out}`;
}

/** Batch code used by inventory records, e.g. `TJ-20481`. */
export function makeBatchCode(seq: number) {
  return `TJ-${String(20000 + seq).padStart(5, "0")}`;
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatTemperature(value: number | null, digits = 1) {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(digits)}°C`;
}

export function formatDate(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function relativeTime(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (Number.isNaN(mins)) return "—";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

/** Sanitise free text coming out of a form before it is rendered or stored. */
export function cleanText(input: string, max = 4000) {
  return input.replace(/\u0000/g, "").trim().slice(0, max);
}

/**
 * Deterministic pseudo-random in [0,1) from a string seed.
 * Used so "random" visual scatter is stable across renders (no hydration drift).
 */
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Status → colour token map used across HUD surfaces. */
export const STATUS_TONE: Record<string, "cool" | "ice" | "amber" | "danger" | "silver"> = {
  NEW: "ice",
  CONTACTED: "ice",
  QUOTED: "amber",
  APPROVED: "cool",
  REJECTED: "danger",
  COMPLETED: "silver",
  IN_STORAGE: "ice",
  IN_TRANSIT: "amber",
  RECEIVED: "cool",
  DISPATCHED: "silver",
  RESERVED: "amber",
  QUARANTINE: "danger",
  STABLE: "cool",
  ACTIVE: "cool",
  ONLINE: "cool",
  SECURED: "cool",
  WARNING: "amber",
  ALERT: "danger",
  OFFLINE: "danger",
};
