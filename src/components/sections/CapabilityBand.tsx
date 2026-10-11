"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  Activity,
  Boxes,
  FileText,
  ShieldCheck,
  ThermometerSnowflake,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { EASE } from "@/animations/presets";
import { Counter } from "@/components/ui/Typography";
import { Marquee } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import { SERVICES } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The band directly under the hero: what we do, at a glance.
 *
 * Three parallaxed photographs, four operating numbers and the service list —
 * the fastest way for a visitor to understand the business after the arrival
 * sequence, without reading a paragraph.
 */

const SERVICE_ICONS = {
  thermometer: ThermometerSnowflake,
  truck: Truck,
  boxes: Boxes,
  activity: Activity,
  shield: ShieldCheck,
  file: FileText,
} as const;

const COLLAGE = [
  { src: "/assets/product-seafood.jpg", alt: "Frozen seafood crates on ice in a marine cold-chain room", depth: 70 },
  { src: "/assets/control-room.jpg", alt: "Facility operations control room with monitoring wall", depth: 120 },
  { src: "/assets/product-pharma.jpg", alt: "Pharmaceutical vials in a precision cold storage vault", depth: 45 },
] as const;

export function CapabilityBand() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden bg-midnight"
      aria-label="Capabilities at a glance"
    >
      {/* operating numbers ticker */}
      <div className="relative border-y border-ice/10 bg-[linear-gradient(180deg,rgba(21,34,53,0.55),rgba(5,9,20,0.9))]">
        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-2 gap-px px-5 sm:px-8 lg:grid-cols-4 lg:px-12">
          <Stat
            label="Zones mapped"
            value={8}
            suffix=""
            note="Receiving → dispatch"
          />
          <Stat
            label="Product categories"
            value={4}
            note="Produce · protein · marine · pharma"
          />
          <Stat
            label="Chain stages"
            value={6}
            note="Arrival through release"
          />
          <Stat
            label="Monitoring"
            value={24}
            suffix="/7"
            note="Continuous condition logging"
          />
        </div>
      </div>

      <Marquee
        className="border-b border-ice/10 py-3"
        separator="❄"
        items={[
          "Temperature-controlled storage",
          "Cold-chain logistics",
          "Batch traceability",
          "Zoned separation",
          "Controlled access",
          "Gate pass verification",
          "Continuous monitoring",
          "Documented handling",
        ]}
      />

      <div className="relative mx-auto w-full max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* --------------------------- collage --------------------------- */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <CollageTile
                src={COLLAGE[0].src}
                alt={COLLAGE[0].alt}
                progress={scrollYProgress}
                depth={reduced ? 0 : COLLAGE[0].depth}
                className="col-span-2 aspect-[16/9]"
                label="Marine cold chain"
                code="ZN-04"
              />
              <CollageTile
                src={COLLAGE[1].src}
                alt={COLLAGE[1].alt}
                progress={scrollYProgress}
                depth={reduced ? 0 : -COLLAGE[1].depth}
                className="aspect-[4/5]"
                label="Operations control"
                code="CTL-01"
              />
              <CollageTile
                src={COLLAGE[2].src}
                alt={COLLAGE[2].alt}
                progress={scrollYProgress}
                depth={reduced ? 0 : COLLAGE[2].depth}
                className="aspect-[4/5]"
                label="Precision vault"
                code="ZN-05"
              />
            </div>

            {/* floating capability chip */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE.frost as never }}
              className="panel-hud scanlines absolute -right-2 -bottom-6 hidden w-56 rounded-xl p-4 sm:-right-6 md:block"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cool opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cool" />
                </span>
                <span className="font-mono text-[9px] tracking-[0.24em] text-frost uppercase">
                  Facility status
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  ["Zones", "OPERATIONAL"],
                  ["Access", "SECURED"],
                  ["Monitoring", "ACTIVE"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[8px] tracking-[0.2em] text-silver/55 uppercase">{k}</span>
                    <span className="font-mono text-[9px] tracking-[0.14em] text-cool uppercase">{v}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* --------------------------- services --------------------------- */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: EASE.frost as never }}
              className="flex items-center gap-3"
            >
              <span className="h-px w-8 bg-cyan-core" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.32em] text-ice uppercase">
                What we operate
              </span>
            </motion.div>

            <h2 className="mt-5 font-display text-[clamp(2rem,5vw,3.6rem)] leading-[0.94] font-bold tracking-[-0.045em] text-frost">
              A cold store is a
              <br />
              <span className="text-gradient-frost">system of systems.</span>
            </h2>

            <p className="mt-6 max-w-xl text-[0.98rem] leading-relaxed text-silver/80">
              Refrigeration, racking, access control, inventory records and transport only work if
              they are designed as one thing. Ours are.
            </p>

            <ul className="mt-9 grid gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10 sm:grid-cols-2">
              {SERVICES.map((service, i) => {
                const Icon = SERVICE_ICONS[service.icon as keyof typeof SERVICE_ICONS];
                return (
                  <motion.li
                    key={service.title}
                    initial={{ opacity: 0, y: reduced ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: EASE.frost as never }}
                    className="group/svc relative bg-midnight p-5 transition-colors duration-500 hover:bg-industrial/45"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-core/28 bg-cyan-core/8 text-cyan-core transition-all duration-500 group-hover/svc:border-cyan-core/70 group-hover/svc:shadow-[0_0_22px_-6px_rgba(34,211,238,0.95)]">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-display text-[0.98rem] leading-tight font-bold tracking-[-0.01em] text-frost">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-[0.82rem] leading-relaxed text-silver/70">{service.body}</p>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/svc:scale-x-100"
                    />
                  </motion.li>
                );
              })}
            </ul>

            <Link
              href="/solutions"
              className="group/sol mt-8 inline-flex items-center gap-3 font-mono text-[10px] tracking-[0.26em] text-ice uppercase transition-colors hover:text-frost"
            >
              All solutions
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-ice/25 transition-all duration-500 group-hover/sol:border-cyan-core/70 group-hover/sol:bg-cyan-core/12">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-core transition-transform duration-500 group-hover/sol:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  suffix,
  note,
}: {
  label: string;
  value: number;
  suffix?: string;
  note: string;
}) {
  return (
    <div className="group/stat relative bg-midnight px-1 py-7 transition-colors duration-500 hover:bg-industrial/30 sm:px-4">
      <div className="font-mono text-[8px] tracking-[0.26em] text-silver/50 uppercase">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <Counter
          value={value}
          className="font-display text-[2.2rem] leading-none font-bold text-frost sm:text-[2.6rem]"
          duration={1400}
        />
        {suffix && <span className="font-mono text-sm text-cyan-core">{suffix}</span>}
      </div>
      <div className="mt-2 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
        {note}
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 group-hover/stat:scale-x-100"
      />
    </div>
  );
}

function CollageTile({
  src,
  alt,
  label,
  code,
  depth,
  progress,
  className,
}: {
  src: string;
  alt: string;
  label: string;
  code: string;
  depth: number;
  progress: import("framer-motion").MotionValue<number>;
  className?: string;
}) {
  const y = useTransform(progress, [0, 1], [depth, -depth]);

  return (
    <motion.figure
      style={{ y }}
      className={cn(
        "group/tile relative isolate overflow-hidden rounded-xl border border-ice/12 bg-navy",
        "shadow-[0_36px_80px_-48px_rgba(0,0,0,0.95)]",
        className,
      )}
      data-image="true"
      data-cursor="view"
      data-cursor-label="VIEW"
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width:1024px) 100vw, 44vw"
        quality={80}
        className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:scale-[1.07]"
        style={{ filter: "saturate(0.78) contrast(1.1) brightness(0.72)" }}
      />
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{ background: "linear-gradient(170deg, rgba(125,211,252,0.24), transparent 52%, rgba(34,211,238,0.18))" }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(5,9,20,0.3), transparent 44%, rgba(5,9,20,0.94))" }}
      />
      <span className="scanlines pointer-events-none absolute inset-0 rounded-xl" aria-hidden />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span>
          <span className="block font-mono text-[8px] tracking-[0.24em] text-cyan-core/85 uppercase">{code}</span>
          <span className="mt-1 block font-display text-[0.86rem] font-bold tracking-[0.02em] text-frost uppercase">
            {label}
          </span>
        </span>
        <span className="h-6 w-6 shrink-0 rounded border border-cyan-core/40 opacity-0 transition-opacity duration-500 group-hover/tile:opacity-100" aria-hidden />
      </figcaption>
    </motion.figure>
  );
}
