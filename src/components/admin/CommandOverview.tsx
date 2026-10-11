"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  Gauge,
  Inbox,
  Layers,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";

import { EASE } from "@/animations/presets";
import { DemoBadge, DemoNotice, HudPanel, StatusPill } from "@/components/ui/Hud";
import { Counter } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";
import type { OverviewStats } from "@/lib/db/repositories";
import type { FacilityEventView, InquiryStatus, InquiryView } from "@/types";

/**
 * COMMAND CENTRE OVERVIEW (spec §35).
 *
 * The first screen an operator sees: how full the facility is, where the inquiry
 * pipeline stands, which zones are working hardest and what the last events
 * were. Every number is passed in from a server component — nothing here is
 * generated in the browser.
 */

const PIPELINE: InquiryStatus[] = ["NEW", "CONTACTED", "QUOTED", "APPROVED", "REJECTED", "COMPLETED"];

const SEVERITY_DOT = {
  INFO: "bg-cool",
  WARNING: "bg-amber-tj",
  CRITICAL: "bg-danger",
} as const;

export function CommandOverview({
  stats,
  byStatus,
  volume,
  events,
  recentInquiries,
  simulated,
}: {
  stats: OverviewStats;
  byStatus: Record<InquiryStatus, number>;
  volume: { day: string; count: number }[];
  events: FacilityEventView[];
  recentInquiries: InquiryView[];
  simulated: boolean;
}) {
  const reduced = useReducedMotion();
  const totalPipeline = PIPELINE.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0);
  const occupancy = Math.max(0, Math.min(100, stats.occupancyPct));

  return (
    <div className="space-y-5">
      {/* ------------------------------- header ------------------------------- */}
      <header className="panel relative overflow-hidden rounded-2xl">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(80% 140% at 4% 0%, rgba(34,211,238,0.16), transparent 60%)" }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-center justify-between gap-8 px-6 py-7 sm:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-core" aria-hidden />
              <span className="font-mono text-[9px] tracking-[0.28em] text-cyan-core uppercase">
                Operations
              </span>
              {simulated && <DemoBadge size="xs" label="Demo dataset" />}
            </div>
            <h1 className="mt-4 font-display text-[clamp(1.9rem,4.4vw,2.9rem)] leading-[0.98] font-bold tracking-[-0.04em] text-frost">
              Command centre
            </h1>
            <p className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-silver/75">
              Facility occupancy, the inquiry pipeline, zone load and the event trail — one surface for
              the operations desk.
            </p>
          </div>

          <OccupancyGauge pct={occupancy} used={stats.palletsStored} capacity={stats.palletCapacity} reduced={reduced} />
        </div>
      </header>

      {/* -------------------------------- KPIs -------------------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icon={Inbox} label="Open inquiries" value={stats.inquiriesNew} note="Awaiting first contact" tone="amber" href="/admin/inquiries" />
        <Kpi icon={Boxes} label="Batches held" value={stats.batches} note={`${stats.trackingActive} on active tracking`} href="/admin/inventory" />
        <Kpi icon={Layers} label="Zones" value={stats.activeZones} suffix={`/ ${stats.zones}`} note="Active of mapped" href="/admin/zones" />
        <Kpi icon={Users} label="Clients" value={stats.clients} note="Registered accounts" href="/admin/clients" />
        <Kpi icon={TriangleAlert} label="Alerts" value={stats.alerts} note="Non-info events logged" tone={stats.alerts > 0 ? "danger" : "cool"} href="/admin/audit" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        {/* ---------------------------- inquiry pipeline ---------------------------- */}
        <HudPanel
          title="Inquiry pipeline"
          code="REQ"
          badge={<Link href="/admin/inquiries" className="flex items-center gap-1 font-mono text-[8px] tracking-[0.18em] text-cyan-core uppercase transition-colors hover:text-frost">
            Open queue <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>}
        >
          <div className="px-5 py-5">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-steel/60">
              {PIPELINE.map((s, i) => {
                const n = byStatus[s] ?? 0;
                const pct = totalPipeline > 0 ? (n / totalPipeline) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <motion.span
                    key={s}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: reduced ? 0.15 : 0.9, delay: reduced ? 0 : i * 0.07, ease: EASE.frost as never }}
                    className={cn("h-full", STATUS_BAR[s])}
                    title={`${s}: ${n}`}
                  />
                );
              })}
            </div>

            <ul className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ice/10 bg-ice/8 sm:grid-cols-3">
              {PIPELINE.map((s) => (
                <li key={s} className="group/st bg-midnight px-4 py-3.5 transition-colors duration-300 hover:bg-industrial/40">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[s])} aria-hidden />
                    <span className="font-mono text-[8px] tracking-[0.2em] text-silver/50 uppercase">
                      {s}
                    </span>
                  </div>
                  <div className="mt-2 font-display text-[1.5rem] leading-none font-bold text-frost tabular">
                    <Counter value={byStatus[s] ?? 0} duration={reduced ? 1 : 1100} />
                  </div>
                  <div className="mt-1.5 font-mono text-[8px] tracking-[0.14em] text-silver/35 uppercase tabular">
                    {totalPipeline > 0 ? Math.round(((byStatus[s] ?? 0) / totalPipeline) * 100) : 0}% of queue
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* volume chart */}
          <div className="border-t border-ice/10 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
              <span className="font-mono text-[9px] tracking-[0.2em] text-silver/65 uppercase">
                Requests received · last {volume.length} days
              </span>
            </div>
            {volume.length === 0 ? (
              <p className="py-8 text-center font-mono text-[9px] tracking-[0.16em] text-silver/40 uppercase">
                No requests recorded in this window
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={132}>
                <BarChart data={volume} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
                  <CartesianGrid stroke="rgba(125,211,252,0.08)" strokeDasharray="2 5" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "rgba(167,180,197,0.5)", fontSize: 8, fontFamily: "var(--font-mono, monospace)" }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(125,211,252,0.12)" }}
                    minTickGap={18}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "rgba(167,180,197,0.5)", fontSize: 8, fontFamily: "var(--font-mono, monospace)" }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(34,211,238,0.07)" }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-md border border-cyan-core/35 bg-midnight/96 px-3 py-2">
                          <div className="font-mono text-[8px] tracking-[0.18em] text-silver/55 uppercase">{label}</div>
                          <div className="mt-1 font-display text-base font-bold text-frost tabular">
                            {payload[0]!.value}
                            <span className="ml-1 font-mono text-[8px] font-normal text-cyan-core">
                              request{payload[0]!.value === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={!reduced} animationDuration={1100}>
                    {volume.map((d) => (
                      <Cell
                        key={d.day}
                        fill={d.count > 0 ? "#22D3EE" : "rgba(125,211,252,0.12)"}
                        fillOpacity={d.count > 0 ? 0.85 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </HudPanel>

        {/* ------------------------------ zone load ------------------------------ */}
        <div className="space-y-5">
          <HudPanel title="Zone load" code="ZN" badge={<DemoBadge size="xs" label="Demo" />}>
            <ul className="divide-y divide-ice/8">
              {stats.utilisation.length === 0 && (
                <li className="px-5 py-10 text-center font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
                  Pallet capacity has not been confirmed for any zone yet, so utilisation cannot be
                  calculated without inventing a figure.
                </li>
              )}
              {stats.utilisation.map((z, i) => (
                <li key={z.zone} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[9px] tracking-[0.18em] text-frost uppercase">{z.zone}</span>
                    <span className="font-mono text-[9px] text-silver/55 tabular">
                      {z.used} / {z.capacity} pallets
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-steel/60">
                    <motion.span
                      className={cn(
                        "block h-full rounded-full",
                        z.pct > 90 ? "bg-danger" : z.pct > 75 ? "bg-amber-tj" : "bg-gradient-to-r from-cyan-core to-ice",
                      )}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.min(100, Math.max(1.5, z.pct))}%` }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: reduced ? 0.15 : 1, delay: reduced ? 0 : i * 0.05, ease: EASE.frost as never }}
                    />
                  </div>
                  <div className="mt-1.5 text-right font-mono text-[8px] tracking-[0.16em] text-silver/40 uppercase tabular">
                    {z.pct}% utilised
                  </div>
                </li>
              ))}
            </ul>

            {Object.keys(stats.inventoryByProduct).length > 0 && (
              <div className="border-t border-ice/10 px-5 py-4">
                <div className="mb-3 font-mono text-[8px] tracking-[0.2em] text-silver/50 uppercase">
                  Pallets by category
                </div>
                <div className="space-y-2">
                  {Object.entries(stats.inventoryByProduct)
                    .sort((a, b) => b[1] - a[1])
                    .map(([product, qty]) => {
                      const max = Math.max(...Object.values(stats.inventoryByProduct));
                      return (
                        <div key={product} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 font-mono text-[8px] tracking-[0.16em] text-silver/60 uppercase">
                            {product}
                          </span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-steel/50">
                            <motion.span
                              className="block h-full rounded-full bg-gradient-to-r from-cyan-core/80 to-ice/70"
                              initial={{ width: 0 }}
                              whileInView={{ width: `${Math.max(4, (qty / max) * 100)}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: reduced ? 0.15 : 0.9, ease: EASE.frost as never }}
                            />
                          </span>
                          <span className="w-10 shrink-0 text-right font-mono text-[9px] text-frost tabular">{qty}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </HudPanel>

          <HudPanel title="Latest requests" code="NEW">
            {recentInquiries.length === 0 ? (
              <p className="px-5 py-10 text-center font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
                No storage requests yet. Submissions from the public form appear here immediately.
              </p>
            ) : (
              <ul className="divide-y divide-ice/8">
                {recentInquiries.map((q) => (
                  <li key={q.id} className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-300 hover:bg-industrial/40">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-display text-[0.88rem] font-bold tracking-[-0.01em] text-frost">
                        {q.company || q.name}
                      </div>
                      <div className="mt-1 font-mono text-[8px] tracking-[0.14em] text-silver/45 uppercase">
                        {q.reference} · {q.product} · {q.quantity} {q.unit} · {q.durationMonths} mo
                      </div>
                    </div>
                    <StatusPill status={q.status} size="xs" pulse={false} />
                  </li>
                ))}
              </ul>
            )}
          </HudPanel>
        </div>
      </div>

      {/* ------------------------------ event trail ------------------------------ */}
      <HudPanel title="Event trail" code="LOG">
        {events.length === 0 ? (
          <p className="px-5 py-10 text-center font-mono text-[9px] tracking-[0.16em] text-silver/45 uppercase">
            No facility events recorded.
          </p>
        ) : (
          <ul className="divide-y divide-ice/8">
            {events.map((e) => (
              <li key={e.id} className="flex items-start gap-4 px-5 py-3.5 transition-colors duration-300 hover:bg-industrial/40">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", SEVERITY_DOT[e.severity])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-mono text-[9px] tracking-[0.14em] text-frost uppercase">{e.type}</span>
                    <time dateTime={e.at} className="font-mono text-[8px] tracking-[0.14em] text-silver/40 tabular">
                      {new Date(e.at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-silver/75">{e.message}</p>
                  <div className="mt-1 font-mono text-[8px] tracking-[0.18em] text-silver/40 uppercase">
                    {e.zone} · {e.severity}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </HudPanel>

      <DemoNotice>
        The command centre is fully interactive — statuses, batches and audit rows persist — but the
        dataset behind it is seeded demonstration data, and temperatures are illustrative until a
        sensor provider is connected.
      </DemoNotice>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const STATUS_BAR: Record<InquiryStatus, string> = {
  NEW: "bg-cyan-core",
  CONTACTED: "bg-ice",
  QUOTED: "bg-amber-tj",
  APPROVED: "bg-cool",
  REJECTED: "bg-danger",
  COMPLETED: "bg-steel",
};

const STATUS_DOT: Record<InquiryStatus, string> = {
  NEW: "bg-cyan-core",
  CONTACTED: "bg-ice",
  QUOTED: "bg-amber-tj",
  APPROVED: "bg-cool",
  REJECTED: "bg-danger",
  COMPLETED: "bg-steel",
};

function Kpi({
  icon: Icon,
  label,
  value,
  suffix,
  note,
  tone,
  href,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  suffix?: string;
  note: string;
  tone?: "amber" | "cool" | "danger";
  href: string;
}) {
  return (
    <Link
      href={href}
      className="panel group/kpi relative block overflow-hidden rounded-xl px-4 py-4 transition-colors duration-500 hover:border-cyan-core/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[8px] tracking-[0.2em] text-silver/50 uppercase">{label}</span>
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-500 group-hover/kpi:scale-110",
            tone === "danger" ? "text-danger" : tone === "amber" ? "text-amber-tj" : "text-cyan-core/70",
          )}
          aria-hidden
        />
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <Counter
          value={value}
          duration={1200}
          className={cn(
            "font-display text-[1.8rem] leading-none font-bold tabular",
            tone === "danger" ? "text-danger" : tone === "amber" ? "text-amber-tj" : "text-frost",
          )}
        />
        {suffix && <span className="font-mono text-[10px] text-silver/50">{suffix}</span>}
      </div>
      <div className="mt-2 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
        {note}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 group-hover/kpi:scale-x-100"
      />
    </Link>
  );
}

function OccupancyGauge({
  pct,
  used,
  capacity,
  reduced,
}: {
  pct: number;
  used: number;
  capacity: number;
  reduced: boolean;
}) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C * 0.75;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[8.5rem] w-[8.5rem] shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-[135deg]" aria-hidden>
          <circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke="rgba(125,211,252,0.12)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${C * 0.75} ${C}`}
          />
          <motion.circle
            cx="64"
            cy="64"
            r={R}
            fill="none"
            stroke={pct > 90 ? "#EF4444" : pct > 75 ? "#F59E0B" : "#22D3EE"}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${C}`}
            initial={{ strokeDasharray: reduced ? `${dash} ${C}` : `0 ${C}` }}
            animate={{ strokeDasharray: `${dash} ${C}` }}
            transition={{ duration: reduced ? 0.15 : 1.5, ease: EASE.frost as never }}
            style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.45))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Gauge className="h-3 w-3 text-cyan-core/70" aria-hidden />
          <span className="mt-1 font-display text-[1.9rem] leading-none font-bold text-frost tabular">
            <Counter value={pct} duration={reduced ? 1 : 1500} />
            <span className="ml-0.5 font-mono text-xs text-cyan-core">%</span>
          </span>
          <span className="mt-1.5 font-mono text-[7px] tracking-[0.2em] text-silver/45 uppercase">
            Occupancy
          </span>
        </div>
      </div>

      <div className="space-y-2 font-mono text-[9px]">
        <div>
          <div className="tracking-[0.2em] text-silver/45 uppercase">Pallets held</div>
          <div className="mt-1 font-display text-[1.1rem] font-bold text-frost tabular">{used}</div>
        </div>
        <div>
          <div className="tracking-[0.2em] text-silver/45 uppercase">Confirmed capacity</div>
          <div className="mt-1 font-display text-[1.1rem] font-bold text-frost tabular">
            {capacity > 0 ? capacity : "CONFIGURABLE"}
          </div>
        </div>
      </div>
    </div>
  );
}
