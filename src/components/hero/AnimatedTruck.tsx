"use client";

import { memo } from "react";

import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * The refrigerated truck.
 *
 * Hand-built SVG — not a cartoon, not a stock icon. A tractor + insulated
 * reefer trailer in three-quarter side elevation with:
 *   • a ribbed insulated box and a working rear door seam
 *   • a nose-mount refrigeration unit with vents and a status display
 *   • a cyan cold-strip livery taken straight from the brand mark
 *   • rims that actually rotate, with brake discs and hub detail
 *   • headlight cone, under-glow and cold vapour from the reefer discharge
 *
 * Wheels spin only while the vehicle is moving, and never for reduced-motion
 * users (spec §07 / §34).
 */

interface TruckProps {
  className?: string;
  /** Wheels rotate while true. */
  moving?: boolean;
  /** Headlights + beam on. */
  lights?: boolean;
  /** Reefer unit running (fan + display + vapour). */
  reeferOn?: boolean;
  /** Brand stripe opacity — ramps up as the truck arrives. */
  livery?: number;
}

const WHEELS = [
  { cx: 96, cy: 196 },
  { cx: 162, cy: 196 },
  { cx: 432, cy: 196 },
  { cx: 486, cy: 196 },
  { cx: 552, cy: 196 },
] as const;

function Wheel({ cx, cy, spin }: { cx: number; cy: number; spin: boolean }) {
  return (
    <g>
      {/* tyre */}
      <circle cx={cx} cy={cy} r="27" fill="#0a0f18" />
      <circle cx={cx} cy={cy} r="27" fill="none" stroke="#1b2635" strokeWidth="2" />
      <circle cx={cx} cy={cy} r="21" fill="none" stroke="#151f2c" strokeWidth="5" />
      {/* rim */}
      <g
        className={spin ? "wheel-spin" : undefined}
        style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "view-box" }}
      >
        <circle cx={cx} cy={cy} r="16" fill="url(#tj-rim)" />
        <circle cx={cx} cy={cy} r="16" fill="none" stroke="#9fb3c8" strokeWidth="1.1" strokeOpacity="0.6" />
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <rect
            key={deg}
            x={cx - 1.6}
            y={cy - 14.5}
            width="3.2"
            height="11"
            rx="1.4"
            fill="#0d1622"
            opacity="0.75"
            transform={`rotate(${deg} ${cx} ${cy})`}
          />
        ))}
        <circle cx={cx} cy={cy} r="4.6" fill="#22303f" />
        <circle cx={cx} cy={cy} r="2" fill="#7DD3FC" opacity="0.55" />
      </g>
      {/* brake disc highlight */}
      <circle cx={cx} cy={cy} r="9" fill="none" stroke="#2b3a4d" strokeWidth="0.8" opacity="0.7" />
    </g>
  );
}

export const AnimatedTruck = memo(function AnimatedTruck({
  className,
  moving = false,
  lights = true,
  reeferOn = true,
  livery = 1,
}: TruckProps) {
  const reduced = useReducedMotion();
  const spin = moving && !reduced;

  return (
    <svg
      viewBox="0 0 640 250"
      className={cn("h-full w-full overflow-visible", className)}
      role="img"
      aria-label="Refrigerated truck arriving at the loading bay"
    >
      <defs>
        <linearGradient id="tj-box" x1="0" y1="40" x2="0" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4FAFF" />
          <stop offset="42%" stopColor="#dce9f5" />
          <stop offset="100%" stopColor="#93a6bb" />
        </linearGradient>
        <linearGradient id="tj-box-shade" x1="16" y1="0" x2="396" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#050914" stopOpacity="0.42" />
          <stop offset="18%" stopColor="#050914" stopOpacity="0" />
          <stop offset="82%" stopColor="#050914" stopOpacity="0" />
          <stop offset="100%" stopColor="#050914" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id="tj-cab" x1="396" y1="60" x2="580" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1d2c40" />
          <stop offset="48%" stopColor="#101c2c" />
          <stop offset="100%" stopColor="#070d17" />
        </linearGradient>
        <linearGradient id="tj-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.85" />
          <stop offset="52%" stopColor="#2b6f92" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#0b1a29" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="tj-reefer" x1="320" y1="18" x2="400" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2a3d55" />
          <stop offset="100%" stopColor="#0e1826" />
        </linearGradient>
        <linearGradient id="tj-stripe" x1="16" y1="0" x2="396" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.15" />
          <stop offset="26%" stopColor="#22D3EE" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#7DD3FC" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="tj-rim" cx="0.35" cy="0.3" r="0.85">
          <stop offset="0%" stopColor="#c9d8e6" />
          <stop offset="55%" stopColor="#7b8ca0" />
          <stop offset="100%" stopColor="#2c3949" />
        </radialGradient>
        <linearGradient id="tj-beam" x1="576" y1="150" x2="760" y2="205" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4FAFF" stopOpacity="0.55" />
          <stop offset="40%" stopColor="#7DD3FC" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="tj-underglow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <filter id="tj-soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="tj-vapour" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* ground contact shadow */}
      <ellipse cx="320" cy="228" rx="300" ry="12" fill="#000" opacity="0.55" filter="url(#tj-soft)" />

      {/* cyan under-glow */}
      <ellipse cx="320" cy="224" rx="270" ry="18" fill="url(#tj-underglow)" opacity={lights ? 0.5 : 0.16} />

      {/* ---------------------------- trailer ---------------------------- */}
      <g>
        {/* chassis rail */}
        <rect x="24" y="176" width="378" height="9" rx="2" fill="#0d1520" />
        <rect x="24" y="176" width="378" height="2" fill="#26374a" opacity="0.7" />
        {/* landing gear */}
        <rect x="300" y="184" width="9" height="26" rx="2" fill="#131d2a" />
        <rect x="294" y="206" width="21" height="6" rx="2" fill="#0c141e" />

        {/* insulated box */}
        <rect x="16" y="40" width="380" height="138" rx="5" fill="url(#tj-box)" />
        <rect x="16" y="40" width="380" height="138" rx="5" fill="url(#tj-box-shade)" />
        {/* top rail */}
        <rect x="16" y="40" width="380" height="7" rx="3" fill="#e8f2fb" />
        <rect x="16" y="40" width="380" height="2" fill="#ffffff" opacity="0.9" />
        {/* bottom rail */}
        <rect x="16" y="170" width="380" height="8" rx="2" fill="#7b8ca0" />

        {/* panel ribs */}
        {Array.from({ length: 17 }, (_, i) => (
          <rect
            key={i}
            x={30 + i * 22}
            y="50"
            width="1.6"
            height="118"
            fill="#0b1a29"
            opacity="0.1"
          />
        ))}
        {/* seam lines */}
        <rect x="128" y="48" width="1.2" height="122" fill="#0b1a29" opacity="0.22" />
        <rect x="250" y="48" width="1.2" height="122" fill="#0b1a29" opacity="0.22" />

        {/* brand cold strip */}
        <g opacity={livery}>
          <rect x="16" y="118" width="380" height="16" fill="url(#tj-stripe)" />
          <rect x="16" y="118" width="380" height="1.2" fill="#F4FAFF" opacity="0.65" />
          <rect x="16" y="133" width="380" height="1.2" fill="#0b1a29" opacity="0.28" />
        </g>

        {/* monogram plate */}
        <g opacity={livery} transform="translate(48 66)">
          <rect width="76" height="40" rx="4" fill="#081426" opacity="0.9" />
          <rect width="76" height="40" rx="4" fill="none" stroke="#7DD3FC" strokeOpacity="0.45" />
          <path
            d="M14 12 h16 M22 12 v18 M32 12 h14 M39 12 v18 M46 20 h10"
            stroke="#7DD3FC"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
          <rect x="8" y="34" width="60" height="1.4" fill="#22D3EE" opacity="0.6" />
        </g>

        {/* rear doors (left end) */}
        <rect x="16" y="48" width="14" height="122" rx="2" fill="#c3d3e2" />
        <rect x="16" y="48" width="14" height="122" rx="2" fill="#0b1a29" opacity="0.14" />
        <rect x="26" y="60" width="2.4" height="98" rx="1.2" fill="#8496a9" />
        <circle cx="22" cy="70" r="1.8" fill="#5d6f86" />
        <circle cx="22" cy="150" r="1.8" fill="#5d6f86" />
        {/* rear bumper / underride */}
        <rect x="12" y="176" width="20" height="26" rx="3" fill="#101a26" />
        <rect x="8" y="196" width="28" height="7" rx="2" fill="#0a121c" />
        {/* tail lamp */}
        <rect x="14" y="150" width="7" height="12" rx="2" fill="#EF4444" opacity="0.85" />
        <rect x="14" y="150" width="7" height="12" rx="2" fill="#EF4444" opacity="0.4" filter="url(#tj-soft)" />

        {/* --------------------- refrigeration unit --------------------- */}
        <g>
          <rect x="316" y="16" width="86" height="46" rx="5" fill="url(#tj-reefer)" />
          <rect x="316" y="16" width="86" height="46" rx="5" fill="none" stroke="#7DD3FC" strokeOpacity="0.3" />
          {/* intake grille */}
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} x={324 + i * 6} y="24" width="3" height="22" rx="1.4" fill="#050914" opacity="0.75" />
          ))}
          {/* fan */}
          <g transform="translate(378 36)">
            <circle r="13" fill="#0a1420" stroke="#2b3a4d" />
            <g
              className={reeferOn && !reduced ? "wheel-spin" : undefined}
              style={{ transformOrigin: "0px 0px", animationDuration: "1.6s" }}
            >
              {[0, 90, 180, 270].map((deg) => (
                <path
                  key={deg}
                  d="M0 0 L9 -4 A10 10 0 0 1 9 4 Z"
                  fill="#4a5f78"
                  transform={`rotate(${deg})`}
                />
              ))}
            </g>
            <circle r="2.6" fill="#7DD3FC" opacity={reeferOn ? 0.9 : 0.3} />
          </g>
          {/* status display */}
          <rect x="324" y="50" width="42" height="9" rx="2" fill="#04121d" />
          <rect
            x="326"
            y="52"
            width={reeferOn ? 26 : 8}
            height="5"
            rx="1"
            fill={reeferOn ? "#22D3EE" : "#3d5568"}
            opacity={reeferOn ? 0.95 : 0.5}
          />
          <circle cx="392" cy="54" r="2.6" fill={reeferOn ? "#22C55E" : "#3d5568"} />

          {/* cold vapour from the discharge */}
          {reeferOn && !reduced && (
            <g filter="url(#tj-vapour)" opacity="0.5">
              <ellipse cx="308" cy="52" rx="26" ry="9" fill="#F4FAFF" opacity="0.2">
                <animate attributeName="cx" values="312;278;312" dur="7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.05;0.26;0.05" dur="7s" repeatCount="indefinite" />
              </ellipse>
              <ellipse cx="300" cy="64" rx="18" ry="6" fill="#7DD3FC" opacity="0.16">
                <animate attributeName="cx" values="304;272;304" dur="9s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.04;0.2;0.04" dur="9s" repeatCount="indefinite" />
              </ellipse>
            </g>
          )}
        </g>
      </g>

      {/* ------------------------------ tractor ------------------------------ */}
      <g>
        {/* fifth wheel / gap filler */}
        <rect x="392" y="160" width="46" height="18" rx="3" fill="#0c141e" />

        {/* cab body */}
        <path
          d="M398 182 L398 96 Q398 78 418 74 L508 62 Q534 59 546 78 L566 112 Q578 122 578 140 L578 182 Z"
          fill="url(#tj-cab)"
        />
        <path
          d="M398 182 L398 96 Q398 78 418 74 L508 62 Q534 59 546 78 L566 112 Q578 122 578 140 L578 182 Z"
          fill="none"
          stroke="#7DD3FC"
          strokeOpacity="0.22"
        />

        {/* roof deflector */}
        <path d="M404 78 Q404 58 428 55 L502 47 Q520 45 524 60 L524 72 Z" fill="#162334" />
        <path d="M404 78 Q404 58 428 55 L502 47" fill="none" stroke="#7DD3FC" strokeOpacity="0.3" strokeWidth="1.2" />
        {/* roof marker lamps */}
        {[436, 456, 476, 496].map((x, i) => (
          <circle key={x} cx={x} cy={52} r="2.2" fill="#F59E0B" opacity={lights ? 0.85 : 0.3}>
            {lights && !reduced && (
              <animate
                attributeName="opacity"
                values="0.85;0.4;0.85"
                dur="3.2s"
                begin={`${i * 0.4}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}

        {/* windscreen */}
        <path d="M424 84 L508 74 Q522 73 528 84 L540 112 L424 116 Z" fill="url(#tj-glass)" />
        <path d="M424 84 L508 74 Q522 73 528 84 L540 112 L424 116 Z" fill="none" stroke="#7DD3FC" strokeOpacity="0.35" />
        {/* glass reflection */}
        <path d="M432 88 L498 80 L470 112 L432 113 Z" fill="#F4FAFF" opacity="0.09" />

        {/* side window */}
        <path d="M410 118 L420 118 L420 148 L410 148 Z" fill="url(#tj-glass)" opacity="0.8" />
        {/* door seam + handle */}
        <path d="M424 116 L424 182" stroke="#050914" strokeOpacity="0.55" strokeWidth="1.6" fill="none" />
        <rect x="430" y="130" width="16" height="4" rx="2" fill="#4a5f78" />
        {/* mirror */}
        <path d="M540 96 L556 90 L558 104 L544 108 Z" fill="#101c2c" stroke="#7DD3FC" strokeOpacity="0.25" />
        <path d="M540 96 L544 108" stroke="#2b3a4d" strokeWidth="2" />

        {/* cab side cold stripe */}
        <rect x="398" y="150" width="180" height="7" fill="url(#tj-stripe)" opacity={livery} />

        {/* front grille */}
        <rect x="556" y="126" width="24" height="40" rx="4" fill="#0a121c" />
        {Array.from({ length: 4 }, (_, i) => (
          <rect key={i} x="558" y={131 + i * 9} width="20" height="3.4" rx="1.6" fill="#22303f" />
        ))}

        {/* headlight */}
        <g>
          <rect x="558" y="168" width="22" height="11" rx="3" fill={lights ? "#F4FAFF" : "#4a5f78"} />
          {lights && (
            <>
              <rect x="558" y="168" width="22" height="11" rx="3" fill="#7DD3FC" opacity="0.65" filter="url(#tj-soft)" />
              <circle cx="569" cy="173.5" r="14" fill="#7DD3FC" opacity="0.22" filter="url(#tj-soft)" />
            </>
          )}
        </g>

        {/* headlight beam */}
        {lights && (
          <path d="M580 164 L760 132 L760 224 L580 184 Z" fill="url(#tj-beam)" opacity="0.5" />
        )}

        {/* bumper */}
        <rect x="548" y="182" width="34" height="16" rx="4" fill="#0c141e" />
        <rect x="548" y="182" width="34" height="3" rx="1.5" fill="#2b3a4d" />

        {/* fuel tank + steps */}
        <rect x="440" y="164" width="60" height="20" rx="7" fill="#131d2a" stroke="#2b3a4d" strokeWidth="0.9" />
        <rect x="424" y="176" width="24" height="6" rx="2" fill="#0a121c" />
        {/* exhaust stack */}
        <rect x="404" y="86" width="7" height="76" rx="3.5" fill="#1b2635" />
        <rect x="403" y="82" width="9" height="6" rx="2" fill="#2b3a4d" />

        {/* mudguards */}
        <path d="M404 196 Q404 164 436 164 Q468 164 468 196" fill="none" stroke="#131d2a" strokeWidth="7" />
        <path d="M524 196 Q524 166 552 166 Q580 166 580 196" fill="none" stroke="#131d2a" strokeWidth="7" />
      </g>

      {/* ------------------------------- wheels ------------------------------- */}
      {WHEELS.map((w) => (
        <Wheel key={`${w.cx}-${w.cy}`} cx={w.cx} cy={w.cy} spin={spin} />
      ))}

      {/* contact highlights */}
      {WHEELS.map((w) => (
        <ellipse key={`g-${w.cx}`} cx={w.cx} cy={224} rx="20" ry="3.5" fill="#000" opacity="0.6" />
      ))}
    </svg>
  );
});

/**
 * Lightweight version for the logistics map + fleet strip — same silhouette,
 * far fewer nodes, so it stays cheap while animating along a route.
 */
export const TruckGlyph = memo(function TruckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 28" className={cn("h-full w-full", className)} aria-hidden>
      <rect x="2" y="4" width="34" height="15" rx="2" fill="#F4FAFF" opacity="0.92" />
      <rect x="2" y="14" width="34" height="2.4" fill="#22D3EE" />
      <path d="M37 19 L37 8 Q37 6 39 6 L50 5 Q53 5 54 8 L59 13 Q61 15 61 18 L61 19 Z" fill="#152235" />
      <path d="M40 9 L50 8 L54 13 L40 13 Z" fill="#7DD3FC" opacity="0.7" />
      <circle cx="13" cy="21" r="4" fill="#0a0f18" />
      <circle cx="13" cy="21" r="1.6" fill="#7DD3FC" opacity="0.6" />
      <circle cx="46" cy="21" r="4" fill="#0a0f18" />
      <circle cx="46" cy="21" r="1.6" fill="#7DD3FC" opacity="0.6" />
      <circle cx="56" cy="21" r="4" fill="#0a0f18" />
      <circle cx="56" cy="21" r="1.6" fill="#7DD3FC" opacity="0.6" />
    </svg>
  );
});
