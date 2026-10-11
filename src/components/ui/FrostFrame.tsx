"use client";

import Image from "next/image";
import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Premium image frame (spec §43 / §32).
 *
 * Every photograph in the product goes through this component so the treatment
 * stays identical: frost glass, slow Ken Burns drift, a corner-bracket HUD, a
 * light sweep on hover, and the `VIEW` cursor state.
 */

interface FrostFrameProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  /** Slow breathing zoom. Off for reduced motion. */
  kenBurns?: boolean;
  /** Show the HUD corner brackets + label. */
  hud?: boolean;
  label?: string;
  sublabel?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  aspect?: string;
  tone?: "cold" | "neutral" | "warm";
  sweep?: boolean;
  children?: React.ReactNode;
}

const TONE: Record<string, string> = {
  cold: "from-[#04101f]/92 via-[#06182b]/45 to-transparent",
  neutral: "from-[#050914]/90 via-[#050914]/40 to-transparent",
  warm: "from-[#120c06]/88 via-[#0a1020]/45 to-transparent",
};

export function FrostFrame({
  src,
  alt,
  className,
  imageClassName,
  kenBurns = true,
  hud = false,
  label,
  sublabel,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 42vw",
  priority = false,
  quality = 82,
  aspect = "aspect-[16/10]",
  tone = "cold",
  sweep = true,
  children,
}: FrostFrameProps) {
  const reduced = useReducedMotion();
  const animate = kenBurns && !reduced;

  return (
    <div
      data-image="true"
      data-cursor="view"
      data-cursor-label="VIEW"
      className={cn(
        "group/frame frost-glass relative isolate overflow-hidden rounded-xl border border-ice/12",
        "bg-navy shadow-[0_40px_90px_-50px_rgba(0,0,0,0.95)]",
        aspect,
        className,
      )}
    >
      <motion.div
        className={cn("absolute inset-0", imageClassName)}
        initial={animate ? { scale: 1.04 } : false}
        animate={
          animate
            ? { scale: [1.04, 1.13, 1.04], x: [0, "-1.2%", 0], y: [0, "0.8%", 0] }
            : undefined
        }
        transition={
          animate
            ? { duration: 26, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        whileHover={animate ? undefined : { scale: 1.05 }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          className="object-cover"
          style={{ filter: "saturate(0.92) contrast(1.06)" }}
        />
      </motion.div>

      {/* cold grade */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(180deg, rgba(125,211,252,0.18), transparent 42%, rgba(34,211,238,0.14))",
        }}
      />
      {/* depth scrim */}
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-t", TONE[tone])} />

      {/* frost bloom at the edges */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-700 group-hover/frame:opacity-90"
        style={{
          background:
            "radial-gradient(108% 88% at 50% 50%, transparent 52%, rgba(244,250,255,0.10) 88%, rgba(244,250,255,0.22) 100%)",
        }}
      />

      {/* light sweep */}
      {sweep && !reduced && (
        <span className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="absolute -inset-y-8 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-frost/14 to-transparent opacity-0 transition-opacity duration-300 group-hover/frame:opacity-100 group-hover/frame:[animation:sweep_1.15s_cubic-bezier(0.16,1,0.3,1)]" />
        </span>
      )}

      {/* scanline */}
      {hud && <span className="scanlines pointer-events-none absolute inset-0 rounded-xl" />}

      {hud && (
        <>
          <Corner className="top-2.5 left-2.5 border-t border-l" />
          <Corner className="top-2.5 right-2.5 border-t border-r" />
          <Corner className="bottom-2.5 left-2.5 border-b border-l" />
          <Corner className="bottom-2.5 right-2.5 border-b border-r" />
        </>
      )}

      {(label || sublabel) && (
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          {label && (
            <div className="font-display text-sm font-bold tracking-[0.16em] text-frost uppercase sm:text-base">
              {label}
            </div>
          )}
          {sublabel && (
            <div className="mt-1 font-mono text-[10px] tracking-[0.22em] text-ice/75 uppercase">
              {sublabel}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

function Corner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-4 w-4 border-cyan-core/60 opacity-70 transition-all duration-500 group-hover/frame:h-6 group-hover/frame:w-6 group-hover/frame:opacity-100",
        className,
      )}
    />
  );
}

/** Wide editorial frame used for hero slides and section imagery. */
export function FrostFrameWide(props: FrostFrameProps) {
  return <FrostFrame {...props} aspect={props.aspect ?? "aspect-[21/9]"} />;
}
