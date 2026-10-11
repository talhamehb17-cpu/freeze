"use client";

import { motion, useInView } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { EASE, textReveal, textRevealParent } from "@/animations/presets";
import { useCountUp } from "@/hooks/use-interaction";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn, formatNumber } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Kicker                                                                      */
/* -------------------------------------------------------------------------- */

export function Kicker({
  children,
  index,
  className,
  tone = "ice",
}: {
  children: React.ReactNode;
  index?: string;
  className?: string;
  tone?: "ice" | "cyan" | "silver";
}) {
  const toneClass =
    tone === "cyan" ? "text-cyan-core" : tone === "silver" ? "text-silver" : "text-ice";

  return (
    <div
      className={cn(
        "flex items-center gap-3 font-mono text-[10px] tracking-[0.34em] uppercase sm:text-[11px]",
        className,
      )}
    >
      {index && (
        <span className={cn("tabular", toneClass)}>
          {index}
          <span className="mx-1 opacity-40">/</span>
        </span>
      )}
      <span className={cn("h-px w-8 origin-left bg-current opacity-60", toneClass)} aria-hidden />
      <span className={cn(toneClass, "opacity-90")}>{children}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Line-mask typography reveal                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Splits copy into lines and reveals each from behind a mask.
 * This is the ONLY headline animation in the product — we never animate
 * individual letters without a reason (spec §06).
 */
export function MaskLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  as: Tag = "h2",
  outlineIndex,
}: {
  lines: (string | React.ReactNode)[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "div" | "p" | "span";
  /** Render one line as an outlined ghost word — editorial accent. */
  outlineIndex?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const MotionTag = motion[Tag as "h1"] as typeof motion.h1;

  if (reduced) {
    return (
      <Tag className={className}>
        {lines.map((line, i) => (
          <span key={i} className={cn("block", lineClassName, i === outlineIndex && "text-outline")}>
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <MotionTag
      ref={ref as never}
      className={className}
      variants={textRevealParent}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      transition={{ delay }}
    >
      {lines.map((line, i) => (
        <span key={i} className={cn("mask-line block", inView && "is-in")}>
          <motion.span variants={textReveal} className={cn("block", lineClassName)}>
            {i === outlineIndex ? (
              <span className="text-transparent [-webkit-text-stroke:1px_rgba(167,180,197,0.5)]">
                {line}
              </span>
            ) : (
              line
            )}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/* -------------------------------------------------------------------------- */
/* Section heading                                                             */
/* -------------------------------------------------------------------------- */

export function SectionHeading({
  kicker,
  index,
  lines,
  lead,
  align = "left",
  className,
  aside,
  size = "lg",
}: {
  kicker: string;
  index?: string;
  lines: (string | React.ReactNode)[];
  lead?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  aside?: React.ReactNode;
  size?: "sm" | "lg" | "xl";
}) {
  const sizes = {
    sm: "text-[clamp(1.75rem,3.4vw,2.6rem)]",
    lg: "text-[clamp(2.2rem,5.6vw,4.4rem)]",
    xl: "text-[clamp(2.6rem,7.4vw,6rem)]",
  } as const;

  return (
    <div
      className={cn(
        "relative",
        align === "center" && "mx-auto flex max-w-3xl flex-col items-center text-center",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.6, ease: EASE.frost as never }}
      >
        <Kicker index={index}>{kicker}</Kicker>
      </motion.div>

      <MaskLines
        lines={lines}
        className={cn(
          "mt-5 font-display font-bold tracking-[-0.045em] text-frost",
          sizes[size],
          align === "center" && "text-balance",
        )}
      />

      {lead && (
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.85, delay: 0.14, ease: EASE.frost as never }}
          className={cn(
            "mt-6 max-w-2xl text-[0.98rem] leading-relaxed text-silver sm:text-[1.06rem]",
            align === "center" && "mx-auto",
          )}
        >
          {lead}
        </motion.p>
      )}

      {aside && <div className="mt-8">{aside}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Scramble / decode text — the HUD signature                                  */
/* -------------------------------------------------------------------------- */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#*+=-";

/**
 * Decodes text from noise, like a terminal locking onto a signal.
 * Used for HUD labels and section kickers — never for body copy.
 */
export function ScrambleText({
  text,
  className,
  speed = 34,
  trigger = "view",
  delay = 0,
}: {
  text: string;
  className?: string;
  speed?: number;
  trigger?: "view" | "mount" | "hover";
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [hovered, setHovered] = useState(false);
  const [output, setOutput] = useState(reduced ? text : "");

  const active =
    trigger === "mount" || (trigger === "view" && inView) || (trigger === "hover" && hovered);

  useEffect(() => {
    if (reduced) {
      setOutput(text);
      return;
    }
    if (!active) return;

    let frame = 0;
    let raf = 0;
    let timeout = 0;
    const total = text.length * 2 + 8;

    const run = () => {
      const progress = frame / total;
      const revealed = Math.floor(progress * text.length * 1.35);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]!;
        if (ch === " ") {
          out += " ";
        } else if (i < revealed) {
          out += ch;
        } else {
          out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
      }
      setOutput(out);
      frame++;
      if (frame <= total) raf = window.setTimeout(run, speed) as unknown as number;
      else setOutput(text);
    };

    timeout = window.setTimeout(run, delay);
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(raf);
    };
  }, [active, text, speed, delay, reduced]);

  return (
    <span
      ref={ref}
      className={cn("tabular", className)}
      onMouseEnter={trigger === "hover" ? () => setHovered(true) : undefined}
    >
      {output || (reduced ? text : "\u00A0")}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Counter                                                                     */
/* -------------------------------------------------------------------------- */

export function Counter({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
  duration = 1600,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const { ref, value: current } = useCountUp(value, duration, decimals);
  return (
    <span ref={ref} className={cn("tabular", className)}>
      {prefix}
      {formatNumber(current, decimals)}
      {suffix}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Rules & accents                                                             */
/* -------------------------------------------------------------------------- */

export function GlowRule({
  className,
  progress,
}: {
  className?: string;
  /** 0→1 explicit progress; omit to use a static hairline. */
  progress?: number;
}) {
  return (
    <div className={cn("relative h-px w-full overflow-hidden bg-ice/10", className)} aria-hidden>
      {progress === undefined ? (
        <div className="hairline absolute inset-0" />
      ) : (
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-core via-ice to-frost"
          style={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ duration: 0.4, ease: EASE.frost as never }}
        />
      )}
    </div>
  );
}

/** Big ghost numeral used behind section content. */
export function GhostIndex({ index, className }: { index: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute font-display text-[clamp(6rem,18vw,15rem)] leading-none font-bold select-none",
        "text-transparent [-webkit-text-stroke:1px_rgba(125,211,252,0.10)]",
        className,
      )}
    >
      {index}
    </span>
  );
}

/** Vertical mono label — used on pinned/cinematic sections. */
export function RailLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] tracking-[0.4em] text-ice/50 uppercase [writing-mode:vertical-rl]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function useLines(text: string) {
  return useMemo(() => text.split("\n").filter(Boolean), [text]);
}
