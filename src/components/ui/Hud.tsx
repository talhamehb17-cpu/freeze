"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";

import { EASE } from "@/animations/presets";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn, STATUS_TONE } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* DEMO badge — spec §40, non-negotiable                                       */
/* -------------------------------------------------------------------------- */

/**
 * Anything not backed by a real sensor or database MUST carry this.
 * The product never labels simulated data live, real-time, current or actual.
 */
export function DemoBadge({
  label = "DEMO",
  className,
  withNote = false,
  size = "sm",
}: {
  label?: string;
  className?: string;
  withNote?: boolean;
  size?: "xs" | "sm";
}) {
  return (
    <span className={cn("inline-flex flex-col items-end gap-1", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm border border-amber-tj/45 bg-amber-tj/12",
          "font-mono tracking-[0.22em] text-amber-tj uppercase",
          size === "xs" ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-[3px] text-[9px]",
        )}
        title="Illustrative data — not connected to live facility systems."
      >
        <span className="relative flex h-1 w-1">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-tj opacity-70" />
          <span className="relative inline-flex h-1 w-1 rounded-full bg-amber-tj" />
        </span>
        {label}
      </span>
      {withNote && (
        <span className="max-w-[16rem] text-right font-mono text-[9px] leading-relaxed tracking-[0.08em] text-silver/60 uppercase">
          Illustrative interface — not connected to facility sensors
        </span>
      )}
    </span>
  );
}

export function DemoNotice({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-amber-tj/30 bg-amber-tj/[0.07] px-4 py-3",
        className,
      )}
      role="note"
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-tj" aria-hidden />
      <p className="font-mono text-[10px] leading-relaxed tracking-[0.12em] text-amber-tj/85 uppercase">
        {children ?? "Simulation layer — illustrative values only. Replaced by live sensors when the facility feed is connected."}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status pill                                                                 */
/* -------------------------------------------------------------------------- */

const TONES = {
  cool: { dot: "bg-cool", text: "text-cool", ring: "border-cool/40 bg-cool/10", glow: "shadow-[0_0_14px_-4px_rgba(34,197,94,0.8)]" },
  ice: { dot: "bg-ice", text: "text-ice", ring: "border-ice/40 bg-ice/10", glow: "shadow-[0_0_14px_-4px_rgba(125,211,252,0.8)]" },
  amber: { dot: "bg-amber-tj", text: "text-amber-tj", ring: "border-amber-tj/40 bg-amber-tj/10", glow: "shadow-[0_0_14px_-4px_rgba(245,158,11,0.8)]" },
  danger: { dot: "bg-danger", text: "text-danger", ring: "border-danger/45 bg-danger/10", glow: "shadow-[0_0_14px_-4px_rgba(239,68,68,0.8)]" },
  silver: { dot: "bg-silver", text: "text-silver", ring: "border-silver/35 bg-silver/10", glow: "shadow-[0_0_14px_-4px_rgba(167,180,197,0.6)]" },
} as const;

export function StatusPill({
  status,
  className,
  pulse = true,
  size = "sm",
}: {
  status: string;
  className?: string;
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
}) {
  const reduced = useReducedMotion();
  const tone = TONES[STATUS_TONE[status] ?? "silver"];
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border font-mono tracking-[0.2em] uppercase",
        tone.ring,
        tone.text,
        size === "xs" && "px-1.5 py-0.5 text-[8px]",
        size === "sm" && "px-2 py-1 text-[9px]",
        size === "md" && "px-3 py-1.5 text-[10px]",
        className,
      )}
    >
      <span className={cn("relative flex h-1.5 w-1.5")}>
        {pulse && !reduced && (
          <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-70", tone.dot)} />
        )}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", tone.dot, tone.glow)} />
      </span>
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* HUD panel                                                                   */
/* -------------------------------------------------------------------------- */

export function HudPanel({
  children,
  className,
  title,
  code,
  badge,
  scanlines = true,
  corners = true,
  hover = true,
  as = "div",
}: {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  code?: string;
  badge?: React.ReactNode;
  scanlines?: boolean;
  corners?: boolean;
  hover?: boolean;
  as?: "div" | "section" | "aside" | "article";
}) {
  const Tag = motion[as] as typeof motion.div;

  return (
    <Tag
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: EASE.frost as never }}
      className={cn(
        "panel-hud group/hud relative overflow-hidden",
        scanlines && "scanlines",
        hover &&
          "transition-[border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-cyan-core/45 hover:shadow-[inset_0_0_34px_-12px_rgba(34,211,238,0.55),0_26px_60px_-32px_rgba(0,0,0,0.95)]",
        className,
      )}
    >
      {corners && (
        <>
          <span aria-hidden className="pointer-events-none absolute top-0 left-0 h-3 w-3 border-t border-l border-cyan-core/60" />
          <span aria-hidden className="pointer-events-none absolute top-0 right-0 h-3 w-3 border-t border-r border-cyan-core/60" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-cyan-core/60" />
          <span aria-hidden className="pointer-events-none absolute right-0 bottom-0 h-3 w-3 border-r border-b border-cyan-core/60" />
        </>
      )}

      {(title || code || badge) && (
        <div className="flex items-center justify-between gap-3 border-b border-ice/12 bg-navy/60 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {code && (
              <span className="shrink-0 font-mono text-[9px] tracking-[0.2em] text-cyan-core/80">{code}</span>
            )}
            {title && (
              <span className="truncate font-mono text-[10px] tracking-[0.24em] text-frost/85 uppercase">
                {title}
              </span>
            )}
          </div>
          {badge}
        </div>
      )}

      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/* Readouts                                                                    */
/* -------------------------------------------------------------------------- */

export function HudRow({
  label,
  value,
  tone = "frost",
  className,
  mono = true,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: "frost" | "ice" | "cyan" | "cool" | "amber" | "danger" | "silver";
  className?: string;
  mono?: boolean;
}) {
  const toneClass = {
    frost: "text-frost",
    ice: "text-ice",
    cyan: "text-cyan-core",
    cool: "text-cool",
    amber: "text-amber-tj",
    danger: "text-danger",
    silver: "text-silver",
  }[tone];

  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-ice/8 py-2 last:border-b-0",
        className,
      )}
    >
      <span className="font-mono text-[9px] tracking-[0.24em] text-silver/70 uppercase">{label}</span>
      <span
        className={cn(
          "text-right text-[11px] tracking-[0.14em] uppercase tabular",
          mono ? "font-mono" : "font-sans",
          toneClass,
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function Readout({
  label,
  value,
  unit,
  tone = "frost",
  size = "md",
  className,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  tone?: "frost" | "ice" | "cyan" | "cool" | "amber" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  hint?: string;
}) {
  const toneClass = {
    frost: "text-frost",
    ice: "text-ice",
    cyan: "text-cyan-core",
    cool: "text-cool",
    amber: "text-amber-tj",
    danger: "text-danger",
  }[tone];

  const valueSize = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-[2.1rem]",
  }[size];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-[9px] tracking-[0.26em] text-silver/65 uppercase">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={cn("font-display font-bold tabular", valueSize, toneClass)}>{value}</span>
        {unit && <span className={cn("font-mono text-[11px] tracking-wider", toneClass, "opacity-70")}>{unit}</span>}
      </span>
      {hint && <span className="font-mono text-[9px] tracking-[0.14em] text-silver/50 uppercase">{hint}</span>}
    </div>
  );
}

/** Signal strength bars — a small, alive detail on monitored zones. */
export function SignalBars({ level = 4, className }: { level?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-[2px]", className)} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[2px] rounded-[1px] transition-all duration-500",
            i <= level ? "bg-cyan-core" : "bg-ice/20",
          )}
          style={{ height: `${3 + i * 2}px` }}
        />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Alert strip                                                                 */
/* -------------------------------------------------------------------------- */

export function AlertStrip({
  severity = "WARNING",
  children,
  className,
}: {
  severity?: "INFO" | "WARNING" | "CRITICAL";
  children: React.ReactNode;
  className?: string;
}) {
  const tone =
    severity === "CRITICAL" ? "border-danger/40 bg-danger/10 text-danger" :
    severity === "WARNING" ? "border-amber-tj/40 bg-amber-tj/10 text-amber-tj" :
    "border-ice/25 bg-ice/8 text-ice";

  return (
    <div className={cn("flex items-center gap-3 rounded-md border px-4 py-2.5", tone, className)}>
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="font-mono text-[10px] tracking-[0.16em] uppercase">{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Marquee ticker                                                              */
/* -------------------------------------------------------------------------- */

export function Marquee({
  items,
  className,
  separator = "◆",
  reverse = false,
}: {
  items: React.ReactNode[];
  className?: string;
  separator?: string;
  reverse?: boolean;
}) {
  const reduced = useReducedMotion();
  const doubled = [...items, ...items];

  return (
    <div className={cn("marquee-host relative overflow-hidden", className)} aria-hidden>
      <div
        className="marquee-track items-center gap-8"
        style={reduced ? { animation: "none" } : reverse ? { animationDirection: "reverse" } : undefined}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-8">
            <span className="font-mono text-[10px] tracking-[0.32em] whitespace-nowrap text-silver/70 uppercase">
              {item}
            </span>
            <span className="text-[7px] text-cyan-core/50">{separator}</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-midnight to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-midnight to-transparent" />
    </div>
  );
}
