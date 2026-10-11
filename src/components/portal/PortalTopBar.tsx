"use client";

import { motion } from "framer-motion";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { logoutAction } from "@/lib/auth/actions";
import { EASE } from "@/animations/presets";
import { LogoMark } from "@/components/brand/Logo";
import { DemoBadge } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import { BRAND } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

/**
 * Signed-in top bar. Minimal on purpose: the portal content is dense, so the
 * chrome carries only identity, a way home and a way out.
 */
export function PortalTopBar({
  user,
  section = "Client portal",
  adminHref,
}: {
  user: SessionUser;
  section?: string;
  adminHref?: string;
}) {
  const reduced = useReducedMotion();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [leaving, setLeaving] = useState(false);

  const signOut = () => {
    setLeaving(true);
    startTransition(async () => {
      await logoutAction();
      router.replace("/");
      router.refresh();
    });
  };

  const initials = user.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ice/12 bg-midnight/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.4rem] w-full max-w-[1700px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group/tb flex shrink-0 items-center gap-3" aria-label={`${BRAND.name} — home`}>
            <LogoMark size={32} animated />
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-[0.82rem] font-bold tracking-[0.14em] text-frost uppercase">
                {BRAND.name}
              </span>
              <span className="mt-1 block font-mono text-[7px] tracking-[0.26em] text-ice/70 uppercase">
                {BRAND.suffix}
              </span>
            </span>
          </Link>

          <span className="hidden h-6 w-px bg-ice/12 sm:block" aria-hidden />

          <div className="flex min-w-0 items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cool" aria-hidden />
            <span className="truncate font-mono text-[9px] tracking-[0.24em] text-silver/70 uppercase">
              {section}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <DemoBadge size="xs" label="Demo build" className="hidden md:flex" />

            {adminHref && (
              <Link
                href={adminHref}
                className="hidden items-center gap-2 rounded-md border border-ice/15 px-3 py-1.5 font-mono text-[8px] tracking-[0.18em] text-silver/70 uppercase transition-colors duration-300 hover:border-cyan-core/55 hover:text-cyan-core lg:flex"
              >
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Command centre
              </Link>
            )}

            <div className="flex items-center gap-2.5 rounded-md border border-ice/12 bg-navy/60 py-1.5 pr-3 pl-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-cyan-core/25 to-ice/15 font-display text-[10px] font-bold tracking-[0.06em] text-frost">
                {initials || "TJ"}
              </span>
              <span className="hidden leading-none sm:block">
                <span className="block max-w-[9rem] truncate font-mono text-[9px] tracking-[0.08em] text-frost">
                  {user.name}
                </span>
                <span className="mt-1 block font-mono text-[7px] tracking-[0.2em] text-cyan-core/80 uppercase">
                  {user.role}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={signOut}
              disabled={pending}
              className={cn(
                "group/out flex items-center gap-2 rounded-md border border-ice/15 px-3 py-2",
                "font-mono text-[8px] tracking-[0.18em] uppercase transition-all duration-300",
                leaving ? "border-cool/55 bg-cool/12 text-cool" : "text-silver/70 hover:border-danger/55 hover:text-danger",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-core",
              )}
            >
              <LogOut className={cn("h-3 w-3 transition-transform duration-500", !leaving && "group-hover/out:translate-x-0.5")} aria-hidden />
              <span className="hidden sm:inline">{pending || leaving ? "Signing out" : "Sign out"}</span>
            </button>
          </div>
        </div>

        {/* hairline under the bar */}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-core/45 to-transparent" aria-hidden />
      </header>

      {/* sign-out wash */}
      {leaving && !reduced && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pointer-events-none fixed inset-0 z-[9000] bg-gradient-to-b from-midnight/0 via-midnight/70 to-midnight"
          aria-hidden
        >
          <motion.span
            className="absolute inset-x-0 h-32"
            style={{ background: "linear-gradient(180deg, transparent, rgba(125,211,252,0.18), transparent)" }}
            initial={{ y: "-30%" }}
            animate={{ y: "120%" }}
            transition={{ duration: 0.9, ease: EASE.frost as never }}
          />
        </motion.div>
      )}

      <Link
        href="/"
        className="fixed bottom-5 left-5 z-40 hidden items-center gap-2 rounded-full border border-ice/15 bg-midnight/85 px-4 py-2 font-mono text-[8px] tracking-[0.2em] text-silver/65 uppercase backdrop-blur-md transition-colors duration-300 hover:border-cyan-core/55 hover:text-cyan-core lg:flex"
      >
        <ArrowLeft className="h-3 w-3" aria-hidden />
        Public site
      </Link>
    </>
  );
}
