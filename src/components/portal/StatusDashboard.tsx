"use client";

import { motion } from "framer-motion";
import { Boxes, Layers, MapPin, Radio, ThermometerSnowflake } from "lucide-react";
import { useMemo, useState } from "react";

import { EASE } from "@/animations/presets";
import { DemoBadge, DemoNotice, HudPanel, StatusPill } from "@/components/ui/Hud";
import { Counter } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";
import type { FacilityEventView, InventoryStatus, InventoryView, ZoneView } from "@/types";

/**
 * STATUS DASHBOARD (spec §33) — shared by the client portal and the command
 * centre. Stat tiles, a filterable inventory table, zone conditions and the
 * event feed, all rendered from data handed down by a server component. It
 * never fetches and never invents a value.
 */

export interface StatusTile {
  label: string;
  value: number;
  suffix?: string;
  note?: string;
  tone?: "frost" | "cyan" | "cool" | "amber";
}

const STATUS_FILTERS: (InventoryStatus | "ALL")[] = [
  "ALL",
  "RECEIVED",
  "IN_STORAGE",
  "RESERVED",
  "IN_TRANSIT",
  "DISPATCHED",
  "QUARANTINE",
];

const SEVERITY_TONE = {
  INFO: "text-ice",
  WARNING: "text-amber-tj",
  CRITICAL: "text-danger",
} as const;

export function StatusDashboard({
  tiles,
  inventory,
  zones,
  events,
  simulated,
  inventoryTitle = "Inventory",
  inventoryCode,
  emptyMessage = "No batches on record for this account yet.",
}: {
  tiles: StatusTile[];
  inventory: InventoryView[];
  zones?: ZoneView[];
  events?: FacilityEventView[];
  simulated?: boolean;
  inventoryTitle?: string;
  inventoryCode?: string;
  emptyMessage?: string;
}) {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<InventoryStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((i) => {
      if (filter !== "ALL" && i.status !== filter) return false;
      if (!q) return true;
      return (
        i.batch.toLowerCase().includes(q) ||
        i.productName.toLowerCase().includes(q) ||
        i.zone.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    });
  }, [inventory, filter, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: inventory.length };
    for (const i of inventory) map[i.status] = (map[i.status] ?? 0) + 1;
    return map;
  }, [inventory]);

  return (
    <div className="space-y-5">
      {/* ------------------------------- tiles ------------------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: reduced ? 0 : i * 0.07, ease: EASE.frost as never }}
            className="panel group/tile relative overflow-hidden rounded-xl px-4 py-4"
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                t.tone === "cool" && "via-cool",
                t.tone === "amber" && "via-amber-tj",
                (t.tone === "cyan" || !t.tone) && "via-cyan-core",
                (t.tone === "frost" || !t.tone) && "via-ice",
              )}
            />
            <div className="font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">{t.label}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <Counter
                value={t.value}
                duration={reduced ? 1 : 1300}
                className={cn(
                  "font-display text-[1.9rem] leading-none font-bold tabular",
                  t.tone === "cool" ? "text-cool" : t.tone === "amber" ? "text-amber-tj" : "text-frost",
                )}
              />
              {t.suffix && <span className="font-mono text-xs text-cyan-core">{t.suffix}</span>}
            </div>
            {t.note && (
              <div className="mt-2 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
                {t.note}
              </div>
            )}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 group-hover/tile:scale-x-100"
            />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        {/* ----------------------------- inventory ----------------------------- */}
        <HudPanel
          title={inventoryTitle}
          code={inventoryCode}
          badge={simulated ? <DemoBadge size="xs" label="Demo data" /> : undefined}
          className="overflow-hidden"
        >
          {/* filters */}
          <div className="flex flex-wrap items-center gap-3 border-b border-ice/10 px-4 py-3">
            <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-ice/12 bg-navy/70 p-px">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    "px-2.5 py-1.5 font-mono text-[8px] tracking-[0.16em] uppercase transition-colors duration-300",
                    filter === f
                      ? "bg-cyan-core/15 text-cyan-core"
                      : "text-silver/45 hover:bg-industrial/60 hover:text-frost",
                  )}
                >
                  {f.replace(/_/g, " ")}
                  <span className="ml-1.5 text-silver/35 tabular">{counts[f] ?? 0}</span>
                </button>
              ))}
            </div>

            <label className="ml-auto flex min-w-[10rem] flex-1 items-center gap-2 rounded-lg border border-ice/12 bg-navy/60 px-3 py-1.5 transition-colors focus-within:border-cyan-core/55 sm:flex-none">
              <Boxes className="h-3 w-3 shrink-0 text-silver/40" aria-hidden />
              <span className="sr-only">Search batches</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Batch, product, location…"
                className="w-full bg-transparent font-mono text-[9px] tracking-[0.1em] text-frost uppercase placeholder:text-silver/35 focus:outline-none"
              />
            </label>
          </div>

          {/* table */}
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <Boxes className="h-6 w-6 text-silver/30" aria-hidden />
              <p className="max-w-sm font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
                {inventory.length === 0 ? emptyMessage : "No batches match that filter."}
              </p>
            </div>
          ) : (
            <div className="max-h-[27rem] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[42rem] border-collapse text-left">
                <caption className="sr-only">
                  Stored batches with zone, quantity, condition and tracking state
                </caption>
                <thead className="sticky top-0 z-10 bg-navy/95 backdrop-blur">
                  <tr className="border-b border-ice/12">
                    {["Batch", "Product", "Zone", "Qty", "Condition", "Tracking", "Status"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-4 py-2.5 font-mono text-[8px] font-medium tracking-[0.2em] text-silver/50 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.35, delay: reduced ? 0 : Math.min(i * 0.03, 0.4) }}
                      className="group/row border-b border-ice/8 transition-colors duration-300 last:border-0 hover:bg-industrial/45"
                    >
                      <th scope="row" className="px-4 py-3 font-mono text-[10px] font-normal tracking-[0.08em] text-frost">
                        {row.batch}
                      </th>
                      <td className="px-4 py-3">
                        <div className="text-[0.8rem] text-frost/90">{row.productName}</div>
                        <div className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-silver/40 uppercase">
                          {row.product}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-ice uppercase">
                          <MapPin className="h-3 w-3 text-silver/40" aria-hidden />
                          {row.zone}
                        </div>
                        <div className="mt-0.5 pl-[1.15rem] font-mono text-[8px] tracking-[0.14em] text-silver/40">
                          {row.location}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-frost tabular">
                        {row.quantity}
                        <span className="ml-1 text-[8px] text-silver/45">{row.unit.slice(0, 3)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-core tabular">
                          <ThermometerSnowflake className="h-3 w-3" aria-hidden />
                          {row.temperature}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 font-mono text-[8px] tracking-[0.16em] uppercase",
                            row.tracking === "ACTIVE" ? "text-cool" : "text-silver/45",
                          )}
                        >
                          <Radio className="h-3 w-3" aria-hidden />
                          {row.tracking}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={row.status} size="xs" pulse={false} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-ice/10 px-4 py-2.5 font-mono text-[8px] tracking-[0.16em] text-silver/40 uppercase">
            <span>
              Showing {rows.length} of {inventory.length}
            </span>
            <span className="hidden sm:inline">Sorted by arrival, newest first</span>
          </div>
        </HudPanel>

        {/* -------------------------- zones + events -------------------------- */}
        <div className="space-y-5">
          {zones && zones.length > 0 && (
            <HudPanel title="Zone conditions" code="ZN" badge={<DemoBadge size="xs" label="Demo" />}>
              <ul className="divide-y divide-ice/8">
                {zones.map((z) => (
                  <li key={z.id} className="group/zone relative px-4 py-3.5 transition-colors duration-300 hover:bg-industrial/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Layers className="h-3 w-3 shrink-0 text-cyan-core/70" aria-hidden />
                          <span className="truncate font-display text-[0.86rem] font-bold tracking-[-0.01em] text-frost">
                            {z.name}
                          </span>
                        </div>
                        <div className="mt-1 font-mono text-[8px] tracking-[0.18em] text-silver/45 uppercase">
                          {z.code} · {z.kind}
                        </div>
                      </div>
                      <StatusPill status={z.status} size="xs" pulse={false} />
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[9px]">
                      <span className="text-cyan-core tabular">
                        {z.temperature === null ? "CONFIG" : `${z.temperature.toFixed(1)}°C`}
                      </span>
                      <span className="text-ice/80 tabular">
                        {z.humidity === null ? "—" : `${Math.round(z.humidity)}% RH`}
                      </span>
                      <span className="text-right text-silver/55 tabular">{Math.round(z.occupancyPct)}% full</span>
                    </div>

                    {/* occupancy bar */}
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-steel/70">
                      <motion.span
                        className={cn(
                          "block h-full rounded-full",
                          z.occupancyPct > 88 ? "bg-amber-tj" : "bg-gradient-to-r from-cyan-core to-ice",
                        )}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, Math.max(2, z.occupancyPct))}%` }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: reduced ? 0.2 : 1.1, ease: EASE.frost as never }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </HudPanel>
          )}

          {events && events.length > 0 && (
            <HudPanel title="Facility events" code="LOG">
              <ul className="max-h-[22rem] divide-y divide-ice/8 overflow-y-auto">
                {events.map((e) => (
                  <li key={e.id} className="flex gap-3 px-4 py-3 transition-colors duration-300 hover:bg-industrial/40">
                    <span className="mt-1.5 flex h-1.5 w-1.5 shrink-0">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          e.severity === "CRITICAL"
                            ? "bg-danger"
                            : e.severity === "WARNING"
                              ? "bg-amber-tj"
                              : "bg-cool",
                        )}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono text-[9px] tracking-[0.14em] text-frost uppercase">{e.type}</span>
                        <time
                          dateTime={e.at}
                          className="shrink-0 font-mono text-[8px] tracking-[0.14em] text-silver/40 tabular"
                        >
                          {new Date(e.at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                      <p className={cn("mt-1 text-[0.78rem] leading-relaxed", SEVERITY_TONE[e.severity])}>
                        {e.message}
                      </p>
                      <div className="mt-1 font-mono text-[8px] tracking-[0.18em] text-silver/40 uppercase">
                        {e.zone} · {e.severity}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </HudPanel>
          )}

          <DemoNotice className="px-1">
            Figures on this dashboard come from the seeded demonstration dataset. Replace the telemetry
            provider to point the same interface at real sensors.
          </DemoNotice>
        </div>
      </div>
    </div>
  );
}
