"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  BadgeCheck,
  DoorClosed,
  Eye,
  Fingerprint,
  KeyRound,
  Radar,
  ShieldCheck,
  Thermometer,
} from "lucide-react";
import { useEffect, useState } from "react";

import { EASE } from "@/animations/presets";
import { DemoBadge, DemoNotice, StatusPill } from "@/components/ui/Hud";
import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { useEnteredView } from "@/hooks/use-entered-view";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * SECURITY EXPERIENCE (spec §23).
 *
 * A camera matrix, a badge-access scanner and a thermal/access readout.
 * The camera tiles are graded facility photographs presented AS a monitoring
 * UI — and the section says plainly that it is a simulation until a real VMS
 * feed is connected. No claim is made about live coverage.
 */

const CAMERAS = [
  { id: "CAM 01", label: "Perimeter · Gate", src: "/assets/facility-hero.jpg", alt: "Facility perimeter camera view at night" },
  { id: "CAM 02", label: "Dock · Bay 02", src: "/assets/loading-dock.jpg", alt: "Loading dock camera view with cold fog" },
  { id: "CAM 03", label: "Frozen · Aisle C", src: "/assets/cold-room-aisle.jpg", alt: "Frozen storage aisle camera view" },
  { id: "CAM 04", label: "Pharma · Vault", src: "/assets/product-pharma.jpg", alt: "Pharmaceutical vault camera view" },
  { id: "CAM 05", label: "Yard · Fleet", src: "/assets/fleet-night.jpg", alt: "Vehicle yard camera view at night" },
  { id: "CAM 06", label: "Control Room", src: "/assets/control-room.jpg", alt: "Control room camera view" },
] as const;

const ACCESS_LOG = [
  { time: "06:12", who: "Operator · Badge 014", zone: "Frozen Storage", result: "GRANTED" },
  { time: "07:48", who: "Operator · Badge 002", zone: "Receiving Hall", result: "GRANTED" },
  { time: "09:31", who: "Visitor · Unregistered", zone: "Pharma Vault", result: "DENIED" },
  { time: "11:05", who: "Operator · Badge 014", zone: "Loading Bays", result: "GRANTED" },
  { time: "13:22", who: "Operator · Badge 007", zone: "Cold Room B", result: "GRANTED" },
] as const;

export function SecurityMatrix({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { ref, entered } = useEnteredView<HTMLDivElement>({ threshold: 0.25 });
  const [clock, setClock] = useState("--:--:--");
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "granted">("idle");
  const [focusCam, setFocusCam] = useState<string | null>(null);

  // A running clock is the one detail that makes a monitoring UI feel alive.
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(
        [d.getHours(), d.getMinutes(), d.getSeconds()]
          .map((n) => String(n).padStart(2, "0"))
          .join(":"),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Cycle the badge scanner while the section is on screen.
  useEffect(() => {
    if (!entered || reduced) return;
    let cancelled = false;
    const cycle = async () => {
      while (!cancelled) {
        setScanPhase("scanning");
        await wait(1500);
        if (cancelled) return;
        setScanPhase("granted");
        await wait(2200);
        if (cancelled) return;
        setScanPhase("idle");
        await wait(1200);
      }
    };
    cycle();
    return () => {
      cancelled = true;
    };
  }, [entered, reduced]);

  return (
    <section
      id="security"
      className={cn("relative isolate overflow-hidden bg-midnight py-24 sm:py-32", className)}
      aria-label="Facility security"
    >
      <div ref={ref} className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <GhostIndex index="06" className="-top-10 -left-4 hidden lg:block" />
            <Kicker index="06">Security</Kicker>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
              Controlled at
              <br />
              <span className="text-gradient-frost">every boundary.</span>
            </h2>
            <p className="mt-6 text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
              Gate, zone and door. Access is badged and logged, coverage is monitored, and the
              restricted zones are separated from general traffic.
            </p>
          </div>

          <div className="panel-hud scanlines flex items-center gap-4 px-5 py-3.5">
            <Radar className="h-4 w-4 text-cyan-core" aria-hidden />
            <div>
              <div className="font-mono text-[8px] tracking-[0.26em] text-silver/55 uppercase">
                Facility time
              </div>
              <div className="mt-1 font-mono text-lg tracking-[0.12em] text-frost tabular">{clock}</div>
            </div>
            <DemoBadge size="xs" />
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8">
          {/* ------------------------- camera matrix ------------------------- */}
          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Eye className="h-4 w-4 text-cyan-core" aria-hidden />
                <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
                  Camera matrix
                </span>
              </div>
              <span className="font-mono text-[9px] tracking-[0.2em] text-cool uppercase">
                {CAMERAS.length} / {CAMERAS.length} online
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {CAMERAS.map((cam, i) => (
                <CameraTile
                  key={cam.id}
                  cam={cam}
                  index={i}
                  reduced={reduced}
                  focused={focusCam === cam.id}
                  onFocus={() => setFocusCam((f) => (f === cam.id ? null : cam.id))}
                  clock={clock}
                />
              ))}
            </div>

            <div className="mt-4">
              <DemoNotice>
                Camera tiles above are graded facility photographs presented as a monitoring
                interface. This is a UI simulation — it is not a live video management system.
              </DemoNotice>
            </div>
          </div>

          {/* -------------------------- access control -------------------------- */}
          <div className="flex flex-col gap-5">
            <div className="panel-hud scanlines overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-ice/12 bg-navy/70 px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="h-4 w-4 text-cyan-core" aria-hidden />
                  <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
                    Access control
                  </span>
                </div>
                <StatusPill status="SECURED" size="xs" />
              </div>

              <div className="px-5 py-6">
                {/* badge scanner */}
                <div className="relative mx-auto h-40 w-full max-w-xs">
                  {/* reader */}
                  <div className="absolute inset-x-0 top-0 mx-auto h-28 w-44 overflow-hidden rounded-xl border border-ice/22 bg-[linear-gradient(160deg,#152235,#081426)]">
                    <div className="hud-grid-fine absolute inset-0 opacity-40" aria-hidden />
                    <div className="absolute inset-x-4 top-3 flex items-center justify-between">
                      <span className="font-mono text-[7px] tracking-[0.2em] text-silver/55 uppercase">
                        Reader 01
                      </span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-colors duration-300",
                          scanPhase === "granted" ? "bg-cool" : scanPhase === "scanning" ? "bg-amber-tj" : "bg-danger/70",
                        )}
                      />
                    </div>

                    {/* scan beam */}
                    {!reduced && (
                      <motion.span
                        className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-cyan-core/45 to-transparent"
                        animate={
                          scanPhase === "scanning"
                            ? { top: ["18%", "70%", "18%"], opacity: [0.2, 1, 0.2] }
                            : { top: "18%", opacity: 0 }
                        }
                        transition={{ duration: 1.4, repeat: scanPhase === "scanning" ? Infinity : 0, ease: "easeInOut" }}
                      />
                    )}

                    {/* badge */}
                    <motion.div
                      className="absolute inset-x-6 bottom-3 rounded-lg border border-cyan-core/40 bg-[linear-gradient(140deg,#0d2138,#050914)] px-3 py-2"
                      animate={
                        scanPhase === "idle"
                          ? { y: 26, opacity: 0 }
                          : scanPhase === "scanning"
                            ? { y: 0, opacity: 1 }
                            : { y: -4, opacity: 1 }
                      }
                      transition={{ duration: 0.6, ease: EASE.frost as never }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-core/50 bg-cyan-core/12">
                          <BadgeCheck className="h-3 w-3 text-cyan-core" aria-hidden />
                        </span>
                        <span className="leading-none">
                          <span className="block font-mono text-[8px] tracking-[0.18em] text-frost uppercase">
                            Operator 014
                          </span>
                          <span className="mt-1 block font-mono text-[7px] tracking-[0.16em] text-silver/60 uppercase">
                            Cleared · Frozen
                          </span>
                        </span>
                      </div>
                    </motion.div>
                  </div>

                  {/* result */}
                  <div className="absolute inset-x-0 bottom-0 flex justify-center">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={scanPhase}
                        initial={{ opacity: 0, y: 8, filter: reduced ? "none" : "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.35, ease: EASE.frost as never }}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[9px] tracking-[0.24em] uppercase backdrop-blur-md",
                          scanPhase === "granted"
                            ? "border-cool/50 bg-cool/12 text-cool"
                            : scanPhase === "scanning"
                              ? "border-amber-tj/45 bg-amber-tj/10 text-amber-tj"
                              : "border-ice/20 bg-navy/60 text-silver/55",
                        )}
                      >
                        {scanPhase === "granted" ? (
                          <>
                            <ShieldCheck className="h-3 w-3" aria-hidden /> Access granted
                          </>
                        ) : scanPhase === "scanning" ? (
                          <>Verifying badge…</>
                        ) : (
                          <>Awaiting badge</>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>

                {/* door + thermal readouts */}
                <div className="mt-7 grid grid-cols-2 gap-3">
                  <MiniReadout
                    Icon={DoorClosed}
                    label="Vault door"
                    value={scanPhase === "granted" ? "UNLOCKED" : "LOCKED"}
                    tone={scanPhase === "granted" ? "cool" : "ice"}
                  />
                  <MiniReadout Icon={KeyRound} label="Keys issued" value="BADGED" tone="ice" />
                  <MiniReadout Icon={Thermometer} label="Thermal sensors" value="ARMED" tone="cool" />
                  <MiniReadout Icon={Radar} label="Perimeter" value="MONITORED" tone="ice" />
                </div>
              </div>
            </div>

            {/* access log */}
            <div className="panel overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-ice/10 px-5 py-3">
                <span className="font-mono text-[9px] tracking-[0.26em] text-silver/60 uppercase">
                  Recent access events
                </span>
                <DemoBadge size="xs" label="Sample" />
              </div>
              <ul className="divide-y divide-ice/8">
                {ACCESS_LOG.map((row, i) => (
                  <motion.li
                    key={`${row.time}-${i}`}
                    initial={{ opacity: 0, x: reduced ? 0 : -14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: EASE.frost as never }}
                    className="flex items-center justify-between gap-3 px-5 py-2.5"
                  >
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-cyan-core tabular">{row.time}</span>
                      <span className="hidden font-mono text-[9px] tracking-[0.12em] text-silver/70 uppercase sm:block">
                        {row.who}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[9px] tracking-[0.18em] uppercase",
                        row.result === "GRANTED" ? "text-cool" : "text-danger",
                      )}
                    >
                      {row.result}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CameraTile({
  cam,
  index,
  reduced,
  focused,
  onFocus,
  clock,
}: {
  cam: (typeof CAMERAS)[number];
  index: number;
  reduced: boolean;
  focused: boolean;
  onFocus: () => void;
  clock: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onFocus}
      initial={{ opacity: 0, y: reduced ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: EASE.frost as never }}
      className={cn(
        "group/cam relative aspect-[4/3] overflow-hidden rounded-lg border text-left transition-[border-color,box-shadow] duration-500",
        focused
          ? "border-cyan-core/70 shadow-[0_0_0_1px_rgba(34,211,238,0.3),0_0_36px_-12px_rgba(34,211,238,0.9)]"
          : "border-ice/14 hover:border-cyan-core/45",
      )}
      data-cursor="inspect"
      data-cursor-label={cam.id}
      aria-label={`${cam.id} — ${cam.label}`}
      aria-pressed={focused}
    >
      <Image
        src={cam.src}
        alt={cam.alt}
        fill
        sizes="(max-width:640px) 45vw, (max-width:1024px) 30vw, 22vw"
        quality={70}
        className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/cam:scale-110"
        style={{ filter: "saturate(0.4) contrast(1.2) brightness(0.55)" }}
      />
      {/* night-vision grade */}
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ background: "linear-gradient(180deg,#0a2438,#04121d)" }}
        aria-hidden
      />
      <div className="scanlines absolute inset-0 rounded-lg" aria-hidden />
      {/* rolling noise */}
      {!reduced && (
        <div
          className="noise-layer pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
          style={{ animation: "drift 3.5s steps(6) infinite", backgroundSize: "90px 90px" }}
          aria-hidden
        />
      )}
      {/* vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(110% 90% at 50% 50%, transparent 44%, rgba(3,6,14,0.85) 100%)" }}
        aria-hidden
      />

      {/* top row */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 px-2.5 py-2">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            {!reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-70" />}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
          </span>
          <span className="font-mono text-[8px] tracking-[0.18em] text-frost/90 uppercase">{cam.id}</span>
        </span>
        <span className="font-mono text-[7px] tracking-[0.14em] text-frost/55 tabular">{clock}</span>
      </div>

      {/* bottom row */}
      <div className="absolute inset-x-0 bottom-0 px-2.5 py-2">
        <span className="font-mono text-[7.5px] tracking-[0.16em] text-ice/80 uppercase">{cam.label}</span>
      </div>

      {/* focus reticle */}
      <AnimatePresence>
        {focused && (
          <motion.span
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.4, ease: EASE.snap as never }}
            className="pointer-events-none absolute inset-3 rounded border border-cyan-core/60"
            aria-hidden
          >
            <span className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-core/70" />
            <span className="absolute top-1/2 left-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-cyan-core/45" />
            <span className="absolute top-1/2 left-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-cyan-core/45" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function MiniReadout({
  Icon,
  label,
  value,
  tone,
}: {
  Icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone: "cool" | "ice";
}) {
  return (
    <div className="rounded-lg border border-ice/12 bg-navy/50 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3 w-3", tone === "cool" ? "text-cool" : "text-cyan-core")} aria-hidden />
        <span className="font-mono text-[8px] tracking-[0.2em] text-silver/55 uppercase">{label}</span>
      </div>
      <div
        className={cn(
          "mt-1.5 font-mono text-[10px] tracking-[0.16em] uppercase",
          tone === "cool" ? "text-cool" : "text-ice",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
