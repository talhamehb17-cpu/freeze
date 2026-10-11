"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { Snowflake, ThermometerSnowflake } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  TEMP_MAX,
  TEMP_MIN,
  useTemperature,
} from "@/components/atmosphere/TemperatureProvider";
import { useFreeze } from "@/components/ui/FreezeOverlay";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn, mapRange } from "@/lib/utils";

/**
 * Temperature controller (spec §13).
 *
 * Drag the thermal column and the ENTIRE room responds: frost density, mist
 * volume, light colour and every HUD readout follow one value.
 *
 * ⚠ This is a visual interaction. It does not control refrigeration hardware
 * and the interface says so.
 */

const TICKS = [10, 0, -10, -20, -30] as const;

function labelFor(temp: number) {
  if (temp >= 8) return "CHILLED";
  if (temp >= 2) return "COOL";
  if (temp >= -4) return "FROST LINE";
  if (temp >= -14) return "FREEZING";
  if (temp >= -24) return "DEEP FROZEN";
  return "CRYOGENIC";
}

export function TemperatureController({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { temperature, setTemperature, frost, setEngaged, engaged } = useTemperature();
  const { freeze } = useFreeze();
  const reduced = useReducedMotion();

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const lastFreeze = useRef(0);

  // Normalised 0(warm) → 1(cold) position of the handle.
  const handleX = useMotionValue(0);
  const pct = mapRange(temperature, TEMP_MAX, TEMP_MIN, 0, 1);

  useEffect(() => {
    handleX.set(pct);
  }, [pct, handleX]);

  const glow = useTransform(handleX, (v) => `${Math.round(v * 100)}%`);

  const applyFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      setTemperature(TEMP_MAX - t * (TEMP_MAX - TEMP_MIN));
    },
    [setTemperature],
  );

  const onPointerDown = (event: React.PointerEvent) => {
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    setDragging(true);
    setEngaged(true);
    applyFromClientX(event.clientX);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragging) return;
    applyFromClientX(event.clientX);
    // Fire a frost burst when crossing into deep freeze — but never spam it.
    if (!reduced && temperature <= -24 && Date.now() - lastFreeze.current > 4200) {
      lastFreeze.current = Date.now();
      freeze({ x: event.clientX, y: event.clientY });
    }
  };

  const endDrag = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging]);

  const display = temperature > 0 ? `+${temperature.toFixed(1)}` : temperature.toFixed(1);

  return (
    <div
      className={cn(
        "panel-hud relative select-none overflow-hidden px-4 py-3.5 sm:px-5",
        compact && "px-3 py-2.5",
        className,
      )}
      data-cursor="drag"
      data-cursor-label="DRAG"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ThermometerSnowflake className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
          <span className="font-mono text-[9px] tracking-[0.26em] text-ice/80 uppercase">
            Thermal Preview
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <motion.span
            key={display}
            initial={reduced ? false : { opacity: 0, y: -6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "font-display text-xl font-bold tabular sm:text-2xl",
              frost > 0.72 ? "text-frost" : frost > 0.4 ? "text-ice" : "text-silver",
            )}
          >
            {display}°C
          </motion.span>
        </div>
      </div>

      {/* track */}
      <div
        ref={trackRef}
        className={cn("group/trk relative mt-3.5 h-9 cursor-ew-resize touch-none", dragging && "cursor-grabbing")}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* rail */}
        <div className="absolute top-1/2 right-0 left-0 h-[3px] -translate-y-1/2 rounded-full bg-steel/80" />
        {/* cold fill */}
        <motion.div
          className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full"
          style={{
            width: glow,
            background: "linear-gradient(90deg,#64748b 0%,#7DD3FC 52%,#22D3EE 100%)",
            boxShadow: "0 0 14px -2px rgba(34,211,238,0.85)",
          }}
        />
        {/* ticks */}
        {TICKS.map((t) => {
          const x = mapRange(t, TEMP_MAX, TEMP_MIN, 0, 1) * 100;
          const active = temperature <= t + 0.5;
          return (
            <div key={t} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%` }}>
              <span
                className={cn(
                  "block h-2.5 w-px transition-colors duration-300",
                  active ? "bg-cyan-core" : "bg-ice/25",
                )}
              />
              <span
                className={cn(
                  "absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[8px] tracking-[0.14em] whitespace-nowrap transition-colors duration-300",
                  active ? "text-ice" : "text-silver/45",
                )}
              >
                {t > 0 ? `+${t}` : t}°
              </span>
            </div>
          );
        })}
        {/* handle */}
        <motion.div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: glow }}
        >
          <span
            className={cn(
              "relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition-[box-shadow,border-color] duration-300",
              dragging
                ? "border-frost bg-cyan-core shadow-[0_0_0_6px_rgba(34,211,238,0.22),0_0_28px_rgba(34,211,238,0.95)]"
                : "border-cyan-core bg-navy shadow-[0_0_0_4px_rgba(34,211,238,0.12),0_0_18px_rgba(34,211,238,0.6)]",
            )}
          >
            <Snowflake className="h-2.5 w-2.5 text-frost" aria-hidden />
            {!reduced && dragging && (
              <span className="absolute inset-0 animate-pulse-ring rounded-full border border-frost/70" />
            )}
          </span>
        </motion.div>

        {/* accessible fallback — keyboard users get a real range input */}
        <input
          type="range"
          min={TEMP_MIN}
          max={TEMP_MAX}
          step={0.5}
          value={temperature}
          onChange={(e) => {
            setEngaged(true);
            setTemperature(Number(e.target.value));
          }}
          aria-label="Preview temperature — visual simulation only"
          aria-valuetext={`${display} degrees Celsius, ${labelFor(temperature)}`}
          className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] tracking-[0.22em] text-silver/70 uppercase">
          {labelFor(temperature)}
        </span>
        <span className="font-mono text-[8px] tracking-[0.18em] text-amber-tj/75 uppercase">
          Visual simulation · not a control system
        </span>
      </div>

      {!compact && (
        <button
          type="button"
          onClick={(event) => {
            setEngaged(true);
            setTemperature(-30);
            if (!reduced) freeze({ x: event.clientX, y: event.clientY });
          }}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-ice/22 bg-industrial/50 px-3 py-2",
            "font-mono text-[9px] tracking-[0.26em] text-ice uppercase",
            "transition-all duration-300 hover:border-cyan-core/70 hover:bg-cyan-core/12 hover:text-frost",
            engaged && "border-cyan-core/40",
          )}
          data-cursor="active"
          data-cursor-label="FREEZE"
        >
          <Snowflake className="h-3 w-3" aria-hidden />
          Trigger frost sequence
        </button>
      )}
    </div>
  );
}
