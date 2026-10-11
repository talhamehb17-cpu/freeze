"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Crosshair, DoorOpen, ShieldCheck, Snowflake, ThermometerSnowflake, Truck } from "lucide-react";
import { useState } from "react";

import { EASE } from "@/animations/presets";
import { DemoBadge, DemoNotice, HudRow, StatusPill } from "@/components/ui/Hud";
import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { useReducedMotion } from "@/hooks/use-motion";
import { ZONES, type Zone } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * FACILITY EXPERIENCE (spec §21).
 *
 * An SVG floor plan. Hovering a zone highlights it and switches the pointer to
 * INSPECT; selecting one opens the information panel. Capacities are `null`
 * until the client confirms real figures, so the panel shows CONFIGURABLE
 * rather than a fabricated number.
 */

const KIND_META: Record<
  Zone["kind"],
  { accent: string; label: string; Icon: typeof Boxes }
> = {
  receiving: { accent: "#7DD3FC", label: "Receiving", Icon: DoorOpen },
  cold: { accent: "#38bdf8", label: "Chilled", Icon: ThermometerSnowflake },
  frozen: { accent: "#22D3EE", label: "Frozen", Icon: Snowflake },
  pharma: { accent: "#a5b4fc", label: "Precision", Icon: ShieldCheck },
  loading: { accent: "#F59E0B", label: "Loading", Icon: Truck },
  dispatch: { accent: "#22C55E", label: "Dispatch", Icon: Truck },
  security: { accent: "#F4FAFF", label: "Security", Icon: ShieldCheck },
};

export function FacilityMap({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(ZONES[3]!.id);

  const active = ZONES.find((z) => z.id === (hovered ?? selected)) ?? null;
  const selectedZone = ZONES.find((z) => z.id === selected) ?? ZONES[0]!;

  return (
    <section
      id="facility"
      className={cn("relative isolate overflow-hidden bg-midnight py-24 sm:py-32", className)}
      aria-label="Facility layout"
    >
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <GhostIndex index="04" className="-top-10 -left-4 hidden lg:block" />
            <Kicker index="04">The facility</Kicker>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
              Walk the floor
              <br />
              <span className="text-gradient-frost">before you store a pallet.</span>
            </h2>
            <p className="mt-6 text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
              Eight zones, one controlled envelope. Select any zone to see what it does and how it
              is monitored.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="panel-hud flex items-center gap-3 px-4 py-2.5">
              <Crosshair className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
              <span className="font-mono text-[9px] tracking-[0.22em] text-silver/75 uppercase">
                {active ? `${active.code} · ${active.name}` : "Select a zone"}
              </span>
            </div>
            <DemoBadge withNote />
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
          {/* ------------------------------ plan ------------------------------ */}
          <div className="panel relative overflow-hidden rounded-2xl p-3 sm:p-5">
            <div className="hud-grid-fine pointer-events-none absolute inset-0 opacity-40" aria-hidden />

            <svg
              viewBox="0 0 1000 600"
              className="relative h-auto w-full"
              role="group"
              aria-label="Facility floor plan — select a zone for details"
            >
              <defs>
                <linearGradient id="fm-shell" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12202f" />
                  <stop offset="100%" stopColor="#080f1a" />
                </linearGradient>
                <pattern id="fm-hatch" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#7DD3FC" strokeOpacity="0.18" strokeWidth="1.6" />
                </pattern>
                <filter id="fm-glow" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="9" />
                </filter>
              </defs>

              {/* building shell */}
              <rect x="20" y="36" width="960" height="530" rx="10" fill="url(#fm-shell)" />
              <rect
                x="20"
                y="36"
                width="960"
                height="530"
                rx="10"
                fill="none"
                stroke="#7DD3FC"
                strokeOpacity="0.28"
                strokeWidth="1.6"
              />
              {/* structural columns */}
              {Array.from({ length: 9 }, (_, i) => (
                <rect key={i} x={64 + i * 110} y="36" width="8" height="8" fill="#22D3EE" opacity="0.3" />
              ))}
              {Array.from({ length: 9 }, (_, i) => (
                <rect key={`b${i}`} x={64 + i * 110} y="558" width="8" height="8" fill="#22D3EE" opacity="0.3" />
              ))}

              {/* radar sweep */}
              {!reduced && (
                <motion.rect
                  x="20"
                  y="36"
                  width="70"
                  height="530"
                  fill="url(#fm-hatch)"
                  opacity="0.5"
                  animate={{ x: [20, 910, 20] }}
                  transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                />
              )}

              {/* zones */}
              {ZONES.map((zone) => {
                const meta = KIND_META[zone.kind];
                const isHover = hovered === zone.id;
                const isSelected = selected === zone.id;
                const emphasis = isHover || isSelected;

                return (
                  <g
                    key={zone.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`${zone.name}, ${meta.label} zone. ${zone.purpose}`}
                    aria-pressed={isSelected}
                    className="cursor-pointer outline-none"
                    onMouseEnter={() => setHovered(zone.id)}
                    onMouseLeave={() => setHovered((h) => (h === zone.id ? null : h))}
                    onFocus={() => setHovered(zone.id)}
                    onBlur={() => setHovered((h) => (h === zone.id ? null : h))}
                    onClick={() => setSelected(zone.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(zone.id);
                      }
                    }}
                  >
                    {/* glow underlay */}
                    <motion.rect
                      x={zone.rect.x}
                      y={zone.rect.y}
                      width={zone.rect.w}
                      height={zone.rect.h}
                      rx="6"
                      fill={meta.accent}
                      filter="url(#fm-glow)"
                      animate={{ opacity: emphasis ? 0.4 : 0.06 }}
                      transition={{ duration: 0.45, ease: EASE.frost as never }}
                    />
                    <motion.rect
                      x={zone.rect.x}
                      y={zone.rect.y}
                      width={zone.rect.w}
                      height={zone.rect.h}
                      rx="6"
                      fill="#0a1420"
                      stroke={meta.accent}
                      animate={{ fillOpacity: emphasis ? 0.92 : 0.72, strokeWidth: emphasis ? 2 : 1.1, strokeOpacity: emphasis ? 0.95 : 0.4 }}
                      transition={{ duration: 0.35, ease: EASE.frost as never }}
                    />
                    {/* interior racking hint for storage zones */}
                    {(zone.kind === "cold" || zone.kind === "frozen" || zone.kind === "pharma") && (
                      <g opacity={emphasis ? 0.55 : 0.28} style={{ transition: "opacity 400ms" }}>
                        {Array.from({ length: Math.max(2, Math.floor(zone.rect.w / 62)) }, (_, i) => (
                          <rect
                            key={i}
                            x={zone.rect.x + 18 + i * 62}
                            y={zone.rect.y + 46}
                            width="38"
                            height={zone.rect.h - 84}
                            rx="3"
                            fill={meta.accent}
                            fillOpacity="0.14"
                            stroke={meta.accent}
                            strokeOpacity="0.3"
                          />
                        ))}
                      </g>
                    )}
                    {/* dock doors */}
                    {(zone.kind === "loading" || zone.kind === "receiving") && (
                      <g>
                        {Array.from({ length: zone.kind === "loading" ? 3 : 2 }, (_, i) => (
                          <rect
                            key={i}
                            x={zone.rect.x + 24 + i * 62}
                            y={zone.rect.y + zone.rect.h - 8}
                            width="42"
                            height="8"
                            rx="2"
                            fill={meta.accent}
                            opacity={emphasis ? 0.95 : 0.5}
                          />
                        ))}
                      </g>
                    )}

                    {/* labels */}
                    <text
                      x={zone.rect.x + 16}
                      y={zone.rect.y + 26}
                      fill={emphasis ? "#F4FAFF" : "#A7B4C5"}
                      fontSize="12.5"
                      fontFamily="'Space Grotesk Variable', sans-serif"
                      fontWeight="700"
                      letterSpacing="1.4"
                      style={{ transition: "fill 300ms", pointerEvents: "none" }}
                    >
                      {zone.name.toUpperCase()}
                    </text>
                    <text
                      x={zone.rect.x + 16}
                      y={zone.rect.y + 42}
                      fill={meta.accent}
                      fontSize="9.5"
                      fontFamily="'JetBrains Mono Variable', monospace"
                      letterSpacing="2.4"
                      opacity={emphasis ? 0.95 : 0.6}
                      style={{ pointerEvents: "none" }}
                    >
                      {zone.code} · {meta.label.toUpperCase()}
                    </text>

                    {/* status dot */}
                    <circle
                      cx={zone.rect.x + zone.rect.w - 18}
                      cy={zone.rect.y + 20}
                      r="4"
                      fill={zone.status === "MONITORED" ? "#22C55E" : "#7DD3FC"}
                      opacity={emphasis ? 1 : 0.6}
                    />
                    {emphasis && !reduced && (
                      <motion.circle
                        cx={zone.rect.x + zone.rect.w - 18}
                        cy={zone.rect.y + 20}
                        r="4"
                        fill="none"
                        stroke="#22C55E"
                        initial={{ r: 4, opacity: 0.8 }}
                        animate={{ r: 16, opacity: 0 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                  </g>
                );
              })}

              {/* apron / yard */}
              <g opacity="0.5">
                <rect x="20" y="576" width="960" height="18" rx="4" fill="#0a1420" />
                {Array.from({ length: 26 }, (_, i) => (
                  <rect key={i} x={30 + i * 36} y="582" width="18" height="6" rx="1" fill="#F59E0B" opacity="0.35" />
                ))}
              </g>

              <text x="20" y="24" fill="#A7B4C5" fontSize="10" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="3" opacity="0.65">
                FLOOR PLAN · LEVEL 01 · ILLUSTRATIVE LAYOUT
              </text>
              <text x="980" y="24" textAnchor="end" fill="#7DD3FC" fontSize="10" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="3" opacity="0.65">
                UUAYRIJ · BAGHDAD
              </text>
            </svg>
          </div>

          {/* --------------------------- info panel --------------------------- */}
          <div className="flex flex-col gap-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedZone.id}
                initial={{ opacity: 0, y: reduced ? 0 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -12 }}
                transition={{ duration: 0.5, ease: EASE.frost as never }}
                className="panel-hud scanlines overflow-hidden rounded-2xl"
              >
                <div
                  className="flex items-center justify-between gap-3 border-b px-5 py-3.5"
                  style={{
                    borderColor: `${KIND_META[selectedZone.kind].accent}26`,
                    backgroundColor: `${KIND_META[selectedZone.kind].accent}0d`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    {(() => {
                      const Icon = KIND_META[selectedZone.kind].Icon;
                      return (
                        <Icon
                          className="h-4 w-4"
                          style={{ color: KIND_META[selectedZone.kind].accent }}
                          aria-hidden
                        />
                      );
                    })()}
                    <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
                      {selectedZone.code}
                    </span>
                  </div>
                  <StatusPill status={selectedZone.status === "MONITORED" ? "ACTIVE" : "STABLE"} size="xs" />
                </div>

                <div className="px-5 py-5">
                  <h3 className="font-display text-2xl leading-none font-bold tracking-[-0.03em] text-frost">
                    {selectedZone.name}
                  </h3>
                  <p className="mt-3.5 text-[0.88rem] leading-relaxed text-silver/80">
                    {selectedZone.purpose}
                  </p>

                  <div className="mt-5">
                    <HudRow label="Category" value={KIND_META[selectedZone.kind].label} tone="ice" />
                    <HudRow label="Temperature" value={selectedZone.temperature} tone="cyan" />
                    <HudRow
                      label="Capacity"
                      value={
                        selectedZone.capacity
                          ? `${selectedZone.capacity.value} ${selectedZone.capacity.unit}`
                          : "CONFIGURABLE"
                      }
                      tone={selectedZone.capacity ? "frost" : "amber"}
                    />
                    <HudRow
                      label="Monitoring"
                      value={selectedZone.monitored ? "ACTIVE" : "OFF"}
                      tone={selectedZone.monitored ? "cool" : "silver"}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* zone quick list */}
            <div className="panel rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <span className="font-mono text-[9px] tracking-[0.26em] text-silver/60 uppercase">
                  All zones
                </span>
                <span className="font-mono text-[9px] tracking-[0.2em] text-cyan-core uppercase">
                  {ZONES.length}
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-1.5">
                {ZONES.map((z) => {
                  const on = z.id === selected;
                  return (
                    <li key={z.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(z.id)}
                        onMouseEnter={() => setHovered(z.id)}
                        onMouseLeave={() => setHovered((h) => (h === z.id ? null : h))}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-all duration-300",
                          on
                            ? "border-cyan-core/60 bg-cyan-core/12"
                            : "border-ice/10 bg-navy/40 hover:border-ice/30 hover:bg-industrial/40",
                        )}
                        aria-pressed={on}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: KIND_META[z.kind].accent,
                            boxShadow: on ? `0 0 10px 1px ${KIND_META[z.kind].accent}` : undefined,
                          }}
                        />
                        <span className="truncate font-mono text-[9px] tracking-[0.14em] text-silver/85 uppercase">
                          {z.code} {z.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <DemoNotice />

            <FrostFrame
              src="/assets/loading-dock.jpg"
              alt="Open dock door with cold fog rolling onto the loading bay"
              aspect="aspect-[16/9]"
              hud
              label="Dock interface"
              sublabel="Sealed transfer · no ambient exposure"
              sizes="(max-width:1024px) 100vw, 34vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
