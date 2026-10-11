"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  AirVent,
  Droplets,
  Gauge,
  Layers,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { useRef } from "react";

import { useTemperature } from "@/components/atmosphere/TemperatureProvider";
import { DemoBadge } from "@/components/ui/Hud";
import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { useReducedMotion } from "@/hooks/use-motion";

/**
 * PRECISION COOLING (spec §18).
 *
 * A sticky cold-room cross-section on the left; the capability story scrolls
 * past it on the right. Each block retunes the diagram — insulation, air
 * movement, zoning, condensation, monitoring — and the chamber's light and
 * frost respond.
 *
 * Temperature claims stay honest: the target is always shown as CLIENT
 * CONFIGURED, and the illustrative reading carries a DEMO badge.
 */

const BLOCKS = [
  {
    key: "envelope",
    index: "01",
    icon: Layers,
    title: "Insulated envelope",
    body: "The chamber is a sealed, insulated envelope. Panel joints, door seals and the dock interface are all treated as part of the thermal system — because a cold room is only as good as its weakest seam.",
    points: ["Sealed panel joints", "Gasketed dock interface", "Vapour-checked envelope"],
    focus: 0,
  },
  {
    key: "air",
    index: "02",
    icon: Wind,
    title: "Engineered air movement",
    body: "Cold air is thrown the full length of the room and returned through a designed path, so there are no warm pockets sitting against the racking. Product cools evenly, not just at the front.",
    points: ["Full-length throw", "Designed return path", "Even product temperature"],
    focus: 1,
  },
  {
    key: "zoning",
    index: "03",
    icon: AirVent,
    title: "Zoned temperature profiles",
    body: "Each chamber runs its own profile. Chilled produce, deep-frozen protein and precision pharmaceuticals are not the same product and never share the same setpoint.",
    points: ["Independent zones", "Per-contract profile", "Category separation"],
    focus: 2,
  },
  {
    key: "condensation",
    index: "04",
    icon: Droplets,
    title: "Condensation & frost control",
    body: "Moisture is the enemy of frozen quality. Defrost cycles, drainage and humidity management keep ice where it belongs — on the coil, not on your product.",
    points: ["Scheduled defrost", "Managed drainage", "Humidity awareness"],
    focus: 3,
  },
  {
    key: "monitoring",
    index: "05",
    icon: Gauge,
    title: "Continuous monitoring",
    body: "Zone conditions and facility events are recorded continuously. Deviations raise an event, and the record is available in the client portal and the command centre.",
    points: ["Continuous logging", "Deviation events", "Portal visibility"],
    focus: 4,
  },
] as const;

export function PrecisionCooling() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 65%", "end 55%"],
  });

  const { temperature, frost } = useTemperature();

  // Which block is in focus, derived from scroll progress.
  const focus = useTransform(scrollYProgress, (p) =>
    Math.min(BLOCKS.length - 1, Math.max(0, Math.round(p * (BLOCKS.length - 1)))),
  );

  const coilGlow = useTransform(scrollYProgress, [0, 0.5, 1], [0.25, 0.85, 0.5]);
  const airSpeed = useTransform(scrollYProgress, [0.15, 0.45], [0.2, 1]);

  const display = temperature > 0 ? `+${temperature.toFixed(1)}` : temperature.toFixed(1);

  return (
    <section
      id="precision-cooling"
      className="relative isolate overflow-hidden bg-midnight py-24 sm:py-32"
      aria-label="Precision cooling"
    >
      <GhostIndex index="02" className="-top-2 right-2 lg:right-10" />

      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <Kicker index="02">Precision cooling</Kicker>
          <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
            A chamber is a
            <br />
            <span className="text-gradient-frost">machine, not a room.</span>
          </h2>
          <p className="mt-6 text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
            Insulation, air movement, zoning, condensation and monitoring are engineered together.
            Scroll to walk through the system.
          </p>
        </div>

        <div ref={containerRef} className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* -------------------- sticky cross-section -------------------- */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <div className="panel relative overflow-hidden rounded-2xl p-4 sm:p-6">
              <ColdRoomDiagram
                focus={focus}
                coilGlow={coilGlow}
                airSpeed={airSpeed}
                frost={frost}
                reduced={reduced}
              />

              {/* live readout strip */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ice/12 bg-navy/60 px-4 py-3">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="font-mono text-[8px] tracking-[0.24em] text-silver/55 uppercase">
                      Target
                    </div>
                    <div className="mt-1 font-mono text-[11px] tracking-[0.14em] text-ice uppercase">
                      Client configured
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[8px] tracking-[0.24em] text-silver/55 uppercase">
                      Chamber preview
                    </div>
                    <motion.div
                      key={display}
                      initial={reduced ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mt-0.5 font-display text-xl font-bold tabular text-frost"
                    >
                      {display}°C
                    </motion.div>
                  </div>
                </div>
                <DemoBadge withNote={false} />
              </div>
            </div>

            <div className="mt-4 hidden lg:block">
              <FrostFrame
                src="/assets/cold-room-aisle.jpg"
                alt="Frozen storage aisle with racked pallets under cold blue lighting"
                aspect="aspect-[21/8]"
                hud
                label="Frozen storage aisle"
                sublabel="Zone Z-04 · racked · tracked"
                sizes="(max-width:1024px) 0vw, 44vw"
              />
            </div>
          </div>

          {/* ---------------------- scrolling narrative ---------------------- */}
          <div className="flex flex-col">
            {BLOCKS.map((block) => {
              const Icon = block.icon;
              return (
                <Block key={block.key} block={block} Icon={Icon} />
              );
            })}

            {/* closing proof panel */}
            <motion.div
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
              className="panel-hud scanlines mt-6 rounded-2xl p-6 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-cyan-core" aria-hidden />
                  <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
                    What we commit to
                  </span>
                </div>
                <DemoBadge size="xs" label="Policy" />
              </div>
              <ul className="mt-6 space-y-3.5">
                {[
                  "Temperature profiles are agreed per contract — never assumed.",
                  "Where a figure is not confirmed, we say CONFIGURABLE rather than invent one.",
                  "Every zone condition and facility event is recorded and retrievable.",
                  "Simulated readings on this site are always badged as illustrative.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-cyan-core" aria-hidden />
                    <span className="text-sm leading-relaxed text-silver/85">{line}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Block({
  block,
  Icon,
}: {
  block: (typeof BLOCKS)[number];
  Icon: typeof Layers;
}) {
  return (
    <motion.article
      initial={{ opacity: 0.35, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.55, margin: "-20% 0px -20% 0px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="group/block relative border-l border-ice/12 py-10 pl-6 first:pt-0 sm:pl-9"
    >
      <motion.span
        className="absolute top-0 bottom-0 -left-px w-px origin-top bg-gradient-to-b from-cyan-core via-ice to-transparent"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: false, amount: 0.5, margin: "-20% 0px -20% 0px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        aria-hidden
      />
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-core/35 bg-cyan-core/10 text-cyan-core transition-all duration-500 group-hover/block:shadow-[0_0_22px_-6px_rgba(34,211,238,0.9)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="font-mono text-[9px] tracking-[0.28em] text-ice/70 uppercase">
          {block.index}
        </span>
      </div>
      <h3 className="mt-5 font-display text-[clamp(1.4rem,2.8vw,2rem)] leading-tight font-bold tracking-[-0.03em] text-frost">
        {block.title}
      </h3>
      <p className="mt-3.5 max-w-xl text-[0.94rem] leading-relaxed text-silver/78">{block.body}</p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {block.points.map((p) => (
          <li
            key={p}
            className="rounded-md border border-ice/14 bg-industrial/35 px-2.5 py-1.5 font-mono text-[9px] tracking-[0.16em] text-silver/80 uppercase transition-colors duration-400 group-hover/block:border-cyan-core/40 group-hover/block:text-ice"
          >
            {p}
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

/* -------------------------------------------------------------------------- */
/* Cold-room cross-section                                                     */
/* -------------------------------------------------------------------------- */

function ColdRoomDiagram({
  focus,
  coilGlow,
  airSpeed,
  frost,
  reduced,
}: {
  focus: import("framer-motion").MotionValue<number>;
  coilGlow: import("framer-motion").MotionValue<number>;
  airSpeed: import("framer-motion").MotionValue<number>;
  frost: number;
  reduced: boolean;
}) {
  const zones = [
    { x: 74, label: "CHILLED", code: "Z-02" },
    { x: 292, label: "FROZEN", code: "Z-04" },
    { x: 510, label: "PRECISION", code: "Z-05" },
  ];

  // Hooks must be called unconditionally and in a stable order — never in a map.
  const zoneStrokes = [
    useZoneStroke(focus, 0),
    useZoneStroke(focus, 1),
    useZoneStroke(focus, 2),
  ];

  return (
    <div className="relative overflow-hidden rounded-xl border border-ice/12 bg-[radial-gradient(120%_100%_at_50%_0%,#0d2138,#050914)]">
      <svg viewBox="0 0 700 420" className="h-auto w-full" role="img" aria-label="Cold room cross-section diagram">
        <defs>
          <linearGradient id="pc-panel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22374e" />
            <stop offset="50%" stopColor="#12212f" />
            <stop offset="100%" stopColor="#0a1420" />
          </linearGradient>
          <linearGradient id="pc-core" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="pc-air" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="pc-coil" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
          </radialGradient>
          <filter id="pc-blur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
        </defs>

        {/* ---- envelope: insulated sandwich panel ---- */}
        <rect x="34" y="34" width="632" height="330" rx="6" fill="url(#pc-panel)" />
        <rect x="34" y="34" width="632" height="330" rx="6" fill="url(#pc-core)" />
        {/* panel joints */}
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <rect x={34 + i * 70} y="34" width="2" height="330" fill="#050914" opacity="0.55" />
            <rect x={36 + i * 70} y="34" width="1" height="330" fill="#7DD3FC" opacity="0.1" />
          </g>
        ))}
        {/* envelope highlight — block 01 focus */}
        <motion.rect
          x="34"
          y="34"
          width="632"
          height="330"
          rx="6"
          fill="none"
          stroke="#22D3EE"
          strokeWidth="2"
          style={{ opacity: useOpacityFor(focus, 0) }}
        />

        {/* ---- interior ---- */}
        <rect x="52" y="52" width="596" height="294" rx="4" fill="#061019" />
        <rect x="52" y="52" width="596" height="294" rx="4" fill="#7DD3FC" opacity={0.03 + frost * 0.05} />

        {/* ---- ceiling evaporator / air cooler ---- */}
        <g>
          <rect x="248" y="60" width="204" height="46" rx="5" fill="#101e2c" stroke="#22D3EE" strokeOpacity="0.3" />
          {/* coil bank */}
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={256 + i * 15.6} y="68" width="9" height="22" rx="2" fill="#1c3247" />
          ))}
          <motion.ellipse
            cx="350"
            cy="80"
            rx="120"
            ry="34"
            fill="url(#pc-coil)"
            style={{ opacity: coilGlow }}
          />
          {/* fans */}
          {[278, 350, 422].map((cx, i) => (
            <g key={cx} transform={`translate(${cx} 96)`}>
              <circle r="9" fill="#0a1420" stroke="#2b3a4d" />
              <g className={reduced ? undefined : "wheel-spin"} style={{ transformOrigin: "0 0", animationDuration: `${1.5 + i * 0.35}s` }}>
                {[0, 90, 180, 270].map((d) => (
                  <path key={d} d="M0 0 L7 -3 A7.5 7.5 0 0 1 7 3 Z" fill="#4a5f78" transform={`rotate(${d})`} />
                ))}
              </g>
              <circle r="1.8" fill="#22D3EE" opacity="0.85" />
            </g>
          ))}
          <motion.rect
            x="248"
            y="60"
            width="204"
            height="46"
            rx="5"
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="2"
            style={{ opacity: useOpacityFor(focus, 1) }}
          />
        </g>

        {/* ---- airflow throw ---- */}
        <motion.g style={{ opacity: airSpeed }}>
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <motion.path
                d={`M${120 + row * 8} ${128 + row * 26} H ${580 - row * 8}`}
                stroke="url(#pc-air)"
                strokeWidth="1.6"
                fill="none"
                strokeDasharray="16 22"
                strokeLinecap="round"
                animate={reduced ? undefined : { strokeDashoffset: [0, -76] }}
                transition={{ duration: 2.6 + row * 0.5, repeat: Infinity, ease: "linear" }}
              />
              {/* arrowhead */}
              <path d={`M${580 - row * 8} ${128 + row * 26} l-9 -4 v8 Z`} fill="#7DD3FC" opacity="0.7" />
            </g>
          ))}
          {/* return path */}
          <motion.path
            d="M580 210 Q610 250 580 300 H120 Q90 250 120 210"
            stroke="#22D3EE"
            strokeOpacity="0.28"
            strokeWidth="1.4"
            fill="none"
            strokeDasharray="6 10"
            animate={reduced ? undefined : { strokeDashoffset: [0, 64] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>

        {/* ---- three zones ---- */}
        {zones.map((z, i) => (
          <g key={z.code}>
            <motion.rect
              x={z.x}
              y="228"
              width="184"
              height="104"
              rx="4"
              fill="#0a1826"
              stroke="#7DD3FC"
              style={{ strokeOpacity: zoneStrokes[i] }}
            />
            {/* racking */}
            {Array.from({ length: 4 }, (_, c) => (
              <g key={c}>
                <rect x={z.x + 12 + c * 42} y="242" width="34" height="76" rx="2" fill="#0e2033" />
                {[0, 1, 2].map((lv) => (
                  <rect
                    key={lv}
                    x={z.x + 15 + c * 42}
                    y={252 + lv * 24}
                    width="28"
                    height="16"
                    rx="1.5"
                    fill={lv === 1 ? "#17405c" : "#123049"}
                  />
                ))}
              </g>
            ))}
            <text
              x={z.x + 12}
              y="326"
              fill="#7DD3FC"
              fontSize="8.5"
              fontFamily="'JetBrains Mono Variable', monospace"
              letterSpacing="2.2"
              opacity="0.8"
            >
              {z.code} · {z.label}
            </text>
            {/* zone temperature pill */}
            <g transform={`translate(${z.x + 12} 214)`}>
              <rect width="86" height="16" rx="3" fill="#08141f" stroke="#22D3EE" strokeOpacity="0.3" />
              <circle cx="9" cy="8" r="2.4" fill="#22C55E" />
              <text
                x="18"
                y="11.5"
                fill="#A7B4C5"
                fontSize="7.5"
                fontFamily="'JetBrains Mono Variable', monospace"
                letterSpacing="1.4"
              >
                CONFIGURED
              </text>
            </g>
          </g>
        ))}

        {/* ---- condensation / frost on the walls ---- */}
        <g opacity={0.25 + frost * 0.6}>
          <rect x="52" y="52" width="596" height="294" rx="4" fill="none" stroke="#F4FAFF" strokeOpacity="0.16" strokeWidth="6" />
          {[
            [70, 90], [630, 120], [86, 300], [614, 268], [350, 62], [210, 336],
          ].map(([cx, cy], i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: reduced ? 0 : i * 0.1 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <FrostCrystal cx={cx} cy={cy} r={7 + (i % 3) * 3} />
            </motion.g>
          ))}
        </g>

        {/* ---- drainage / defrost (block 03) ---- */}
        <motion.g style={{ opacity: useOpacityFor(focus, 3) }}>
          <rect x="52" y="332" width="596" height="14" fill="#0b1622" />
          <path d="M350 346 v26 h58 v22" stroke="#22D3EE" strokeOpacity="0.65" strokeWidth="3" fill="none" />
          <circle cx="408" cy="394" r="9" fill="#0a1420" stroke="#22D3EE" strokeOpacity="0.6" />
          {!reduced && (
            <motion.circle
              cx="350"
              cy="346"
              r="3"
              fill="#7DD3FC"
              animate={{ cy: [346, 372], cx: [350, 408], opacity: [0, 1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeIn" }}
            />
          )}
        </motion.g>

        {/* ---- monitoring sensors (block 04) ---- */}
        <motion.g style={{ opacity: useOpacityFor(focus, 4) }}>
          {[
            [128, 168], [350, 168], [572, 168], [128, 292], [572, 292],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <motion.circle
                cx={cx}
                cy={cy}
                r="12"
                fill="none"
                stroke="#22C55E"
                strokeOpacity="0.5"
                animate={reduced ? undefined : { r: [7, 20], opacity: [0.75, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.34, ease: "easeOut" }}
              />
              <circle cx={cx} cy={cy} r="4" fill="#22C55E" />
              <circle cx={cx} cy={cy} r="1.6" fill="#F4FAFF" />
            </g>
          ))}
        </motion.g>

        {/* ---- floor line ---- */}
        <rect x="52" y="332" width="596" height="2" fill="#7DD3FC" opacity="0.22" />

        {/* ---- labels ---- */}
        <text x="34" y="24" fill="#A7B4C5" fontSize="9" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="3" opacity="0.7">
          CHAMBER CROSS-SECTION · ILLUSTRATIVE
        </text>
        <text x="666" y="24" textAnchor="end" fill="#7DD3FC" fontSize="9" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="3" opacity="0.7">
          SECTION A–A
        </text>
      </svg>

      {/* glass frost overlay */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: frost * 0.4,
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 48%, rgba(244,250,255,0.12) 84%, rgba(244,250,255,0.3) 100%)",
        }}
        aria-hidden
      />
    </div>
  );
}

/** Maps a motion value of the focused block index to an opacity for one block. */
function useOpacityFor(focus: import("framer-motion").MotionValue<number>, target: number) {
  return useTransform(focus, (v) => (Math.abs(v - target) < 0.55 ? 0.95 : 0.08));
}

function useZoneStroke(focus: import("framer-motion").MotionValue<number>, zoneIndex: number) {
  return useTransform(focus, (v) => (v >= 2 ? (zoneIndex === Math.round(v) - 2 ? 0.9 : 0.3) : 0.22));
}

function FrostCrystal({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g stroke="#F4FAFF" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round">
      {[0, 60, 120].map((deg) => (
        <line
          key={deg}
          x1={cx - Math.cos((deg * Math.PI) / 180) * r}
          y1={cy - Math.sin((deg * Math.PI) / 180) * r}
          x2={cx + Math.cos((deg * Math.PI) / 180) * r}
          y2={cy + Math.sin((deg * Math.PI) / 180) * r}
        />
      ))}
    </g>
  );
}

