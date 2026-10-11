import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ZoneTelemetry } from "@/components/admin/ZoneTelemetry";
import type { PortalTelemetryZone } from "@/components/portal/ClientPortal";
import { requireStaff } from "@/lib/auth/guards";
import { ensureReady, getOverviewStats, listZones } from "@/lib/db/repositories";
import { dataSourceLabel, getTelemetryProvider } from "@/lib/telemetry/provider";

export const metadata: Metadata = { title: "Command centre · Telemetry" };

/**
 * Telemetry is read exclusively through the provider abstraction (spec §40), so
 * swapping the seeded demo feed for real sensors changes nothing on this page.
 */
export default async function AdminTelemetryPage() {
  await requireStaff();
  await ensureReady();

  const [zones, stats] = await Promise.all([listZones(), getOverviewStats()]);
  const provider = getTelemetryProvider();

  const seriesEntries = await Promise.all(
    zones.map(async (z) => {
      const samples = z.monitored ? await provider.series({ zoneId: z.id, points: 48 }) : [];
      return [z.id, { zoneCode: z.code, zoneLabel: z.name, samples } satisfies PortalTelemetryZone] as const;
    }),
  );

  return (
    <>
      <AdminPageHeader
        index="05"
        eyebrow="Monitoring"
        title="Zone telemetry"
        lead={`Feed: ${provider.label}. ${provider.note}`}
        simulated={dataSourceLabel().simulated || stats.simulated}
      />
      <ZoneTelemetry
        zones={zones}
        series={Object.fromEntries(seriesEntries)}
        occupancy={stats.utilisation}
      />
    </>
  );
}
