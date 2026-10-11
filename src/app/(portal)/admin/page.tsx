import type { Metadata } from "next";

import { CommandOverview } from "@/components/admin/CommandOverview";
import { requireStaff } from "@/lib/auth/guards";
import {
  countInquiriesByStatus,
  ensureReady,
  getOverviewStats,
  inquiryVolume,
  listEvents,
  listInquiries,
} from "@/lib/db/repositories";
import { dataSourceLabel } from "@/lib/telemetry/provider";

export const metadata: Metadata = { title: "Command centre · Overview" };

export default async function AdminOverviewPage() {
  await requireStaff();
  await ensureReady();

  const [stats, byStatus, volume, events, recent] = await Promise.all([
    getOverviewStats(),
    countInquiriesByStatus(),
    inquiryVolume(14),
    listEvents(10),
    listInquiries({ limit: 6 }),
  ]);

  return (
    <CommandOverview
      stats={stats}
      byStatus={byStatus}
      volume={volume}
      events={events}
      recentInquiries={recent}
      simulated={dataSourceLabel().simulated || stats.simulated}
    />
  );
}
