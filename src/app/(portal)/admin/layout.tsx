import type { Metadata } from "next";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireStaff } from "@/lib/auth/guards";
import { countInquiriesByStatus, ensureReady, getOverviewStats } from "@/lib/db/repositories";

export const metadata: Metadata = {
  title: "Command centre",
  description: "Operations command centre — inquiry pipeline, inventory register, zone telemetry and audit trail.",
  robots: { index: false, follow: false },
};

/**
 * ADMIN COMMAND CENTRE shell (spec §35).
 *
 * `requireStaff()` runs on the server for every nested route. If somebody edits
 * the client bundle to reveal these screens, the data behind them is still
 * unreachable — the pages re-check before reading, and every mutation re-checks
 * again inside its server action.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaff();
  await ensureReady();

  const [byStatus, stats] = await Promise.all([countInquiriesByStatus(), getOverviewStats()]);

  const openInquiries = byStatus.NEW + byStatus.CONTACTED + byStatus.QUOTED;

  return (
    <div className="flex min-h-[calc(100dvh-4.4rem)]">
      <AdminSidebar
        counts={{
          "/admin/inquiries": openInquiries,
          "/admin/inventory": stats.batches,
          "/admin/zones": stats.zones,
          "/admin/clients": stats.clients,
        }}
        alerts={stats.alerts}
      />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </div>
    </div>
  );
}
