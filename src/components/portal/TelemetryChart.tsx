"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Activity, Droplets, ThermometerSnowflake } from "lucide-react";
import { useMemo, useState } from "react";

import { EASE } from "@/animations/presets";
import { DemoBadge, HudPanel, HudRow } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";
import type { TelemetrySample } from "@/types";

/**
 * TELEMETRY CHART (spec §34).
 *
 * Renders whatever the telemetry provider returned — the component never
 * generates numbers itself. When `samples[0].simulated` is true (it always is
 * until real sensors are wired in) the chart is badged DEMO and the caption
 * says so in words, per the no-fabrication rule.
 */

export interface TelemetryTarget {
  /** Lower bound of the acceptable band, °C. */
  min: number;
  /** Upper bound of the acceptable band, °C. */
  max: number;
  label?: string;
}

export function TelemetryChart({
  samples,
  zoneLabel = "Facility",
  zoneCode,
  target,
  height = 300,
  title = "Condition history",
}: {
  samples: TelemetrySample[];
  zoneLabel?: string;
  zoneCode?: string;
  target?: TelemetryTarget;
  height?: number;
  title?: string;
}) {
  const reduced = useReducedMotion();
  const [metric, setMetric] = useState<"temperature" | "humidity">("temperature");

  const simulated = samples.some((s) => s.simulated);

  const data = useMemo(
    () =>
      samples.map((s) => ({
        label: new Date(s.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        day: new Date(s.at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        temperature: Number(s.temperature.toFixed(2)),
        humidity: Number(s.humidity.toFixed(1)),
      })),
    [samples],
  );

  const stats = useMemo(() => {
    const series = metric === "temperature" ? data.map((d) => d.temperature) : data.map((d) => d.humidity);
    if (!series.length) return null;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    const drift = series[series.length - 1]! - series[0]!;
    return { min, max, mean, drift };
  }, [data, metric]);

  const domain = useMemo<[number, number]>(() => {
    if (metric === "humidity") return [0, 100];
    const temps = data.map((d) => d.temperature);
    if (!temps.length) return [-30, 10];
    const lo = Math.min(...temps, target?.min ?? Infinity);
    const hi = Math.max(...temps, target?.max ?? -Infinity);
    const pad = Math.max(1.5, (hi - lo) * 0.18);
    return [Math.floor(lo - pad), Math.ceil(hi + pad)];
  }, [data, metric, target]);

  const isTemperature = metric === "temperature";
  const stroke = isTemperature ? "#22D3EE" : "#7DD3FC";
  const unit = isTemperature ? "°C" : "% RH";

  if (!data.length) {
    return (
      <HudPanel title={title} code={zoneCode} badge>
        <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-center">
          <Activity className="h-6 w-6 text-silver/35" aria-hidden />
          <p className="max-w-xs font-mono text-[9px] leading-relaxed tracking-[0.18em] text-silver/45 uppercase">
            No readings recorded for this zone yet. Samples appear as soon as the
            logging feed reports.
          </p>
        </div>
      </HudPanel>
    );
  }

  return (
    <HudPanel
      title={title}
      code={zoneCode}
      badge={simulated ? <DemoBadge size="xs" label="DEMO" /> : undefined}
      className="overflow-hidden"
    >
      {/* zone + metric switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ice/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan-core/30 bg-cyan-core/8 text-cyan-core">
            <ThermometerSnowflake className="h-3.5 w-3.5" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-[0.92rem] font-bold tracking-[-0.01em] text-frost">
              {zoneLabel}
            </span>
            <span className="mt-0.5 block font-mono text-[8px] tracking-[0.2em] text-silver/50 uppercase">
              {data.length} samples · {data[0]!.day} → {data[data.length - 1]!.day}
            </span>
          </span>
        </div>

        <div
          role="group"
          aria-label="Telemetry metric"
          className="flex gap-px overflow-hidden rounded-lg border border-ice/12 bg-navy/70 p-px"
        >
          {(
            [
              { key: "temperature", label: "Temp", icon: ThermometerSnowflake },
              { key: "humidity", label: "Humidity", icon: Droplets },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              aria-pressed={metric === m.key}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 font-mono text-[8px] tracking-[0.18em] uppercase transition-colors duration-300",
                metric === m.key
                  ? "bg-cyan-core/15 text-cyan-core"
                  : "text-silver/50 hover:bg-industrial/60 hover:text-frost",
              )}
            >
              <m.icon className="h-3 w-3" aria-hidden />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* chart */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: reduced ? 0.2 : 0.9, ease: EASE.frost as never }}
        className="px-2 pt-4 pb-1 sm:px-4"
      >
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: -18 }}>
            <defs>
              <linearGradient id={`tj-tele-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.42} />
                <stop offset="55%" stopColor={stroke} stopOpacity={0.12} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="rgba(125,211,252,0.09)" strokeDasharray="2 5" vertical={false} />

            {/* acceptable band — only meaningful for temperature */}
            {isTemperature && target && (
              <ReferenceArea
                y1={target.min}
                y2={target.max}
                fill="#22C55E"
                fillOpacity={0.07}
                stroke="#22C55E"
                strokeOpacity={0.22}
                strokeDasharray="3 4"
              />
            )}

            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(167,180,197,0.55)", fontSize: 9, fontFamily: "var(--font-mono, monospace)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(125,211,252,0.14)" }}
              minTickGap={34}
            />
            <YAxis
              domain={domain}
              tick={{ fill: "rgba(167,180,197,0.55)", fontSize: 9, fontFamily: "var(--font-mono, monospace)" }}
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v: number) => `${v}${isTemperature ? "°" : ""}`}
            />

            <Tooltip
              cursor={{ stroke: "rgba(34,211,238,0.45)", strokeDasharray: "3 3" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]!.payload as (typeof data)[number];
                return (
                  <div className="rounded-lg border border-cyan-core/35 bg-midnight/96 px-3.5 py-2.5 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.95)] backdrop-blur-sm">
                    <div className="font-mono text-[8px] tracking-[0.2em] text-silver/55 uppercase">{label}</div>
                    <div className="mt-1.5 font-display text-lg font-bold text-frost tabular">
                      {isTemperature ? row.temperature.toFixed(1) : row.humidity.toFixed(0)}
                      <span className="ml-1 font-mono text-[9px] font-normal text-cyan-core">{unit}</span>
                    </div>
                    <div className="mt-1 font-mono text-[8px] tracking-[0.14em] text-silver/45 uppercase">
                      {row.day}
                    </div>
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey={metric}
              stroke={stroke}
              strokeWidth={1.9}
              fill={`url(#tj-tele-${metric})`}
              dot={false}
              activeDot={{ r: 3.4, fill: stroke, stroke: "#050914", strokeWidth: 2 }}
              isAnimationActive={!reduced}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* readouts */}
      {stats && (
        <div className="grid grid-cols-2 gap-px border-t border-ice/10 bg-ice/8 sm:grid-cols-4">
          <Readout label="Minimum" value={`${stats.min.toFixed(1)}${unit}`} />
          <Readout label="Maximum" value={`${stats.max.toFixed(1)}${unit}`} tone={stats.max - stats.min > 3.2 ? "warn" : undefined} />
          <Readout label="Mean" value={`${stats.mean.toFixed(1)}${unit}`} />
          <Readout
            label="Drift"
            value={`${stats.drift >= 0 ? "+" : ""}${stats.drift.toFixed(1)}${unit}`}
            tone={Math.abs(stats.drift) > 2 ? "warn" : "good"}
          />
        </div>
      )}

      {isTemperature && target && (
        <div className="border-t border-ice/10 px-5 py-3">
          <HudRow
            label="Acceptable band"
            value={`${target.min}°C → ${target.max}°C`}
            tone="cool"
          />
        </div>
      )}

      <p className="border-t border-ice/10 px-5 py-3 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
        {simulated
          ? "Illustrative sample data — this interface is not connected to facility sensors."
          : "Readings supplied by the connected telemetry provider."}
      </p>
    </HudPanel>
  );
}

function Readout({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "warn";
}) {
  return (
    <div className="bg-midnight px-4 py-3.5">
      <div className="font-mono text-[8px] tracking-[0.22em] text-silver/45 uppercase">{label}</div>
      <div
        className={cn(
          "mt-1.5 font-display text-[1.05rem] font-bold tabular",
          tone === "warn" ? "text-amber-tj" : tone === "good" ? "text-cool" : "text-frost",
        )}
      >
        {value}
      </div>
    </div>
  );
}
