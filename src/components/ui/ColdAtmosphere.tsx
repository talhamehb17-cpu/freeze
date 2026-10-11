"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

import { useTemperature } from "@/components/atmosphere/TemperatureProvider";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Global cold atmosphere (spec §09).
 *
 * Five deliberately slow layers — no neon, no busy particles:
 *   1. Depth gradient        (CSS)
 *   2. Light shafts          (CSS, blurred, 40s+ drift)
 *   3. Ground mist           (CSS, two counter-drifting sheets)
 *   4. Frost motes           (canvas, ≤40 particles, near-static)
 *   5. Frost texture + grain (SVG / CSS overlay)
 *
 * Frost density, mist volume and light colour all read from the global
 * temperature, so one control changes the entire room.
 */

export function ColdAtmosphere({
  className,
  density = 1,
  withGrain = true,
}: {
  className?: string;
  density?: number;
  withGrain?: boolean;
}) {
  const reduced = useReducedMotion();
  const { frost, mist, lightColor } = useTemperature();

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}
      aria-hidden="true"
    >
      {/* 1 — depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 82% at 50% -12%, #0d2138 0%, #081426 42%, #050914 78%, #03060e 100%)",
        }}
      />

      {/* 2 — light shafts */}
      <div className="absolute inset-0 opacity-70 mix-blend-screen">
        <div
          className={cn("absolute -top-[26%] left-[12%] h-[86vh] w-[26vw] blur-[70px]", !reduced && "animate-breathe")}
          style={{
            background: `linear-gradient(180deg, ${lightColor}22, transparent 78%)`,
            transform: "rotate(9deg)",
            opacity: 0.35 + frost * 0.35,
          }}
        />
        <div
          className={cn("absolute -top-[30%] right-[8%] h-[92vh] w-[18vw] blur-[80px]", !reduced && "animate-breathe")}
          style={{
            background: `linear-gradient(180deg, ${lightColor}1e, transparent 74%)`,
            transform: "rotate(-11deg)",
            animationDelay: "-3.5s",
            opacity: 0.28 + frost * 0.3,
          }}
        />
      </div>

      {/* 3 — ground mist */}
      <div className="absolute inset-x-0 bottom-0 h-[52vh] overflow-hidden">
        <div
          className={cn("absolute inset-x-[-20%] bottom-[-12%] h-[70%]", !reduced && "animate-mist")}
          style={{
            background:
              "radial-gradient(60% 100% at 30% 100%, rgba(244,250,255,0.16), transparent 70%), radial-gradient(52% 100% at 72% 100%, rgba(125,211,252,0.14), transparent 72%)",
            filter: "blur(28px)",
            opacity: 0.35 + mist * 0.6,
          }}
        />
        <div
          className={cn("absolute inset-x-[-25%] bottom-[-18%] h-[62%]", !reduced && "animate-mist")}
          style={{
            background:
              "radial-gradient(48% 100% at 55% 100%, rgba(244,250,255,0.12), transparent 74%)",
            filter: "blur(38px)",
            animationDelay: "-13s",
            animationDuration: "34s",
            opacity: 0.3 + mist * 0.45,
          }}
        />
      </div>

      {/* 4 — frost motes */}
      {!reduced && <FrostMotes density={density} frost={frost} />}

      {/* 5 — frost texture + vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 92% at 50% 44%, transparent 44%, rgba(3,6,14,0.55) 88%, rgba(3,6,14,0.9) 100%)",
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: 0.1 + frost * 0.28,
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(244,250,255,0.11), transparent 26%)," +
            "radial-gradient(circle at 84% 22%, rgba(244,250,255,0.09), transparent 22%)," +
            "radial-gradient(circle at 62% 88%, rgba(125,211,252,0.08), transparent 28%)," +
            "radial-gradient(circle at 8% 78%, rgba(125,211,252,0.07), transparent 24%)",
          filter: "blur(1px)",
        }}
      />
      {withGrain && (
        <div
          className="noise-layer absolute inset-0 opacity-[0.045] mix-blend-overlay"
          style={{ backgroundSize: "160px 160px" }}
        />
      )}
    </div>
  );
}

/**
 * Sparse frost motes on canvas.
 * Budget: ≤40 particles at ~0.1px/frame. Pauses when the tab is hidden.
 */
function FrostMotes({ density, frost }: { density: number; frost: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    type Mote = { x: number; y: number; r: number; vx: number; vy: number; a: number; phase: number };
    let motes: Mote[] = [];

    const build = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round(Math.min(40, Math.max(14, (width / 1440) * 30)) * density);
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.5 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.09,
        vy: -0.04 - Math.random() * 0.11,
        a: 0.12 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    build();

    let t = 0;
    const draw = () => {
      t += 0.006;
      ctx.clearRect(0, 0, width, height);
      for (const m of motes) {
        m.x += m.vx + Math.sin(t + m.phase) * 0.06;
        m.y += m.vy;
        if (m.y < -8) {
          m.y = height + 6;
          m.x = Math.random() * width;
        }
        if (m.x < -8) m.x = width + 6;
        if (m.x > width + 8) m.x = -6;

        const twinkle = 0.6 + 0.4 * Math.sin(t * 2.4 + m.phase);
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(244,250,255,${(m.a * twinkle * (0.5 + frost * 0.7)).toFixed(3)})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => build();
    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [density, frost]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

/** Section-scoped mist sheet — used inside individual sections for depth. */
export function SectionMist({
  className,
  tone = "#7DD3FC",
  opacity = 0.16,
}: {
  className?: string;
  tone?: string;
  opacity?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.6 }}
    >
      <div
        className={cn("absolute inset-x-[-15%] bottom-[-20%] h-[65%] blur-[60px]", !reduced && "animate-mist")}
        style={{
          background: `radial-gradient(58% 100% at 40% 100%, ${tone}${Math.round(opacity * 255)
            .toString(16)
            .padStart(2, "0")}, transparent 72%)`,
        }}
      />
    </motion.div>
  );
}
