"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, ClipboardCheck, PackageCheck, Snowflake, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { EASE } from "@/animations/presets";
import { TruckGlyph } from "@/components/hero/AnimatedTruck";
import { DemoBadge, StatusPill } from "@/components/ui/Hud";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { ROUTE_STEPS } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * LOGISTICS EXPERIENCE (spec §24).
 *
 * A stylised regional map. The route draws itself as you scroll and the truck
 * is placed on the path with `getPointAtLength`, so the vehicle and the line
 * are always exactly in sync — no guessed offsets, no keyframe drift.
 *
 * The map is explicitly labelled STYLISED / NOT TO SCALE. We make no claim
 * about delivery coverage beyond what the client has confirmed.
 */

const ROUTE_D =
  "M110,452 C152,418 206,392 246,356 C286,320 340,320 390,300 C440,280 480,258 520,232 C560,206 620,182 664,146";

interface RouteNode {
  x: number;
  y: number;
  key: string;
}

const NODES: RouteNode[] = [
  { x: 110, y: 452, key: "receive" },
  { x: 246, y: 356, key: "store" },
  { x: 390, y: 300, key: "load" },
  { x: 520, y: 232, key: "check" },
  { x: 664, y: 146, key: "dispatch" },
];

const STEP_ICONS = [PackageCheck, Snowflake, Truck, ClipboardCheck, CheckCircle2] as const;

/** Stylised landmass — abstract, deliberately not a precise border tracing. */
const LAND =
  "M96,96 L250,64 L420,72 L556,52 L676,96 L716,196 L690,300 L640,392 L556,470 L430,506 L300,494 L188,438 L120,340 L84,224 Z";

const RIVERS = [
  "M210,72 C240,160 268,224 300,300 C326,362 352,420 386,494",
  "M420,64 C432,140 452,206 470,268 C492,344 508,420 528,500",
];

export function LogisticsRoute({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 78%", "end 42%"],
  });

  const [truck, setTruck] = useState({ x: NODES[0].x, y: NODES[0].y, angle: -35 });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const update = (p: number) => {
      const total = path.getTotalLength();
      const clamped = Math.min(1, Math.max(0, p));
      const here = path.getPointAtLength(total * clamped);
      const ahead = path.getPointAtLength(Math.min(total, total * clamped + 2));
      const angle = (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI;
      setTruck({ x: here.x, y: here.y, angle });
      setActiveStep(Math.min(NODES.length - 1, Math.round(clamped * (NODES.length - 1))));
    };

    update(scrollYProgress.get());
    return scrollYProgress.on("change", update);
  }, [scrollYProgress]);

  const dashOffset = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const labelOpacity = useTransform(scrollYProgress, (p) => 0.35 + p * 0.65);

  return (
    <section
      id="logistics"
      className={cn("relative isolate overflow-hidden bg-midnight py-24 sm:py-32", className)}
      aria-label="Cold chain logistics route"
    >
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <GhostIndex index="07" className="-top-10 -left-4 hidden lg:block" />
            <Kicker index="07">Logistics</Kicker>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
              From the dock
              <br />
              <span className="text-gradient-frost">to the release point.</span>
            </h2>
            <p className="mt-6 text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
              Receive, store, load, check, dispatch. Each handover is documented so the chain of
              custody never has a gap in it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status="IN_TRANSIT" />
            <DemoBadge withNote />
          </div>
        </div>

        <div ref={sectionRef} className="mt-12 grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:gap-8">
          {/* ------------------------------- map ------------------------------- */}
          <div className="panel relative overflow-hidden rounded-2xl p-3 sm:p-5">
            <div className="hud-grid-fine pointer-events-none absolute inset-0 opacity-30" aria-hidden />

            <svg
              viewBox="0 0 800 560"
              className="relative h-auto w-full"
              role="img"
              aria-label="Stylised regional map showing the receive, store, load, check and dispatch route"
            >
              <defs>
                <linearGradient id="lr-land" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0e1c2c" />
                  <stop offset="100%" stopColor="#070e19" />
                </linearGradient>
                <linearGradient id="lr-route" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="55%" stopColor="#7DD3FC" />
                  <stop offset="100%" stopColor="#F4FAFF" />
                </linearGradient>
                <filter id="lr-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
                <radialGradient id="lr-city" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* graticule */}
              <g opacity="0.18">
                {Array.from({ length: 9 }, (_, i) => (
                  <line key={`h${i}`} x1="0" y1={40 + i * 60} x2="800" y2={40 + i * 60} stroke="#7DD3FC" strokeWidth="0.6" />
                ))}
                {Array.from({ length: 13 }, (_, i) => (
                  <line key={`v${i}`} x1={40 + i * 60} y1="0" x2={40 + i * 60} y2="560" stroke="#7DD3FC" strokeWidth="0.6" />
                ))}
              </g>

              {/* landmass */}
              <path d={LAND} fill="url(#lr-land)" stroke="#7DD3FC" strokeOpacity="0.24" strokeWidth="1.4" />
              <path d={LAND} fill="none" stroke="#22D3EE" strokeOpacity="0.12" strokeWidth="6" filter="url(#lr-glow)" />

              {/* rivers */}
              {RIVERS.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="#22D3EE"
                  strokeOpacity="0.34"
                  strokeWidth={i === 0 ? 3 : 2.2}
                  strokeLinecap="round"
                />
              ))}
              <text x="316" y="212" fill="#22D3EE" fontSize="9" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="2.4" opacity="0.55" transform="rotate(62 316 212)">
                TIGRIS
              </text>

              {/* city glow */}
              <circle cx="430" cy="252" r="86" fill="url(#lr-city)" />
              <circle cx="430" cy="252" r="5" fill="#F4FAFF" />
              <circle cx="430" cy="252" r="12" fill="none" stroke="#7DD3FC" strokeOpacity="0.5" />
              {!reduced && (
                <motion.circle
                  cx="430"
                  cy="252"
                  r="12"
                  fill="none"
                  stroke="#7DD3FC"
                  animate={{ r: [12, 44], opacity: [0.55, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <text x="452" y="248" fill="#F4FAFF" fontSize="13" fontFamily="'Space Grotesk Variable', sans-serif" fontWeight="700" letterSpacing="2.4">
                BAGHDAD
              </text>
              <text x="452" y="264" fill="#A7B4C5" fontSize="8.5" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="2">
                33.31°N 44.36°E
              </text>

              {/* facility marker */}
              <g transform="translate(110 452)">
                <polygon points="0,-15 13,-7.5 13,7.5 0,15 -13,7.5 -13,-7.5" fill="#081426" stroke="#22D3EE" strokeWidth="1.6" />
                <g stroke="#7DD3FC" strokeWidth="1.4" strokeLinecap="round">
                  <line x1="-6" y1="0" x2="6" y2="0" />
                  <line x1="-3" y1="-5.2" x2="3" y2="5.2" />
                  <line x1="3" y1="-5.2" x2="-3" y2="5.2" />
                </g>
                <text x="-16" y="34" textAnchor="middle" fill="#7DD3FC" fontSize="9" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="2">
                  UUAYRIJ FACILITY
                </text>
              </g>

              {/* route — base, drawn, glow */}
              <path d={ROUTE_D} fill="none" stroke="#1e2f47" strokeWidth="5" strokeLinecap="round" />
              <motion.path
                ref={pathRef}
                d={ROUTE_D}
                fill="none"
                stroke="url(#lr-route)"
                strokeWidth="2.6"
                strokeLinecap="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: reduced ? 0 : dashOffset,
                  opacity: labelOpacity,
                }}
              />
              <path d={ROUTE_D} fill="none" stroke="#22D3EE" strokeWidth="8" strokeLinecap="round" opacity="0.16" filter="url(#lr-glow)" />

              {/* nodes */}
              {NODES.map((node, i) => {
                const reached = activeStep >= i;
                return (
                  <g key={node.key}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={reached ? 8 : 6}
                      fill={reached ? "#22D3EE" : "#0a1420"}
                      stroke={reached ? "#F4FAFF" : "#7DD3FC"}
                      strokeOpacity={reached ? 0.95 : 0.45}
                      strokeWidth="2"
                      style={{ transition: "all 420ms cubic-bezier(0.16,1,0.3,1)" }}
                    />
                    {reached && !reduced && (
                      <motion.circle
                        cx={node.x}
                        cy={node.y}
                        r="8"
                        fill="none"
                        stroke="#22D3EE"
                        animate={{ r: [8, 26], opacity: [0.7, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 0.2 }}
                      />
                    )}
                    <text
                      x={node.x + (i >= 3 ? -14 : 16)}
                      y={node.y + (i === 4 ? -14 : 4)}
                      textAnchor={i >= 3 ? "end" : "start"}
                      fill={reached ? "#F4FAFF" : "#A7B4C5"}
                      fillOpacity={reached ? 0.95 : 0.5}
                      fontSize="10"
                      fontFamily="'JetBrains Mono Variable', monospace"
                      letterSpacing="2.2"
                      style={{ transition: "fill-opacity 400ms" }}
                    >
                      {String(i + 1).padStart(2, "0")} {ROUTE_STEPS[i]!.label.toUpperCase()}
                    </text>
                  </g>
                );
              })}

              {/* the truck, placed exactly on the path */}
              <g
                transform={`translate(${truck.x} ${truck.y}) rotate(${truck.angle}) scale(0.62)`}
                style={{ transition: reduced ? undefined : "transform 90ms linear" }}
              >
                <ellipse cx="32" cy="26" rx="30" ry="5" fill="#000" opacity="0.5" />
                <g transform="translate(0 -14)">
                  <foreignObject x="-4" y="-6" width="72" height="34">
                    <div style={{ width: 72, height: 34 }}>
                      <TruckGlyph />
                    </div>
                  </foreignObject>
                </g>
                <circle cx="32" cy="0" r="34" fill="#22D3EE" opacity="0.12" filter="url(#lr-glow)" />
              </g>

              {/* caption */}
              <text x="20" y="30" fill="#A7B4C5" fontSize="10" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="3" opacity="0.65">
                STYLISED REGIONAL MAP · NOT TO SCALE
              </text>
              <text x="780" y="30" textAnchor="end" fill="#7DD3FC" fontSize="10" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="3" opacity="0.65">
                ROUTE · 5 STAGES
              </text>
              <text x="20" y="546" fill="#A7B4C5" fontSize="9" fontFamily="'JetBrains Mono Variable', monospace" letterSpacing="2.4" opacity="0.5">
                COVERAGE IS DEFINED PER CONTRACT — NOT PUBLISHED AS NATIONWIDE
              </text>
            </svg>
          </div>

          {/* ------------------------------ steps ------------------------------ */}
          <div className="flex flex-col gap-4">
            <ol className="flex flex-col gap-2.5">
              {ROUTE_STEPS.map((step, i) => {
                const Icon = STEP_ICONS[i]!;
                const reached = activeStep >= i;
                const current = activeStep === i;
                return (
                  <motion.li
                    key={step.key}
                    initial={{ opacity: 0, x: reduced ? 0 : 22 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, delay: i * 0.07, ease: EASE.frost as never }}
                    className={cn(
                      "relative flex items-start gap-4 overflow-hidden rounded-xl border px-4 py-3.5 transition-[border-color,background-color] duration-500",
                      current
                        ? "border-cyan-core/60 bg-cyan-core/10"
                        : reached
                          ? "border-ice/22 bg-industrial/40"
                          : "border-ice/10 bg-navy/35",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-500",
                        current
                          ? "border-cyan-core/70 bg-cyan-core/16 text-cyan-core shadow-[0_0_22px_-6px_rgba(34,211,238,0.95)]"
                          : reached
                            ? "border-ice/30 bg-navy/60 text-ice"
                            : "border-ice/14 bg-navy/40 text-silver/45",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2.5">
                        <span className="font-mono text-[9px] tracking-[0.22em] text-cyan-core/80">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cn(
                            "font-display text-base font-bold tracking-[-0.01em] uppercase transition-colors duration-500",
                            reached ? "text-frost" : "text-silver/55",
                          )}
                        >
                          {step.label}
                        </span>
                      </span>
                      <span className="mt-1 block text-[0.82rem] leading-relaxed text-silver/70">
                        {step.detail}
                      </span>
                    </span>
                    {reached && (
                      <CheckCircle2
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0",
                          current ? "text-cyan-core" : "text-cool/70",
                        )}
                        aria-hidden
                      />
                    )}
                  </motion.li>
                );
              })}
            </ol>

            <div className="grid gap-4 sm:grid-cols-2">
              <FrostFrame
                src="/assets/fleet-night.jpg"
                alt="Refrigerated fleet staged in the yard at night"
                aspect="aspect-[4/3]"
                label="Refrigerated fleet"
                sublabel="Dock-sealed loading"
                sizes="(max-width:1024px) 100vw, 24vw"
              />
              <FrostFrame
                src="/assets/aerial-industrial.jpg"
                alt="Aerial view of the industrial logistics district at dusk"
                aspect="aspect-[4/3]"
                label="Industrial district"
                sublabel="Uuayrij · Baghdad"
                sizes="(max-width:1024px) 100vw, 24vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
