import { cn } from "@/lib/utils";

/**
 * Brand mark.
 *
 * The TJ identity is an ICE CRYSTAL CELL: a hexagonal cold chamber holding a
 * six-arm crystal. It is the literal source of the whole colour system —
 * ice blue → electric cyan across the crystal, midnight behind it — so the
 * theme and the logo are always in sync.
 *
 * Drop-in replacement: swap `/public/assets/logo.svg` and this component reads
 * from it automatically when `useAsset` is set.
 */

export function LogoMark({
  className,
  animated = false,
  size = 40,
}: {
  className?: string;
  animated?: boolean;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="tj-crystal" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4FAFF" />
          <stop offset="38%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient id="tj-cell" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#7DD3FC" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="tj-core" cx="24" cy="24" r="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* cold glow behind the cell */}
      <circle cx="24" cy="24" r="15" fill="url(#tj-core)" />

      {/* hexagonal cold chamber */}
      <polygon
        points="24 3.4,41.8 13.7,41.8 34.3,24 44.6,6.2 34.3,6.2 13.7"
        stroke="url(#tj-cell)"
        strokeWidth="1.6"
        fill="rgba(8,20,38,0.55)"
        strokeLinejoin="round"
      />
      <polygon
        points="24 7.6,38.1 15.8,38.1 32.2,24 40.4,9.9 32.2,9.9 15.8"
        stroke="#7DD3FC"
        strokeOpacity="0.22"
        strokeWidth="0.9"
        fill="none"
        strokeLinejoin="round"
      />

      {/* six-arm ice crystal */}
      <g
        stroke="url(#tj-crystal)"
        strokeWidth="1.7"
        strokeLinecap="round"
        className={animated ? "origin-center" : undefined}
      >
        <g className={animated ? "[animation:spin_24s_linear_infinite] origin-[24px_24px]" : undefined}>
          {/* three axes */}
          <line x1="11.5" y1="24" x2="36.5" y2="24" />
          <line x1="17.75" y1="13.2" x2="30.25" y2="34.8" />
          <line x1="30.25" y1="13.2" x2="17.75" y2="34.8" />
          {/* barbs */}
          <path d="M31.5 24 L34.6 21.4 M31.5 24 L34.6 26.6" strokeWidth="1.2" />
          <path d="M16.5 24 L13.4 21.4 M16.5 24 L13.4 26.6" strokeWidth="1.2" />
          <path d="M27.7 16.7 L27.4 12.6 M27.7 16.7 L31.5 15.5" strokeWidth="1.2" />
          <path d="M20.3 31.3 L20.6 35.4 M20.3 31.3 L16.5 32.5" strokeWidth="1.2" />
          <path d="M20.3 16.7 L20.6 12.6 M20.3 16.7 L16.5 15.5" strokeWidth="1.2" />
          <path d="M27.7 31.3 L27.4 35.4 M27.7 31.3 L31.5 32.5" strokeWidth="1.2" />
        </g>
      </g>

      <circle cx="24" cy="24" r="2.1" fill="#F4FAFF" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  animated = false,
  compact = false,
  size = 40,
}: {
  className?: string;
  markClassName?: string;
  animated?: boolean;
  compact?: boolean;
  size?: number;
}) {
  return (
    <span className={cn("group/logo inline-flex items-center gap-3", className)}>
      <span className="relative inline-flex">
        <span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-cyan-core/25 blur-xl opacity-0 transition-opacity duration-500 group-hover/logo:opacity-100"
        />
        <LogoMark size={size} animated={animated} className={markClassName} />
      </span>

      {!compact && (
        <span className="flex flex-col justify-center leading-none">
          <span className="font-display text-[0.98rem] font-bold tracking-[0.16em] text-frost uppercase sm:text-[1.05rem]">
            Tahseen&nbsp;Jaber
          </span>
          <span className="mt-[0.32rem] font-mono text-[0.55rem] tracking-[0.3em] text-ice/70 uppercase sm:text-[0.6rem]">
            Cold Storage
            <span className="mx-1 text-cyan-core">·</span>
            Logistics
          </span>
        </span>
      )}
    </span>
  );
}

/** Vertical lockup used in the footer and on auth screens. */
export function LogoStacked({ className, size = 56 }: { className?: string; size?: number }) {
  return (
    <div className={cn("flex flex-col items-start gap-4", className)}>
      <LogoMark size={size} animated />
      <div className="leading-none">
        <div className="font-display text-xl font-bold tracking-[0.14em] text-frost uppercase">
          Tahseen Jaber
        </div>
        <div className="mt-2 font-display text-[0.82rem] font-medium tracking-[0.34em] text-ice/80 uppercase">
          Cold Storage
        </div>
        <div className="mt-1 font-mono text-[0.66rem] tracking-[0.34em] text-silver/60 uppercase">
          &amp; Logistics
        </div>
      </div>
    </div>
  );
}
