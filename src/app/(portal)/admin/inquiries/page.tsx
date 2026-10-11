import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InquiryQueue } from "@/components/admin/InquiryQueue";
import { requireStaff } from "@/lib/auth/guards";
import { countInquiriesByStatus, ensureReady, listInquiries } from "@/lib/db/repositories";
import { dataSourceLabel } from "@/lib/telemetry/provider";

export const metadata: Metadata = { title: "Command centre · Inquiries" };

export default async function AdminInquiriesPage() {
  await requireStaff();
  await ensureReady();

  const [inquiries, byStatus] = await Promise.all([
    listInquiries({ limit: 500 }),
    countInquiriesByStatus(),
  ]);

  const open = byStatus.NEW + byStatus.CONTACTED + byStatus.QUOTED;

  return (
    <>
      <AdminPageHeader
        index="02"
        eyebrow="Pipeline"
        title="Storage inquiries"
        lead="Every request submitted from the public site, the calculator or the portal. Move each one through NEW → CONTACTED → QUOTED → APPROVED, and the change is audited against your operator account."
        simulated={dataSourceLabel().simulated}
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10">
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Open</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-amber-tj tabular">{open}</dd>
            </div>
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Total</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-frost tabular">{inquiries.length}</dd>
            </div>
          </dl>
        }
      />
      <InquiryQueue inquiries={inquiries} simulated={dataSourceLabel().simulated} />
    </>
  );
}
