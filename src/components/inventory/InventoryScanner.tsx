"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Barcode, CheckCircle2, ScanLine, Boxes as BoxesIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { EASE } from "@/animations/presets";
import { DemoBadge, DemoNotice, HudRow, StatusPill } from "@/components/ui/Hud";
import { GhostIndex, Kicker, ScrambleText } from "@/components/ui/Typography";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { useEnteredView } from "@/hooks/use-entered-view";
import { useReducedMotion } from "@/hooks/use-motion";
import type { InventoryView } from "@/types";
import { cn } from "@/lib/utils";

/**
 * INVENTORY EXPERIENCE (spec §22).
 *
 * A WMS-style record with a real scanning beat: a barcode line sweeps across
 * the item, the record decodes field by field, then ITEM VERIFIED lands.
 * The whole thing is labelled a demonstration — it is not wired to a scanner.
 */

type ScanPhase = "idle" | "scanning" | "verified";

export function InventoryScanner({
  items,
  className,
}: {
  items: InventoryView[];
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { ref, entered } = useEnteredView<HTMLDivElement>({ threshold: 0.3 });
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<ScanPhase>("idle");

  const item = items[index % items.length]!;

  const runScan = useCallback(() => {
    setPhase("scanning");
    const verifyAt = reduced ? 300 : 1900;
    window.setTimeout(() => setPhase("verified"), verifyAt);
    window.setTimeout(
      () => {
        setPhase("idle");
        setIndex((i) => (i + 1) % items.length);
      },
      verifyAt + (reduced ? 900 : 2600),
    );
  }, [items.length, reduced]);

  // Kick off once the section is actually on screen.
  useEffect(() => {
    if (!entered) return;
    runScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entered]);

  const decoded = phase !== "idle";

  return (
    <section
      id="inventory"
      className={cn("relative isolate overflow-hidden bg-midnight py-24 sm:py-32", className)}
      aria-label="Inventory tracking"
    >
      <div ref={ref} className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <GhostIndex index="05" className="-top-10 -left-4 hidden lg:block" />
            <Kicker index="05">Inventory</Kicker>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
              Every pallet
              <br />
              <span className="text-gradient-frost">stays addressable.</span>
            </h2>
            <p className="mt-6 text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
              Batch, product, zone and location are bound together at intake and travel with the
              item until it is released at the gate.
            </p>
          </div>
          <DemoBadge withNote />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
          {/* ------------------------- the scan stage ------------------------- */}
          <div className="panel relative overflow-hidden rounded-2xl p-5 sm:p-7">
            <div className="hud-grid-fine pointer-events-none absolute inset-0 opacity-30" aria-hidden />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Barcode className="h-4 w-4 text-cyan-core" aria-hidden />
                <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
                  Scan station
                </span>
              </div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3, ease: EASE.frost as never }}
                >
                  {phase === "verified" ? (
                    <StatusPill status="STABLE" size="xs" />
                  ) : phase === "scanning" ? (
                    <span className="font-mono text-[9px] tracking-[0.24em] text-amber-tj uppercase">
                      Scanning…
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] tracking-[0.24em] text-silver/50 uppercase">
                      Standby
                    </span>
                  )}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* pallet visual */}
            <div
              className="relative mt-6 overflow-hidden rounded-xl border border-ice/14 bg-[radial-gradient(120%_100%_at_50%_0%,#0d2138,#050914)]"
              data-cursor="inspect"
              data-cursor-label="INSPECT"
            >
              <svg viewBox="0 0 420 210" className="h-auto w-full" role="img" aria-label={`Pallet ${item.batch}`}>
                <defs>
                  <linearGradient id="inv-box2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1b3348" />
                    <stop offset="100%" stopColor="#0c1a28" />
                  </linearGradient>
                  <linearGradient id="inv-scan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
                    <stop offset="50%" stopColor="#F4FAFF" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                  </linearGradient>
                  <filter id="inv-glow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="6" />
                  </filter>
                </defs>

                {/* pallet base */}
                <rect x="66" y="168" width="288" height="14" rx="3" fill="#2a2118" />
                {[92, 196, 300].map((x) => (
                  <rect key={x} x={x} y="172" width="26" height="10" rx="2" fill="#0a0f18" opacity="0.7" />
                ))}

                {/* cartons */}
                {[0, 1, 2].map((row) =>
                  [0, 1, 2].map((col) => (
                    <g key={`${row}-${col}`}>
                      <rect
                        x={80 + col * 90}
                        y={72 + row * 32}
                        width="82"
                        height="30"
                        rx="3"
                        fill="url(#inv-box2)"
                        stroke="#7DD3FC"
                        strokeOpacity="0.22"
                      />
                      <rect x={80 + col * 90} y={85 + row * 32} width="82" height="1.4" fill="#7DD3FC" opacity="0.16" />
                    </g>
                  )),
                )}
                <rect x="80" y="40" width="262" height="30" rx="3" fill="url(#inv-box2)" stroke="#7DD3FC" strokeOpacity="0.22" />

                {/* wrap film */}
                <rect x="70" y="36" width="282" height="134" rx="4" fill="#F4FAFF" opacity="0.035" />

                {/* label */}
                <g>
                  <rect x="284" y="112" width="66" height="42" rx="3" fill="#F4FAFF" opacity="0.94" />
                  {Array.from({ length: 16 }, (_, i) => (
                    <rect
                      key={i}
                      x={290 + i * 3.6}
                      y="118"
                      width={i % 3 === 0 ? 2.1 : 1.1}
                      height="22"
                      fill="#050914"
                    />
                  ))}
                  <text
                    x="317"
                    y="149"
                    textAnchor="middle"
                    fill="#050914"
                    fontSize="7"
                    fontFamily="'JetBrains Mono Variable', monospace"
                    letterSpacing="0.6"
                  >
                    {item.batch}
                  </text>
                </g>

                {/* scan beam */}
                {!reduced && phase === "scanning" && (
                  <motion.g
                    initial={{ x: -60, opacity: 0 }}
                    animate={{ x: [ -60, 420 ], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.7, ease: "easeInOut", times: [0, 0.12, 0.88, 1] }}
                  >
                    <rect x="0" y="24" width="3" height="168" fill="url(#inv-scan)" />
                    <rect x="-14" y="24" width="31" height="168" fill="#22D3EE" opacity="0.12" filter="url(#inv-glow)" />
                  </motion.g>
                )}

                {/* verified frame */}
                <AnimatePresence>
                  {phase === "verified" && (
                    <motion.rect
                      x="62"
                      y="30"
                      width="296"
                      height="152"
                      rx="6"
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="2"
                      initial={{ opacity: 0, pathLength: 0 }}
                      animate={{ opacity: 1, pathLength: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: EASE.frost as never }}
                    />
                  )}
                </AnimatePresence>
              </svg>

              {/* corner brackets */}
              {(["top-2.5 left-2.5 border-t border-l", "top-2.5 right-2.5 border-t border-r", "bottom-2.5 left-2.5 border-b border-l", "bottom-2.5 right-2.5 border-b border-r"] as const).map((p) => (
                <span key={p} aria-hidden className={cn("pointer-events-none absolute h-5 w-5 border-cyan-core/50", p)} />
              ))}

              {/* verified stamp */}
              <AnimatePresence>
                {phase === "verified" && (
                  <motion.div
                    initial={{ opacity: 0, scale: reduced ? 1 : 0.86, filter: reduced ? "none" : "blur(8px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.55, ease: EASE.snap as never }}
                    className="absolute inset-x-0 bottom-4 flex justify-center"
                  >
                    <span className="flex items-center gap-2 rounded-full border border-cool/50 bg-cool/14 px-4 py-1.5 font-mono text-[10px] tracking-[0.26em] text-cool uppercase backdrop-blur-md">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      Item verified
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={runScan}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-lg border border-ice/20 bg-industrial/45 px-4 py-3 font-mono text-[10px] tracking-[0.24em] text-ice uppercase transition-all duration-300 hover:border-cyan-core/65 hover:text-frost"
              data-cursor="active"
              data-cursor-label="SCAN"
            >
              <ScanLine className="h-3.5 w-3.5" aria-hidden />
              {phase === "scanning" ? "Scanning" : "Run scan"}
            </button>
          </div>

          {/* ---------------------------- the record ---------------------------- */}
          <div className="flex flex-col gap-5">
            <div className="panel-hud scanlines overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-ice/12 bg-navy/70 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <BoxesIcon className="h-4 w-4 text-cyan-core" aria-hidden />
                  <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
                    Batch record
                  </span>
                </div>
                <DemoBadge size="xs" />
              </div>

              <div className="px-5 py-5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[9px] tracking-[0.26em] text-silver/60 uppercase">
                    Batch
                  </span>
                  <span className="font-display text-[1.7rem] leading-none font-bold tracking-[0.02em] text-frost tabular">
                    {decoded ? (
                      <ScrambleText text={item.batch} speed={28} trigger="mount" />
                    ) : (
                      <span className="text-silver/30">········</span>
                    )}
                  </span>
                </div>

                <div className="mt-5">
                  <DecodeRow label="Product" value={item.productName} on={decoded} delay={0.1} />
                  <DecodeRow label="Category" value={item.product} on={decoded} delay={0.18} />
                  <DecodeRow label="Zone" value={item.zone} on={decoded} delay={0.26} />
                  <DecodeRow label="Location" value={item.location} on={decoded} delay={0.34} />
                  <DecodeRow
                    label="Quantity"
                    value={`${item.quantity} ${item.unit.toLowerCase()}`}
                    on={decoded}
                    delay={0.42}
                  />
                  <DecodeRow label="Arrived" value={new Date(item.arrivedAt).toUTCString().slice(5, 22)} on={decoded} delay={0.5} />
                </div>

                <div className="mt-5 border-t border-ice/10 pt-4">
                  <HudRow label="Status" value={<StatusPill status={item.status} size="xs" />} />
                  <HudRow label="Tracking" value={item.tracking} tone={item.tracking === "ACTIVE" ? "cool" : "silver"} />
                  <HudRow label="Temperature" value={item.temperature} tone="cyan" />
                </div>
              </div>
            </div>

            <FrostFrame
              src="/assets/team-cold-gear.jpg"
              alt="Operator in insulated cold-store gear using a handheld barcode scanner"
              aspect="aspect-[16/9]"
              hud
              label="Handheld verification"
              sublabel="Batch bound to location at intake"
              sizes="(max-width:1024px) 100vw, 46vw"
            />

            <DemoNotice>
              This scanning sequence is a visual demonstration. It is not connected to inventory
              hardware — when a scanner feed is available the same UI is driven by real records.
            </DemoNotice>
          </div>
        </div>
      </div>
    </section>
  );
}

function DecodeRow({
  label,
  value,
  on,
  delay,
}: {
  label: string;
  value: string;
  on: boolean;
  delay: number;
}) {
  const reduced = useReducedMotion();
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-ice/8 py-2.5 last:border-b-0">
      <span className="font-mono text-[9px] tracking-[0.24em] text-silver/60 uppercase">{label}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${value}-${on}`}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, filter: "blur(5px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, delay: on ? delay : 0, ease: EASE.frost as never }}
          className={cn(
            "text-right font-mono text-[11px] tracking-[0.14em] uppercase",
            on ? "text-frost" : "text-silver/25",
          )}
        >
          {on ? value : "············"}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
