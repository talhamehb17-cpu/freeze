import { z } from "zod";

/**
 * Zod schemas — the single validation contract for every input surface
 * (spec §26, §38). Used by both the client forms (react-hook-form) and the
 * server actions / route handlers, so nothing can be validated on one side only.
 */

export const PRODUCT_CATEGORIES = ["PRODUCE", "MEAT", "SEAFOOD", "PHARMA", "OTHER"] as const;
export const UNITS = ["PALLET", "TONNE", "KG", "CARTON", "UNIT"] as const;
export const DURATIONS = [1, 2, 3, 6, 12, 24] as const;
export const INQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
] as const;

/* ------------------------------ inquiry ---------------------------------- */

/**
 * NOTE ON COERCION: `quantity` and `durationMonths` are validated as real
 * numbers here. The server action coerces form/JSON strings to numbers BEFORE
 * parsing, so the schema's input and output types stay identical and the
 * react-hook-form resolver needs no casts.
 */
export const inquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(120),
  company: z.string().trim().max(160).optional(),
  email: z.email("Enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a reachable phone number.")
    .max(40)
    .regex(/^[+()\d][\d\s()+-]{5,39}$/, "Enter a valid phone number."),
  product: z.enum(PRODUCT_CATEGORIES, { message: "Select a product category." }),
  quantity: z.number({ message: "Enter a quantity." }).int().min(1).max(100000),
  unit: z.enum(UNITS),
  durationMonths: z.number().int().min(1).max(120),
  message: z.string().trim().max(4000).optional(),
  /** Honeypot — must remain empty. Bots fill it. */
  website: z.string().max(0).optional(),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;
export type InquiryDto = InquiryFormValues;

/** Coerce loose JSON/form input into the shape the schema expects. */
export function toInquiryInput(raw: Record<string, unknown>) {
  const num = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
    return Number.isFinite(n) ? n : fallback;
  };
  return {
    name: String(raw.name ?? ""),
    company: raw.company ? String(raw.company) : undefined,
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    product: raw.product,
    quantity: num(raw.quantity, NaN),
    unit: (raw.unit ?? "PALLET") as InquiryFormValues["unit"],
    durationMonths: num(raw.durationMonths, NaN),
    message: raw.message ? String(raw.message) : undefined,
    website: raw.website ? String(raw.website) : "",
  };
}

/** Minimum believable time a human needs to fill the form (ms). */
export const MIN_FORM_TIME_MS = 3000;

/* -------------------------------- auth ----------------------------------- */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
  next: z.string().trim().max(200).optional(),
});

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(120),
    company: z.string().trim().min(2, "Enter your company name.").max(160),
    email: z.email("Enter a valid email address."),
    phone: z
      .string()
      .trim()
      .min(7, "Enter a reachable phone number.")
      .max(40)
      .regex(/^[+()\d][\d\s()+-]{5,39}$/, "Enter a valid phone number."),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(200)
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/\d/, "Include a number."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    terms: z.literal(true, { message: "You must accept the terms." }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginValues = z.input<typeof loginSchema>;
export type SignupValues = z.input<typeof signupSchema>;

/* --------------------------- admin mutations ----------------------------- */

export const inquiryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(INQUIRY_STATUSES),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const inventoryStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "RECEIVED",
    "IN_STORAGE",
    "RESERVED",
    "IN_TRANSIT",
    "DISPATCHED",
    "QUARANTINE",
  ]),
});

export const createInventorySchema = z.object({
  productName: z.string().trim().min(2).max(160),
  product: z.enum(PRODUCT_CATEGORIES),
  zoneId: z.string().min(1),
  location: z.string().trim().min(1).max(32),
  quantity: z.coerce.number().int().min(1).max(100000),
  unit: z.enum(UNITS).default("PALLET"),
  clientId: z.string().optional().or(z.literal("")),
  temperatureLabel: z.string().trim().max(64).optional().or(z.literal("")),
});

/* ------------------------------- contact --------------------------------- */

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(40)
    .regex(/^[+()\d][\d\s()+-]{5,39}$/, "Enter a valid phone number."),
  subject: z.enum(["STORAGE", "LOGISTICS", "ACCOUNT", "PARTNERSHIP", "OTHER"]).default("STORAGE"),
  message: z.string().trim().min(10, "Tell us a little more.").max(4000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactValues = z.input<typeof contactSchema>;

/* ------------------------------ helpers ---------------------------------- */

/** Only allow same-origin relative redirects — blocks open-redirect abuse. */
export function safeNextPath(value?: string | null, fallback = "/portal"): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (/[\r\n]/.test(trimmed)) return fallback;
  return trimmed.slice(0, 200);
}

export function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"];
  return { score, label: labels[score] ?? "Weak", pct: Math.round((score / 5) * 100) };
}
