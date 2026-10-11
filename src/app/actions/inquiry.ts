"use server";

import { headers } from "next/headers";

import { createInquiry } from "@/lib/db/repositories";
import { notifyAdminOfInquiry } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp } from "@/lib/auth/session";
import { MIN_FORM_TIME_MS, inquirySchema, toInquiryInput } from "@/lib/validation/schemas";
import type { ApiResponse, InquiryResult, ApiError } from "@/types";

/**
 * Public storage inquiry (spec §26, §38, §39).
 *
 * Protections, in order:
 *   1. honeypot field must be empty
 *   2. minimum human fill-time
 *   3. per-IP rate limit
 *   4. Zod validation (the same schema the client form uses)
 *   5. write through the repository layer only — never raw SQL, never from a
 *      client component, never with DATABASE_URL visible to the browser
 *
 * On success the caller gets a reference id. On failure the caller gets a safe
 * message: raw database or provider errors are logged server-side and never
 * forwarded.
 */

export interface SubmitInquiryInput {
  name: string;
  company?: string;
  email: string;
  phone: string;
  product: string;
  quantity: number | string;
  unit: string;
  durationMonths: number | string;
  message?: string;
  website?: string;
  formStartedAt?: number | string;
  source?: string;
}

export type SubmitInquiryResponse = ApiResponse<InquiryResult>;

async function callerIpHash(): Promise<string | null> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip") ||
    null;
  return hashIp(ip);
}

export async function submitInquiry(input: SubmitInquiryInput): Promise<SubmitInquiryResponse> {
  const denied = (message: string, code: ApiError["code"]): ApiError => ({ ok: false, error: message, code });

  // 1 — honeypot
  if (input.website && input.website.trim().length > 0) {
    // Silently succeed for bots so they cannot learn they were detected.
    return { ok: true, reference: "TJ-00000", id: "suppressed", receivedAt: new Date().toISOString(), status: "NEW" };
  }

  // 2 — human fill-time
  const startedAt = Number(input.formStartedAt ?? 0);
  if (startedAt > 0 && Date.now() - startedAt < MIN_FORM_TIME_MS) {
    return denied("Please take a moment to complete the form.", "VALIDATION");
  }

  // 3 — rate limit
  const ipHash = await callerIpHash();
  const limit = rateLimit(`inquiry:${ipHash ?? "anon"}`, { max: 5, windowSeconds: 900 });
  if (!limit.ok) {
    return denied(
      `Too many requests from this connection. Please try again in ${limit.resetSeconds}s.`,
      "RATE_LIMITED",
    );
  }

  // 4 — validation
  const parsed = inquirySchema.safeParse(
    toInquiryInput({
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      product: input.product,
      quantity: input.quantity,
      unit: input.unit,
      durationMonths: input.durationMonths,
      message: input.message,
      website: "",
    }),
  );

  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fields[key]) fields[key] = issue.message;
    }
    return {
      ok: false,
      error: "We couldn't complete your request. Please check the highlighted fields.",
      code: "VALIDATION",
      fields,
    };
  }

  // 5 — persist
  try {
    const record = await createInquiry(
      {
        name: parsed.data.name,
        company: parsed.data.company || null,
        email: parsed.data.email,
        phone: parsed.data.phone,
        product: parsed.data.product,
        quantity: parsed.data.quantity,
        unit: parsed.data.unit,
        durationMonths: parsed.data.durationMonths,
        message: parsed.data.message || null,
        source: input.source ?? "website",
      },
      { source: input.source ?? "website", ipAddressHash: ipHash },
    );

    // Notify the operations team. Failures here must never fail the request —
    // the inquiry is already safely stored.
    notifyAdminOfInquiry({
      reference: record.reference,
      inquiryId: record.id,
      name: record.name,
      company: record.company,
      email: record.email,
      phone: record.phone,
      product: record.product,
      quantity: record.quantity,
      unit: record.unit,
      durationMonths: record.durationMonths,
      message: record.message,
    }).catch((error) => {
      console.error("[inquiry] notification failed:", error instanceof Error ? error.message : error);
    });

    return {
      ok: true,
      reference: record.reference,
      id: record.id,
      receivedAt: record.createdAt,
      status: record.status,
    };
  } catch (error) {
    // Log the real error server-side; return a safe message to the visitor.
    console.error("[inquiry] create failed:", error instanceof Error ? error.message : error);
    return denied("We couldn't complete your request. Please try again.", "SERVER");
  }
}
