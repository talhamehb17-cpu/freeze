"use client";

import { memo } from "react";

import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * The facility elevation (spec §11 — Scenes 04/05).
 *
 * A hand-drawn SVG industrial facade. `open` (0→1) retracts the insulated
 * dock door upward, reveals the cold room, spills light across the apron and
 * releases mist. Everything is driven by one number so the hero timeline, the
 * temperature controller and the scroll sections can all animate the same
 * physical gesture.
 */

interface LoadingBayProps {
  /** 0 = sealed, 1 = fully open. */
  open?: number;
  /** Bay lighting on. */
  lights?: boolean;
  /** Refrigeration plant running (roof fans). */
  plant?: boolean;
  /** Interior light intensity 0→1. */
  glow?: number;
  /** Interior accent colour — shifts with the temperature control. */
  accent?: string;
  className?: string;
}

const DOOR = { x: 452, y: 128, w: 296, h: 252 };

export const LoadingBay = memo(function LoadingBay({
  open = 0,
  lights = true,
  plant = true,
  glow = 1,
  accent = "#7DD3FC",
  className,
}: LoadingBayProps) {
  const reduced = useReducedMotion();
  const spill = open * glow;

  /**
   * The SVG is driven by CSS custom properties, NOT by React props, so GSAP can
   * animate the whole opening gesture by tweening one number on the container.
   * Zero re-renders, zero layout thrash — the door, the light spill, the mist
   * and the interior all read `--bay-open`.
   */
  const cssVars = {
    "--bay-open": open,
    "--bay-glow": glow,
    "--bay-accent": accent,
    "--bay-spill": spill,
  } as React.CSSProperties;

  return (
    <svg
      viewBox="0 0 1200 480"
      className={cn("h-full w-full", className)}
      style={cssVars}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Cold storage facility loading bay"
    >
      <defs>
        <linearGradient id="bay-facade" x1="0" y1="40" x2="0" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#152235" />
          <stop offset="55%" stopColor="#0c1626" />
          <stop offset="100%" stopColor="#060c17" />
        </linearGradient>
        <linearGradient id="bay-apron" x1="0" y1="380" x2="0" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0a1220" />
          <stop offset="100%" stopColor="#04070f" />
        </linearGradient>
        <linearGradient id="bay-interior" x1="600" y1="128" x2="600" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
          <stop offset="46%" stopColor="#2b6f92" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#08182a" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id="bay-spill" x1="600" y1="360" x2="600" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accent} stopOpacity="0.6" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bay-door" x1="0" y1="128" x2="0" y2="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2a3d55" />
          <stop offset="48%" stopColor="#162334" />
          <stop offset="100%" stopColor="#0b1420" />
        </linearGradient>
        <radialGradient id="bay-lamp" cx="0.5" cy="0" r="1">
          <stop offset="0%" stopColor="#F4FAFF" stopOpacity="0.42" />
          <stop offset="45%" stopColor="#7DD3FC" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
        </radialGradient>
        <filter id="bay-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="bay-blur-sm" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <clipPath id="bay-mouth">
          <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} />
        </clipPath>
      </defs>

      {/* ------------------------------- apron ------------------------------- */}
      <rect x="0" y="378" width="1200" height="102" fill="url(#bay-apron)" />
      {/* expansion joints */}
      {[140, 340, 860, 1060].map((x) => (
        <line key={x} x1={x} y1="378" x2={x - 26} y2="480" stroke="#0e1826" strokeWidth="1.4" />
      ))}
      {/* wet reflections */}
      <ellipse cx="600" cy="432" rx="330" ry="44" fill={accent} opacity={0.05 + spill * 0.12} filter="url(#bay-blur)" />

      {/* ------------------------------ facade ------------------------------- */}
      <rect x="34" y="56" width="1132" height="324" fill="url(#bay-facade)" />
      {/* parapet */}
      <rect x="26" y="46" width="1148" height="14" rx="2" fill="#1b2a3d" />
      <rect x="26" y="46" width="1148" height="3" fill="#2d4257" opacity="0.9" />
      {/* cladding ribs */}
      {Array.from({ length: 46 }, (_, i) => (
        <rect key={i} x={44 + i * 24.6} y="60" width="2" height="318" fill="#050914" opacity="0.4" />
      ))}
      {/* horizontal banding */}
      <rect x="34" y="150" width="1132" height="1.6" fill="#22D3EE" opacity="0.14" />
      <rect x="34" y="252" width="1132" height="1.6" fill="#22D3EE" opacity="0.1" />

      {/* facade signage strip */}
      <g opacity="0.92">
        <rect x="112" y="88" width="248" height="34" rx="3" fill="#081426" stroke="#7DD3FC" strokeOpacity="0.28" />
        <text
          x="132"
          y="111"
          fill="#7DD3FC"
          fontSize="15"
          fontFamily="'JetBrains Mono Variable', monospace"
          letterSpacing="4.6"
        >
          TJ·COLD
        </text>
        <rect x="112" y="88" width="4" height="34" fill="#22D3EE" opacity="0.85" />
      </g>

      {/* -------------------------- roof plant -------------------------- */}
      {[196, 470, 742, 1010].map((x, i) => (
        <g key={x}>
          <rect x={x} y="20" width="112" height="28" rx="3" fill="#101c2c" stroke="#22D3EE" strokeOpacity="0.2" />
          <rect x={x + 6} y="26" width="60" height="16" rx="2" fill="#060d17" />
          {Array.from({ length: 6 }, (_, k) => (
            <rect key={k} x={x + 10 + k * 9.4} y="28" width="3" height="12" rx="1" fill="#1c2b3d" />
          ))}
          <g transform={`translate(${x + 88} 34)`}>
            <circle r="11" fill="#0a1420" stroke="#2b3a4d" strokeWidth="1" />
            <g
              className={plant && !reduced ? "wheel-spin" : undefined}
              style={{ transformOrigin: "0px 0px", animationDuration: `${2.6 + i * 0.5}s` }}
            >
              {[0, 90, 180, 270].map((deg) => (
                <path key={deg} d="M0 0 L8 -3.4 A9 9 0 0 1 8 3.4 Z" fill="#3d5568" transform={`rotate(${deg})`} />
              ))}
            </g>
            <circle r="2.2" fill={plant ? "#22C55E" : "#3d5568"} opacity={plant ? 0.95 : 0.4} />
          </g>
          {/* discharge stack */}
          <rect x={x + 22} y="4" width="10" height="18" rx="2" fill="#162334" />
        </g>
      ))}

      {/* ---------------------------- light masts ---------------------------- */}
      {[
        { x: 66, dir: 1 },
        { x: 1134, dir: -1 },
      ].map(({ x, dir }) => (
        <g key={x}>
          <rect x={x - 3} y="96" width="6" height="286" fill="#0e1826" />
          <rect x={x - 3} y="96" width="2" height="286" fill="#22D3EE" opacity="0.18" />
          <rect x={x - 26} y="86" width="52" height="14" rx="3" fill="#162334" />
          {lights && (
            <>
              <rect x={x - 22} y="90" width="44" height="7" rx="2" fill="#F4FAFF" opacity="0.85" />
              <path
                d={`M${x - 22} 100 L${x + 22} 100 L${x + dir * 150} 384 L${x + dir * 40} 384 Z`}
                fill="url(#bay-lamp)"
                opacity="0.75"
              />
            </>
          )}
        </g>
      ))}

      {/* ------------------------- secondary bays ------------------------- */}
      {[
        { x: 132, code: "BAY 01" },
        { x: 866, code: "BAY 03" },
      ].map(({ x, code }) => (
        <g key={x}>
          <rect x={x} y={DOOR.y + 42} width="200" height={DOOR.h - 42} rx="3" fill="#0d1826" stroke="#1e2f47" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={x + 4} y={DOOR.y + 50 + i * 22} width="192" height="3" rx="1.5" fill="#162334" />
          ))}
          <rect x={x} y={DOOR.y + 34} width="200" height="8" fill="#1b2a3d" />
          {/* hazard striping */}
          <g opacity="0.5">
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x={x + i * 17} y="374" width="9" height="6" fill="#F59E0B" transform={`skewX(-24)`} />
            ))}
          </g>
          <text
            x={x + 10}
            y={DOOR.y + 26}
            fill="#7DD3FC"
            fontSize="10"
            fontFamily="'JetBrains Mono Variable', monospace"
            letterSpacing="3"
            opacity="0.62"
          >
            {code}
          </text>
          <circle cx={x + 186} cy={DOOR.y + 22} r="3" fill={lights ? "#EF4444" : "#3d5568"} opacity="0.9" />
        </g>
      ))}

      {/* ======================= MAIN DOCK — BAY 02 ======================= */}
      <g>
        {/* door frame */}
        <rect x={DOOR.x - 16} y={DOOR.y - 20} width={DOOR.w + 32} height={DOOR.h + 22} rx="4" fill="#1b2a3d" />
        <rect x={DOOR.x - 16} y={DOOR.y - 20} width={DOOR.w + 32} height={DOOR.h + 22} rx="4" fill="none" stroke="#22D3EE" strokeOpacity={0.16 + spill * 0.5} />

        {/* ---------------- cold room interior (revealed) ---------------- */}
        <g
          clipPath="url(#bay-mouth)"
          data-bay-interior
          style={{ opacity: "calc(0.12 + var(--bay-spill, 0) * 0.88)" }}
        >
          <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="url(#bay-interior)" />
          {/* interior back wall */}
          <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="#04101c" opacity="0.32" />
          {/* ceiling lights */}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={DOOR.x + 34 + i * 92} y={DOOR.y + 18} width="62" height="5" rx="2" fill="#F4FAFF" opacity={0.55 + glow * 0.45} />
              <rect
                x={DOOR.x + 24 + i * 92}
                y={DOOR.y + 20}
                width="82"
                height="40"
                fill={accent}
                opacity={0.16 * glow}
                filter="url(#bay-blur-sm)"
              />
            </g>
          ))}
          {/* racking silhouettes */}
          {[0, 1, 2, 3].map((i) => (
            <g key={i} opacity="0.62">
              <rect x={DOOR.x + 16 + i * 72} y={DOOR.y + 74} width="58" height={DOOR.h - 92} fill="#071423" />
              {[0, 1, 2, 3].map((lv) => (
                <rect key={lv} x={DOOR.x + 16 + i * 72} y={DOOR.y + 92 + lv * 42} width="58" height="4" fill="#16324a" />
              ))}
              {/* pallets */}
              {[0, 1, 2].map((lv) => (
                <rect
                  key={lv}
                  x={DOOR.x + 22 + i * 72}
                  y={DOOR.y + 108 + lv * 42}
                  width="46"
                  height="24"
                  rx="2"
                  fill={i % 2 === 0 ? "#123049" : "#0e2438"}
                  opacity="0.95"
                />
              ))}
            </g>
          ))}
          {/* floor */}
          <rect x={DOOR.x} y={DOOR.y + DOOR.h - 26} width={DOOR.w} height="26" fill="#0a1e30" opacity="0.9" />
          <rect x={DOOR.x} y={DOOR.y + DOOR.h - 26} width={DOOR.w} height="2" fill={accent} opacity="0.4" />
          {/* bright core glow */}
          <ellipse
            cx={DOOR.x + DOOR.w / 2}
            cy={DOOR.y + DOOR.h * 0.62}
            rx={DOOR.w * 0.44}
            ry={DOOR.h * 0.4}
            fill={accent}
            opacity={0.2 * glow}
            filter="url(#bay-blur)"
          />
        </g>

        {/* ------------------- mist pouring out of the mouth ------------------- */}
        <g clipPath="url(#bay-mouth)" data-bay-mist style={{ opacity: "var(--bay-spill, 0)" }}>
          {!reduced && (
            <>
              <ellipse cx={DOOR.x + 90} cy={DOOR.y + DOOR.h - 14} rx="120" ry="30" fill="#F4FAFF" opacity="0.2" filter="url(#bay-blur-sm)">
                <animate attributeName="cx" values={`${DOOR.x + 90};${DOOR.x + 210};${DOOR.x + 90}`} dur="12s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.08;0.26;0.08" dur="12s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx={DOOR.x + 210} cy={DOOR.y + DOOR.h - 6} rx="140" ry="24" fill={accent} opacity="0.16" filter="url(#bay-blur-sm)">
                <animate attributeName="cx" values={`${DOOR.x + 210};${DOOR.x + 80};${DOOR.x + 210}`} dur="15s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.05;0.2;0.05" dur="15s" repeatCount="indefinite" />
              </ellipse>
            </>
          )}
        </g>

        {/* --------------------- the insulated door itself --------------------- */}
        {/* Vertical-lift door: it slides UP into the header, clipped to the mouth. */}
        <g clipPath="url(#bay-mouth)">
          <g
            data-bay-door
            style={{
              transform: "translateY(calc(var(--bay-open, 0) * -252px))",
              willChange: "transform",
            }}
          >
            <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="url(#bay-door)" />
            {/* panel ribs */}
            {Array.from({ length: 12 }, (_, i) => (
              <g key={i}>
                <rect x={DOOR.x + 4} y={DOOR.y + 10 + i * 21} width={DOOR.w - 8} height="4" rx="2" fill="#22303f" opacity="0.85" />
                <rect x={DOOR.x + 4} y={DOOR.y + 14 + i * 21} width={DOOR.w - 8} height="1" fill="#050914" opacity="0.7" />
              </g>
            ))}
            {/* bottom sealing edge */}
            <rect x={DOOR.x} y={DOOR.y + DOOR.h - 8} width={DOOR.w} height="8" rx="2" fill="#0a1420" />
            <rect x={DOOR.x} y={DOOR.y + DOOR.h - 8} width={DOOR.w} height="2" fill={accent} opacity="0.55" />
            {/* hazard chevrons */}
            <g opacity="0.55">
              {Array.from({ length: 16 }, (_, i) => (
                <rect key={i} x={DOOR.x + 8 + i * 18} y={DOOR.y + DOOR.h - 34} width="10" height="14" fill="#F59E0B" transform="skewX(-22)" />
              ))}
            </g>
            {/* centre latch */}
            <rect x={DOOR.x + DOOR.w / 2 - 3} y={DOOR.y + 40} width="6" height={DOOR.h - 80} rx="3" fill="#0a1420" opacity="0.65" />
          </g>
        </g>
        {/* door status lamp (outside the clip so it stays visible) */}
        <circle
          cx={DOOR.x + DOOR.w - 22}
          cy={DOOR.y - 8}
          r="5"
          fill={open > 0.05 ? "#22C55E" : "#EF4444"}
          opacity="0.95"
        />
        <circle
          cx={DOOR.x + DOOR.w - 22}
          cy={DOOR.y - 8}
          r="11"
          fill={open > 0.05 ? "#22C55E" : "#EF4444"}
          opacity="0.24"
          filter="url(#bay-blur-sm)"
        />

        {/* ---------------- light spill across the apron ---------------- */}
        <path
          d={`M${DOOR.x + 8} ${DOOR.y + DOOR.h} L${DOOR.x + DOOR.w - 8} ${DOOR.y + DOOR.h} L${DOOR.x + DOOR.w + 190} 480 L${DOOR.x - 190} 480 Z`}
          fill="url(#bay-spill)"
          data-bay-spill
          style={{ opacity: "calc(var(--bay-spill, 0) * 0.9)" }}
        />
        {/* ground mist outside the door */}
        <g style={{ opacity: "var(--bay-spill, 0)" }}>
          <ellipse cx="600" cy="424" rx="290" ry="34" fill="#F4FAFF" opacity="0.14" filter="url(#bay-blur)" />
          {!reduced && (
            <ellipse cx="600" cy="440" rx="340" ry="28" fill={accent} opacity="0.12" filter="url(#bay-blur)">
              <animate attributeName="rx" values="300;400;300" dur="14s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.05;0.16;0.05" dur="14s" repeatCount="indefinite" />
            </ellipse>
          )}
        </g>

        {/* dock leveller + bumpers */}
        <rect x={DOOR.x - 20} y="374" width={DOOR.w + 40} height="10" rx="2" fill="#101c2c" />
        <rect x={DOOR.x - 20} y="374" width={DOOR.w + 40} height="2" fill="#2b3a4d" />
        {/* bollards */}
        {[DOOR.x - 44, DOOR.x + DOOR.w + 36].map((x) => (
          <g key={x}>
            <rect x={x} y="342" width="12" height="42" rx="3" fill="#F59E0B" opacity="0.8" />
            <rect x={x} y="342" width="12" height="8" rx="2" fill="#0a121c" opacity="0.7" />
          </g>
        ))}

        {/* bay label */}
        <text
          x={DOOR.x}
          y={DOOR.y - 30}
          fill="#7DD3FC"
          fontSize="11"
          fontFamily="'JetBrains Mono Variable', monospace"
          letterSpacing="4"
          opacity="0.75"
        >
          BAY 02 · RECEIVING
        </text>
      </g>

      {/* ---------------------------- pallets ---------------------------- */}
      <g data-bay-cargo style={{ opacity: "min(1, calc(var(--bay-open, 0) * 1.3))" }}>
        {[
          { x: 320, y: 352, s: 1 },
          { x: 250, y: 356, s: 0.86 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x} ${p.y}) scale(${p.s})`}>
            <rect x="0" y="-34" width="72" height="34" rx="2" fill="#123049" stroke="#22D3EE" strokeOpacity="0.25" />
            <rect x="0" y="-22" width="72" height="2" fill="#22D3EE" opacity="0.3" />
            <rect x="-3" y="0" width="78" height="8" rx="1.5" fill="#3b2f22" />
            <rect x="6" y="2" width="10" height="6" fill="#0a0f18" opacity="0.6" />
            <rect x="34" y="2" width="10" height="6" fill="#0a0f18" opacity="0.6" />
            <rect x="62" y="2" width="10" height="6" fill="#0a0f18" opacity="0.6" />
          </g>
        ))}
      </g>

      {/* foreground vignette */}
    </svg>
  );
});
