import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InventoryConsole } from "@/components/admin/InventoryConsole";
import { requireStaff } from "@/lib/auth/guards";
import {
  ensureReady,
  getOverviewStats,
  listClients,
  listInventory,
  listZones,
} from "@/lib/db/repositories";
import { dataSourceLabel } from "@/lib/telemetry/provider";

export const metadata: Metadata = { title: "Command centre · Inventory" };

export default async function AdminInventoryPage() {
  await requireStaff();
  await ensureReady();

  const [inventory, zones, clients, stats] = await Promise.all([
    listInventory({ limit: 500 }),
    listZones(),
    listClients(),
    getOverviewStats(),
  ]);

  return (
    <>
      <AdminPageHeader
        index="03"
        eyebrow="Register"
        title="Inventory & put-away"
        lead="Receive batches, assign them to a zone and a rack, then move them through storage to dispatch. Zone occupancy updates with every change."
        simulated={dataSourceLabel().simulated || stats.simulated}
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10">
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Batches</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-frost tabular">{stats.batches}</dd>
            </div>
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Pallets</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-cyan-core tabular">{stats.palletsStored}</dd>
            </div>
          </dl>
        }
      />
      <InventoryConsole
        inventory={inventory}
        zones={zones}
        clients={clients.map((c) => ({ id: c.id, name: c.name, code: c.code }))}
        simulated={dataSourceLabel().simulated || stats.simulated}
      />
    </>
  );
}
