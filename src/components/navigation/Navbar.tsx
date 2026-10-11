"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/Logo";
import { MagneticLink } from "@/components/ui/Button";
import { EASE } from "@/animations/presets";
import { useReducedMotion, useScrolled, useScrollProgress } from "@/hooks/use-motion";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Navigation (spec §15).
 *
 * Floats transparent over the hero, then condenses into darker glass with a
 * hairline border as the page scrolls — one continuous transition, no jump.
 */

export function Navbar() {
  const pathname = usePathname();
  const scrolled = useScrolled(40);
  const progress = useScrollProgress();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<{ role: string; name: string } | null>(null);

  // Close the sheet on navigation.
  useEffect(() => setOpen(false), [pathname]);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Lightweight session probe — never a security boundary, only chrome.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setSession({ role: data.user.role, name: data.user.name });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isHome = pathname === "/";
  const condensed = scrolled || !isHome;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] transition-[background-color,backdrop-filter,height,border-color,box-shadow] duration-[650ms]",
          "ease-[cubic-bezier(0.16,1,0.3,1)]",
          condensed
            ? "h-[62px] border-b border-ice/12 bg-midnight/78 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.95)] backdrop-blur-xl backdrop-saturate-150"
            : "h-[86px] border-b border-transparent bg-transparent backdrop-blur-[2px]",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-full w-full max-w-[1500px] items-center justify-between gap-6 px-5 transition-all duration-[650ms] sm:px-8 lg:px-12",
          )}
        >
          <Link
            href="/"
            className="group/nav relative flex items-center"
            aria-label="Tahseen Jaber Cold Storage & Logistics — home"
            data-cursor="active"
          >
            <Logo size={condensed ? 32 : 38} compact={false} className="transition-all duration-500" />
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = pathname === item.match;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/link relative px-3.5 py-2 font-mono text-[10px] tracking-[0.22em] uppercase transition-colors duration-300",
                    active ? "text-frost" : "text-silver/75 hover:text-frost",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-3.5 bottom-1 h-px origin-left bg-gradient-to-r from-cyan-core to-ice transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {/* session chrome */}
            <AnimatePresence>
              {session && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.4, ease: EASE.frost as never }}
                  className="hidden xl:block"
                >
                  <Link
                    href={session.role === "CLIENT" ? "/portal" : "/admin"}
                    className="group/s flex items-center gap-2 rounded-md border border-ice/18 bg-industrial/40 px-3 py-2 font-mono text-[9px] tracking-[0.2em] text-ice uppercase transition-colors hover:border-cyan-core/60 hover:text-frost"
                  >
                    {session.role === "CLIENT" ? (
                      <LayoutDashboard className="h-3 w-3" aria-hidden />
                    ) : (
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                    )}
                    {session.role === "CLIENT" ? "Portal" : "Command"}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {!session && (
              <Link
                href="/login"
                className="hidden font-mono text-[10px] tracking-[0.22em] text-silver/75 uppercase transition-colors hover:text-frost sm:block"
              >
                Sign in
              </Link>
            )}

            <div className="hidden sm:block">
              <MagneticLink href="/request-storage" variant="primary" size="sm" iconRight={<ArrowUpRight className="h-3.5 w-3.5" />}>
                Request Storage
              </MagneticLink>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-ice/20 bg-industrial/40 text-frost transition-colors hover:border-cyan-core/60 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "close" : "open"}
                  initial={{ opacity: 0, rotate: reduced ? 0 : -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: reduced ? 0 : 90 }}
                  transition={{ duration: 0.24, ease: EASE.frost as never }}
                >
                  {open ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* scroll progress */}
        <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
          <div
            className="h-full origin-left bg-gradient-to-r from-cyan-core via-ice to-frost"
            style={{ transform: `scaleX(${progress})`, opacity: progress > 0.001 ? 0.9 : 0 }}
          />
        </div>
      </header>

      {/* ---------------------------- mobile sheet ---------------------------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            className="fixed inset-0 z-[99] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 bg-midnight/96 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* cold light bleed */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(90% 60% at 50% 0%, rgba(34,211,238,0.16), transparent 62%), radial-gradient(70% 50% at 50% 100%, rgba(125,211,252,0.1), transparent 70%)",
              }}
            />
            <div className="noise-layer pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" />

            <nav className="relative flex h-full flex-col justify-between px-6 pt-28 pb-10" aria-label="Mobile">
              <ul className="flex flex-col gap-1">
                {NAV.map((item, i) => {
                  const active = pathname === item.match;
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, y: reduced ? 0 : 26, filter: reduced ? "none" : "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: reduced ? 0 : -14 }}
                      transition={{
                        duration: 0.55,
                        delay: reduced ? 0 : 0.05 + i * 0.055,
                        ease: EASE.frost as never,
                      }}
                      className="overflow-hidden border-b border-ice/10"
                    >
                      <Link
                        href={item.href}
                        className="group/m flex items-baseline justify-between py-4"
                        aria-current={active ? "page" : undefined}
                      >
                        <span
                          className={cn(
                            "font-display text-[2rem] font-bold tracking-[-0.04em] uppercase transition-colors duration-300",
                            active ? "text-cyan-core" : "text-frost group-hover/m:text-ice",
                          )}
                        >
                          {item.label}
                        </span>
                        <span className="font-mono text-[9px] tracking-[0.24em] text-silver/45">
                          0{i + 1}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: reduced ? 0 : 0.42, ease: EASE.frost as never }}
                className="flex flex-col gap-3"
              >
                <MagneticLink
                  href="/request-storage"
                  variant="primary"
                  size="lg"
                  full
                  magnetic={false}
                  iconRight={<ArrowUpRight className="h-4 w-4" />}
                >
                  Request Storage
                </MagneticLink>
                <div className="flex gap-3">
                  <MagneticLink href="/login" variant="secondary" size="md" full magnetic={false}>
                    Sign in
                  </MagneticLink>
                  <MagneticLink href="/contact" variant="ghost" size="md" full magnetic={false}>
                    Contact
                  </MagneticLink>
                </div>
                <p className="mt-1 text-center font-mono text-[9px] tracking-[0.2em] text-silver/45 uppercase">
                  {LOCATION_LINE}
                </p>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const LOCATION_LINE = "Uuayrij Industrial Area · Baghdad, Iraq";
