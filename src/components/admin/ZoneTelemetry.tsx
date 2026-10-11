"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useState } from "react";

import { EASE } from "@/animations/presets";
import type { PortalTelemetryZone } from "@/components/portal/ClientPortal";
import { TelemetryChart } from "@/components/portal/TelemetryChart";
import { DemoNotice, HudPanel, HudRow } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";
import type { ZoneView } from "@/types";

/**
 * ZONE TELEMETRY EXPLORER (spec §34) — one chart mounted at a time.
 *
 * Eight simultaneous recharts canvases would be a needless cost, so the zone is
 * selected and only its series is drawn. Samples arrive from the server-side
 * telemetry provider; this component never synthesises a reading.
 */
export function ZoneTelemetry({
  zones,
  series,
  occupancy,
}: {
  zones: ZoneView[];
  /** Sample history keyed by zone id. */
  series: Record<string, PortalTelemetryZone>;
  /** Pallet utilisation per zone code, when a capacity has been confirmed. */
  occupancy: { zone: string; used: number; capacity: number; pct: number }[];
}) {
  const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState(zones[0]?.id ?? "");
  const active = zones.find((z) => z.id === activeId) ?? zones[0] ?? null;
  const feed = active ? series[active.id] : undefined;
  const util = active ? occupancy.find((o) => o.zone === active.code) : undefined;

  return (
    <div className="space-y-5">
      <HudPanel title="Monitoring zones" code="ZN">
        <div className="flex flex-wrap gap-1.5 px-5 py-4">
          {zones.map((z) => {
            const isActive = z.id === active?.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => setActiveId(z.id)}
                aria-pressed={isActive}
                className={cn(
                  "group/zone relative flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors duration-300",
                  isActive
                    ? "border-cyan-core/55 bg-cyan-core/12"
                    : "border-ice/12 bg-navy/50 hover:border-ice/30 hover:bg-industrial/50",
                )}
              >
                <Layers
                  className={cn("h-3.5 w-3.5", isActive ? "text-cyan-core" : "text-silver/45")}
                  aria-hidden
                />
                <span className="text-left leading-none">
                  <span
                    className={cn(
                      "block font-mono text-[9px] tracking-[0.14em] uppercase",
                      isActive ? "text-frost" : "text-silver/65",
                    )}
                  >
                    {z.code}
                  </span>
                  <span className="mt-1 block max-w-[9rem] truncate font-mono text-[8px] tracking-[0.12em] text-silver/40 uppercase">
                    {z.name}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "ml-1 h-1.5 w-1.5 rounded-full",
                    z.monitored ? "bg-cool" : "bg-silver/30",
                  )}
                />
              </button>
            );
          })}
        </div>
      </HudPanel>

      {active && (
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -12 }}
            transition={{ duration: reduced ? 0.15 : 0.5, ease: EASE.frost as never }}
            className="grid gap-5 xl:grid-cols-[1.5fr_1fr]"
          >
            {feed && feed.samples.length > 0 ? (
              <TelemetryChart
                samples={feed.samples}
                zoneLabel={active.name}
                zoneCode={active.code}
                height={340}
                title={`Condition history · ${active.name}`}
              />
            ) : (
              <HudPanel title={`Condition history · ${active.name}`} code={active.code}>
                <p className="px-6 py-16 text-center font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
                  This zone is not on the monitoring loop, so no readings are recorded for it.
                </p>
              </HudPanel>
            )}

            <div className="space-y-5">
              <HudPanel title="Zone record" code={active.code}>
                <div className="space-y-px px-5 py-4">
                  <HudRow label="Designation" value={active.name} tone="ice" />
                  <HudRow label="Type" value={active.kind} tone="cyan" />
                  <HudRow label="Operating status" value={active.status} tone="cool" />
                  <HudRow
                    label="Reported temperature"
                    value={active.temperature === null ? "CONFIGURABLE" : `${active.temperature.toFixed(1)}°C`}
                    tone="cyan"
                  />
                  <HudRow
                    label="Reported humidity"
                    value={active.humidity === null ? "—" : `${Math.round(active.humidity)}% RH`}
                  />
                  <HudRow label="Occupancy" value={`${Math.round(active.occupancyPct)}%`} />
                  <HudRow label="Monitored" value={active.monitored ? "YES" : "NO"} tone={active.monitored ? "cool" : "amber"} />
                </div>
              </HudPanel>

              <HudPanel title="Pallet utilisation" code="CAP">
                {util ? (
                  <div className="px-5 py-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-[1.8rem] leading-none font-bold text-frost tabular">
                        {util.pct}%
                      </span>
                      <span className="font-mono text-[9px] tracking-[0.14em] text-silver/55 uppercase tabular">
                        {util.used} of {util.capacity} pallets
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-steel/60">
                      <motion.span
                        className={cn(
                          "block h-full rounded-full",
                          util.pct > 90 ? "bg-danger" : util.pct > 75 ? "bg-amber-tj" : "bg-gradient-to-r from-cyan-core to-ice",
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(2, util.pct))}%` }}
                        transition={{ duration: reduced ? 0.15 : 1, ease: EASE.frost as never }}
                      />
                    </div>
                    <p className="mt-3 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
                      {util.pct > 90
                        ? "Nearing confirmed capacity — review before accepting new pallets."
                        : util.pct > 75
                          ? "Approaching confirmed capacity."
                          : "Within confirmed capacity."}
                    </p>
                  </div>
                ) : (
                  <p className="px-5 py-10 text-center font-mono text-[9px] leading-relaxed tracking-[0.16em] text-amber-tj/80 uppercase">
                    Pallet capacity for this zone is CONFIGURABLE — no figure has been confirmed, so
                    utilisation is not shown rather than estimated.
                  </p>
                )}
              </HudPanel>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <DemoNotice>
        Readings are illustrative samples from the demonstration telemetry provider. Connecting real
        sensors means implementing the provider interface — this screen does not change.
      </DemoNotice>
    </div>
  );
}
