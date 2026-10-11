"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ShieldCheck, Wind } from "lucide-react";
import { useMemo } from "react";

import { useTemperature } from "@/components/atmosphere/TemperatureProvider";
import { DemoBadge, HudRow, SignalBars, StatusPill } from "@/components/ui/Hud";
import { EASE } from "@/animations/presets";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Monitoring HUD (spec §11 — Scene 07).
 *
 * Readouts follow the global temperature so dragging the controller visibly
 * re-tunes the room. The whole panel is badged DEMO: these are illustrative
 * values, never presented as live facility sensor data.
 */

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  const reduced = useReducedMotion();
  const path = useMemo(() => {
    if (points.length < 2) return "";
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * 100;
        const y = 30 - ((p - min) / span) * 26 - 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      <defs>
        <linearGradient id="hud-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>
      {path && (
        <>
          <path d={`${path} L100 30 L0 30 Z`} fill="url(#hud-spark)" />
          <motion.path
            d={path}
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="1.2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={reduced ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: EASE.frost as never }}
          />
        </>
      )}
    </svg>
  );
}

function AnimatedValue({ value, className }: { value: string; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <span className="relative inline-block overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          className={cn("block font-mono text-[12px] tracking-[0.14em] tabular", className)}
          initial={reduced ? { opacity: 0 } : { y: "72%", opacity: 0, filter: "blur(3px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={reduced ? { opacity: 0 } : { y: "-72%", opacity: 0, filter: "blur(3px)" }}
          transition={{ duration: 0.4, ease: EASE.frost as never }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function TemperatureHUD({
  className,
  zone = "ZONE A",
  compact = false,
}: {
  className?: string;
  zone?: string;
  compact?: boolean;
}) {
  const { temperature, frost } = useTemperature();

  const humidity = Math.round(48 + frost * 34 + Math.sin(temperature / 4) * 3);
  const trend = useMemo(() => {
    const base = temperature;
    return Array.from({ length: 22 }, (_, i) => base + Math.sin(i / 2.6) * 0.7 + Math.cos(i / 5.1) * 0.35);
  }, [temperature]);

  const status = frost > 0.55 ? "STABLE" : frost > 0.3 ? "STABLE" : "CONFIGURABLE";
  const display = temperature > 0 ? `+${temperature.toFixed(1)}°C` : `${temperature.toFixed(1)}°C`;

  return (
    <div className={cn("panel-hud scanlines relative overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-ice/12 bg-navy/70 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cool opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cool" />
          </span>
          <span className="font-mono text-[10px] tracking-[0.26em] text-frost/90 uppercase">{zone}</span>
        </div>
        <DemoBadge size="xs" />
      </div>

      <div className="px-4 py-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[9px] tracking-[0.24em] text-silver/65 uppercase">Temperature</div>
            <AnimatedValue
              value={display}
              className={cn(
                "!font-display !text-[1.85rem] !font-bold !tracking-tight",
                frost > 0.72 ? "!text-frost" : frost > 0.4 ? "!text-ice" : "!text-silver",
              )}
            />
          </div>
          <div className="flex-1 pb-1">
            <Sparkline points={trend} />
          </div>
        </div>

        {!compact && (
          <>
            <div className="mt-3">
              <HudRow label="Humidity" value={<AnimatedValue value={`${humidity}%`} className="text-ice" />} />
              <HudRow
                label="Airflow"
                value={
                  <span className="flex items-center gap-2 text-ice">
                    <Wind className="h-3 w-3" aria-hidden />
                    <AnimatedValue value={frost > 0.5 ? "CIRCULATING" : "MODULATED"} />
                  </span>
                }
              />
              <HudRow label="Status" value={<StatusPill status={status} size="xs" />} />
              <HudRow
                label="Monitoring"
                value={
                  <span className="flex items-center gap-2 text-cool">
                    <Activity className="h-3 w-3" aria-hidden />
                    <span className="font-mono text-[11px] tracking-[0.14em]">ACTIVE</span>
                    <SignalBars level={5} />
                  </span>
                }
              />
              <HudRow
                label="Access"
                value={
                  <span className="flex items-center gap-2 text-cool">
                    <ShieldCheck className="h-3 w-3" aria-hidden />
                    <span className="font-mono text-[11px] tracking-[0.14em]">SECURED</span>
                  </span>
                }
              />
            </div>
          </>
        )}
      </div>

      {/* frost creeping over the glass as the room gets colder */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: Math.max(0, frost - 0.45) * 0.85,
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 44%, rgba(244,250,255,0.14) 82%, rgba(244,250,255,0.34) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}
