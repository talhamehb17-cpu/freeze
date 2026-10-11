import { NextResponse, type NextRequest } from "next/server";

import { submitInquiry, type SubmitInquiryInput } from "@/app/actions/inquiry";
import { assertStaff } from "@/lib/auth/guards";
import { AuthorizationError } from "@/lib/auth/guards";
import { listInquiries } from "@/lib/db/repositories";
import type { InquiryStatus } from "@/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/inquiries — public. Same validation path as the server action so
 * an API consumer can never bypass a rule the form enforces.
 */
export async function POST(request: NextRequest) {
  let body: SubmitInquiryInput;
  try {
    body = (await request.json()) as SubmitInquiryInput;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body.", code: "VALIDATION" },
      { status: 400 },
    );
  }

  const result = await submitInquiry({ ...body, source: body.source ?? "api" });

  if (!result.ok) {
    const status =
      result.code === "RATE_LIMITED" ? 429 : result.code === "SERVER" ? 500 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result, { status: 201 });
}

/**
 * GET /api/inquiries — staff only. Authorization is enforced on the server;
 * a client-side guard would be cosmetic.
 */
export async function GET(request: NextRequest) {
  try {
    await assertStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.code === "UNAUTHORIZED" ? 401 : 403 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Unauthorized.", code: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") ?? "ALL") as InquiryStatus | "ALL";
  const query = searchParams.get("q") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100) || 100, 500);

  const rows = await listInquiries({ status, query, limit });
  return NextResponse.json({ ok: true, data: rows, simulated: true });
}
