"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";

import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Magnetic button (spec §14 / §32).
 *
 * The button drifts toward the pointer while its arrow leads the movement —
 * a small, precise gesture. Strength is deliberately low; this is engineering,
 * not a bounce house.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface SharedProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  magnetic?: boolean;
  full?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-[10px] gap-2",
  md: "h-12 px-6 text-[11px] gap-2.5",
  lg: "h-[3.6rem] px-8 text-[12px] gap-3",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    "cta-primary sweep-host text-midnight font-bold",
    "bg-[linear-gradient(135deg,#b8ecff_0%,#7DD3FC_26%,#22D3EE_60%,#0891b2_100%)]",
    "shadow-[0_0_0_1px_rgba(125,211,252,0.55),0_18px_46px_-20px_rgba(34,211,238,0.9)]",
    "hover:shadow-[0_0_0_1px_rgba(244,250,255,0.75),0_26px_66px_-18px_rgba(34,211,238,1)]",
  ),
  secondary: cn(
    "text-frost border border-ice/25 bg-industrial/40 backdrop-blur-md",
    "hover:border-cyan-core/70 hover:bg-industrial/70",
    "shadow-[inset_0_1px_0_rgba(244,250,255,0.07)]",
  ),
  ghost: cn("text-silver border border-transparent hover:text-frost hover:border-ice/20 hover:bg-ice/[0.05]"),
  danger: cn("text-frost border border-danger/45 bg-danger/12 hover:bg-danger/22 hover:border-danger/80"),
};

const BASE =
  "group/btn relative inline-flex items-center justify-center overflow-hidden rounded-lg font-mono uppercase tracking-[0.2em] whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-45 select-none";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5 animate-spin", className)} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Content({ children, icon, iconRight, loading, loadingText = "Processing" }: SharedProps) {
  return (
    <>
      {loading && (
        <span className="absolute inset-0 z-10 flex items-center justify-center gap-2">
          <Spinner />
          <span>{loadingText}</span>
        </span>
      )}
      {icon && (
        <span className="relative shrink-0 transition-transform duration-300 group-hover/btn:-translate-y-px">
          {icon}
        </span>
      )}
      <span className={cn("relative", loading && "opacity-0")}>{children}</span>
      {iconRight && (
        <span
          className={cn(
            "relative shrink-0 transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-1.5",
            loading && "opacity-0",
          )}
        >
          {iconRight}
        </span>
      )}
    </>
  );
}

function MagneticShell({
  enabled,
  full,
  render,
}: {
  enabled: boolean;
  full?: boolean;
  render: (style: CSSProperties) => ReactNode;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 260, damping: 22, mass: 0.4 });
  const sy = useSpring(my, { stiffness: 260, damping: 22, mass: 0.4 });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      mx.set((event.clientX - (rect.left + rect.width / 2)) * 0.3);
      my.set((event.clientY - (rect.top + rect.height / 2)) * 0.36);
    };
    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, mx, my]);

  if (!enabled) {
    return (
      <span ref={ref} className={cn("inline-flex max-w-full", full && "w-full")}>
        {render({})}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      style={{ x: sx, y: sy }}
      className={cn("inline-flex max-w-full will-change-transform", full && "w-full")}
    >
      {render({})}
    </motion.span>
  );
}

export type MagneticButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps>;

export function MagneticButton({
  children,
  variant = "secondary",
  size = "md",
  className,
  icon,
  iconRight,
  magnetic = true,
  full = false,
  loading = false,
  loadingText,
  ...rest
}: MagneticButtonProps) {
  const reduced = useReducedMotion();

  return (
    <MagneticShell enabled={magnetic && !reduced && !loading} full={full} render={() => (
      <button
        {...rest}
        type={rest.type ?? "button"}
        disabled={rest.disabled || loading}
        data-cta={variant === "primary" ? "true" : undefined}
        className={cn(BASE, SIZES[size], VARIANTS[variant], full && "w-full", className)}
      >
        <Content
          icon={icon}
          iconRight={iconRight}
          loading={loading}
          loadingText={loadingText}
        >
          {children}
        </Content>
      </button>
    )}
    />
  );
}

export type MagneticLinkProps = SharedProps & { href: string; external?: boolean };

export function MagneticLink({
  children,
  href,
  variant = "secondary",
  size = "md",
  className,
  icon,
  iconRight,
  magnetic = true,
  full = false,
  loading = false,
  loadingText,
  external = false,
}: MagneticLinkProps) {
  const reduced = useReducedMotion();
  const classNameAll = cn(BASE, SIZES[size], VARIANTS[variant], full && "w-full", className);
  const content = (
    <Content icon={icon} iconRight={iconRight} loading={loading} loadingText={loadingText}>
      {children}
    </Content>
  );

  return (
    <MagneticShell enabled={magnetic && !reduced} full={full} render={() => {
      if (external || href.startsWith("http")) {
        return (
          <a
            href={href}
            className={classNameAll}
            data-cta={variant === "primary" ? "true" : undefined}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        );
      }
      return (
        <Link href={href} className={classNameAll} data-cta={variant === "primary" ? "true" : undefined}>
          {content}
        </Link>
      );
    }}
    />
  );
}

/** Compact chip used inside HUD panels, filters and tables. */
export function ChipButton({
  children,
  className,
  active,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-all duration-300",
        active
          ? "border-cyan-core/70 bg-cyan-core/14 text-frost shadow-[0_0_18px_-6px_rgba(34,211,238,0.7)]"
          : "border-ice/16 bg-industrial/40 text-silver hover:border-ice/40 hover:text-frost",
        className,
      )}
    >
      {children}
    </button>
  );
}
