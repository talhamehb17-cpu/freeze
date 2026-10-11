"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef, type ReactNode } from "react";

import { EASE } from "@/animations/presets";
import { MaskLines } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Interior page hero — one photograph, one masked headline, a lead and an
 * optional meta strip. Deliberately shorter than the home sequence: these pages
 * are read, not experienced, so the arrival is a single controlled reveal
 * rather than a timeline.
 */
export function PageHero({
  index,
  eyebrow,
  lines,
  lead,
  image,
  imageAlt,
  imageCode,
  meta,
  aside,
  children,
}: {
  index: string;
  eyebrow: string;
  lines: string[];
  lead: string;
  image: string;
  imageAlt: string;
  imageCode: string;
  meta?: { label: string; value: string; tone?: "frost" | "cyan" | "amber" }[];
  aside?: ReactNode;
  children?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "14%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.09]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0.15]);

  return (
    <header
      ref={ref}
      className="relative isolate flex min-h-[76svh] items-end overflow-hidden border-b border-ice/10"
    >
      {/* photograph */}
      <motion.div style={{ y: imgY, scale: imgScale }} className="absolute inset-0 -z-10">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover"
          style={{ filter: "saturate(0.72) contrast(1.12) brightness(0.48)" }}
        />
      </motion.div>

      {/* grade */}
      <div
        className="absolute inset-0 -z-10 mix-blend-soft-light"
        style={{ background: "linear-gradient(165deg, rgba(125,211,252,0.26), transparent 48%, rgba(34,211,238,0.2))" }}
        aria-hidden
      />
      <motion.div
        style={{ opacity: fade }}
        className="absolute inset-0 -z-10"
        aria-hidden
      >
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(5,9,20,0.82) 0%, rgba(5,9,20,0.42) 34%, rgba(5,9,20,0.96) 100%)" }}
        />
        <span className="scanlines absolute inset-0 opacity-60" />
      </motion.div>

      {/* HUD frame */}
      <div className="pointer-events-none absolute inset-5 hidden lg:block" aria-hidden>
        {[
          "left-0 top-0 border-l border-t",
          "right-0 top-0 border-r border-t",
          "left-0 bottom-0 border-l border-b",
          "right-0 bottom-0 border-r border-b",
        ].map((pos) => (
          <span key={pos} className={cn("absolute h-5 w-5 border-cyan-core/35", pos)} />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-5 pt-40 pb-12 sm:px-8 sm:pb-16 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE.frost as never }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="font-mono text-[10px] tracking-[0.3em] text-cyan-core tabular">{index}</span>
              <span className="h-px w-10 bg-cyan-core/70" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">{eyebrow}</span>
            </motion.div>

            <MaskLines
              lines={lines}
              as="h1"
              delay={0.18}
              className="mt-6 font-display text-[clamp(2.4rem,7.4vw,5.4rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost"
            />

            <motion.p
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: reduced ? 0 : 0.6, ease: EASE.frost as never }}
              className="mt-6 max-w-2xl text-[1rem] leading-relaxed text-silver/85 sm:text-[1.05rem]"
            >
              {lead}
            </motion.p>
          </div>

          {aside && (
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: reduced ? 0 : 0.7, ease: EASE.frost as never }}
            >
              {aside}
            </motion.div>
          )}
        </div>

        {meta && meta.length > 0 && (
          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: reduced ? 0 : 0.85 }}
            className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/14 bg-ice/10 backdrop-blur-sm lg:grid-cols-4"
          >
            {meta.map((m) => (
              <div key={m.label} className="bg-midnight/72 px-4 py-4">
                <dt className="font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">{m.label}</dt>
                <dd
                  className={cn(
                    "mt-2 font-display text-[1.15rem] font-bold tracking-[-0.01em]",
                    m.tone === "cyan" ? "text-cyan-core" : m.tone === "amber" ? "text-amber-tj" : "text-frost",
                  )}
                >
                  {m.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        )}

        {children}
      </div>

      <span className="pointer-events-none absolute bottom-4 right-6 font-mono text-[8px] tracking-[0.24em] text-silver/40 uppercase">
        {imageCode}
      </span>
    </header>
  );
}
