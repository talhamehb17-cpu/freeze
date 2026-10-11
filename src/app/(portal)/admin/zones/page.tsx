import type { Metadata } from "next";
import { Layers, ThermometerSnowflake } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DemoNotice, HudPanel, StatusPill } from "@/components/ui/Hud";
import { requireStaff } from "@/lib/auth/guards";
import { ensureReady, getOverviewStats, listZones } from "@/lib/db/repositories";
import { dataSourceLabel } from "@/lib/telemetry/provider";
import { ZONES } from "@/lib/site";

export const metadata: Metadata = { title: "Command centre · Zones" };

export default async function AdminZonesPage() {
  await requireStaff();
  await ensureReady();

  const [zones, stats] = await Promise.all([listZones(), getOverviewStats()]);
  const simulated = dataSourceLabel().simulated || stats.simulated;

  return (
    <>
      <AdminPageHeader
        index="04"
        eyebrow="Floor plan"
        title="Storage zones"
        lead="Every mapped zone with its role, operating status, reported condition and pallet utilisation where a capacity has been confirmed."
        simulated={simulated}
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10">
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Zones</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-frost tabular">{stats.zones}</dd>
            </div>
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Active</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-cool tabular">{stats.activeZones}</dd>
            </div>
          </dl>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {zones.map((z) => {
          const spec = ZONES.find((s) => s.code === z.code || s.name === z.name);
          const util = stats.utilisation.find((u) => u.zone === z.code);
          return (
            <HudPanel key={z.id} code={z.code} badge={<StatusPill status={z.status} size="xs" pulse={false} />}>
              <div className="px-5 py-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-core/28 bg-cyan-core/8 text-cyan-core">
                    <Layers className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-[1.05rem] leading-tight font-bold tracking-[-0.02em] text-frost">
                      {z.name}
                    </h2>
                    <p className="mt-1 font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">
                      {z.kind} · {z.monitored ? "Monitored" : "Not on the monitoring loop"}
                    </p>
                  </div>
                </div>

                {spec?.purpose && (
                  <p className="mt-4 text-[0.84rem] leading-relaxed text-silver/75">{spec.purpose}</p>
                )}

                <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ice/10 bg-ice/8 sm:grid-cols-4">
                  <Cell
                    label="Temp"
                    value={z.temperature === null ? "CONFIG" : `${z.temperature.toFixed(1)}°C`}
                    icon={<ThermometerSnowflake className="h-3 w-3" aria-hidden />}
                    tone="cyan"
                  />
                  <Cell label="Humidity" value={z.humidity === null ? "—" : `${Math.round(z.humidity)}%`} />
                  <Cell label="Occupancy" value={`${Math.round(z.occupancyPct)}%`} />
                  <Cell
                    label="Capacity"
                    value={util ? `${util.used}/${util.capacity}` : "CONFIGURABLE"}
                    tone={util ? "frost" : "amber"}
                  />
                </dl>

                {util && (
                  <div className="mt-4">
                    <div className="h-1.5 overflow-hidden rounded-full bg-steel/60">
                      <span
                        className={`block h-full rounded-full ${
                          util.pct > 90 ? "bg-danger" : util.pct > 75 ? "bg-amber-tj" : "bg-gradient-to-r from-cyan-core to-ice"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, util.pct))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-right font-mono text-[8px] tracking-[0.16em] text-silver/40 uppercase tabular">
                      {util.pct}% of confirmed pallet capacity
                    </p>
                  </div>
                )}

                {spec?.status === "CONFIGURABLE" && (
                  <p className="mt-4 rounded-md border border-amber-tj/30 bg-amber-tj/8 px-3 py-2 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-amber-tj/85 uppercase">
                    Awaiting client confirmation — figures shown are illustrative.
                  </p>
                )}
              </div>
            </HudPanel>
          );
        })}
      </div>

      <DemoNotice className="mt-5">
        Zone temperatures and occupancy come from the seeded demonstration dataset. Pallet capacity is
        left CONFIGURABLE until the business confirms real figures — nothing here is presented as a
        measured facility value.
      </DemoNotice>
    </>
  );
}

function Cell({
  label,
  value,
  icon,
  tone = "frost",
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "frost" | "cyan" | "amber";
}) {
  return (
    <div className="bg-midnight px-3 py-2.5">
      <dt className="font-mono text-[7px] tracking-[0.2em] text-silver/45 uppercase">{label}</dt>
      <dd
        className={`mt-1.5 flex items-center gap-1.5 font-mono text-[10px] tabular ${
          tone === "cyan" ? "text-cyan-core" : tone === "amber" ? "text-amber-tj" : "text-frost"
        }`}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}
