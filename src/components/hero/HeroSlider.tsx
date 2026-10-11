"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Hero image slider — the photographic bed under the cinematic SVG scene.
 *
 * Slides crossfade while drifting (Ken Burns), each with its own grade so the
 * palette never leaves the brand. Auto-advance pauses on hover, on interaction
 * and for reduced-motion visitors.
 */

export interface Slide {
  src: string;
  alt: string;
  code: string;
  label: string;
  /** Seconds before advancing. */
  duration?: number;
}

export const HERO_SLIDES: Slide[] = [
  {
    src: "/assets/facility-hero.jpg",
    alt: "Tahseen Jaber cold storage facility at night with illuminated loading bays",
    code: "EXT-01",
    label: "Facility · Uuayrij",
    duration: 7,
  },
  {
    src: "/assets/loading-dock.jpg",
    alt: "Open cold room dock door releasing fog onto the loading bay",
    code: "DOCK-02",
    label: "Dock · Sealed Bay",
    duration: 7,
  },
  {
    src: "/assets/cold-room-aisle.jpg",
    alt: "Frozen warehouse aisle with racked pallets under cold blue lighting",
    code: "ZN-04",
    label: "Frozen Storage Aisle",
    duration: 7,
  },
  {
    src: "/assets/fleet-night.jpg",
    alt: "Fleet of refrigerated trucks parked at the logistics yard at night",
    code: "FLT-09",
    label: "Refrigerated Fleet",
    duration: 7,
  },
];

export function HeroSlider({
  slides = HERO_SLIDES,
  className,
  onIndexChange,
  auto = true,
  controls = true,
}: {
  slides?: Slide[];
  className?: string;
  onIndexChange?: (index: number) => void;
  auto?: boolean;
  controls?: boolean;
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const go = useCallback(
    (next: number) => {
      const wrapped = ((next % slides.length) + slides.length) % slides.length;
      setIndex(wrapped);
      setProgress(0);
      onIndexChange?.(wrapped);
    },
    [slides.length, onIndexChange],
  );

  useEffect(() => {
    if (!auto || reduced || paused) return;
    const duration = (slides[index]?.duration ?? 7) * 1000;
    const started = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / duration);
      setProgress(p);
      if (p >= 1) {
        go(index + 1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, auto, reduced, paused, go, slides]);

  const active = slides[index]!;

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Facility imagery"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={active.src}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: reduced ? 1 : 1.12 }}
          animate={{ opacity: 1, scale: reduced ? 1 : 1 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 1.04 }}
          transition={{ duration: reduced ? 0.4 : 1.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src={active.src}
            alt={active.alt}
            fill
            priority
            sizes="100vw"
            quality={80}
            className="object-cover"
            style={{ filter: "saturate(0.72) contrast(1.12) brightness(0.62)" }}
          />
          {/* slow drift while the slide is live */}
          {!reduced && (
            <motion.div
              className="absolute inset-0"
              animate={{ x: ["0%", "-1.6%"], y: ["0%", "1%"] }}
              transition={{ duration: (active.duration ?? 7) * 1.6, ease: "linear" }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* cold grade so the SVG scene stays legible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(5,9,20,0.86) 0%, rgba(8,20,38,0.62) 38%, rgba(5,9,20,0.82) 72%, rgba(3,6,14,0.97) 100%)",
        }}
      />
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ background: "linear-gradient(200deg, #0a2a44 0%, #050914 62%, #071c2c 100%)" }}
      />

      {/* slide meta + controls */}
      {controls && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 px-5 pb-5 sm:px-8 sm:pb-7 lg:px-12">
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.code}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3"
              >
                <span className="font-mono text-[9px] tracking-[0.28em] text-cyan-core/85 uppercase">
                  {active.code}
                </span>
                <span className="h-px w-6 bg-ice/30" />
                <span className="font-mono text-[9px] tracking-[0.28em] text-silver/80 uppercase">
                  {active.label}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.code}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show ${slide.label}`}
                aria-current={i === index}
                className="group/slide relative h-6 w-9 overflow-hidden rounded-sm border border-ice/20 bg-navy/60 transition-colors duration-300 hover:border-cyan-core/70 sm:w-12"
              >
                <span
                  className={cn(
                    "absolute inset-0 origin-left bg-gradient-to-r from-cyan-core to-ice transition-transform",
                    i === index ? "scale-x-100 opacity-70" : "scale-x-0 opacity-0",
                  )}
                  style={i === index ? { transform: `scaleX(${Math.max(progress, 0.06)})` } : undefined}
                />
                <span className="absolute inset-x-0 bottom-0 h-px bg-ice/30" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
