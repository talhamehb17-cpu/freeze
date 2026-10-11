"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Inbox, Snowflake, X } from "lucide-react";
import { useEffect, useState } from "react";

import { EASE } from "@/animations/presets";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * The inquiry box — always one click away, on every page.
 *
 * Docked bottom-right as a cold-sealed hatch. It opens into the full public
 * inquiry form without a page navigation, and hides itself on the pages that
 * already own that job (/request-storage, /contact) plus inside the portal and
 * command centre where it would only get in the way.
 */

const HIDDEN_ON = ["/request-storage", "/contact", "/login", "/signup", "/admin", "/portal"];

export function InquiryDock() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const hidden = HIDDEN_ON.some((p) => pathname.startsWith(p));

  // Close on route change.
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // One gentle nudge after the visitor has actually explored — never on load.
  useEffect(() => {
    if (dismissed || open || hidden || reduced) return;
    let fired = false;
    const onScroll = () => {
      if (fired) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.42) {
        fired = true;
        setNudge(true);
        window.setTimeout(() => setNudge(false), 3600);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed, open, hidden, reduced]);

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[90] flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open && (
          <motion.div
            key="dock-panel"
            className="pointer-events-auto w-[min(26rem,calc(100vw-2rem))]"
            initial={{ opacity: 0, y: reduced ? 0 : 30, scale: reduced ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduced ? 0 : 20, scale: reduced ? 1 : 0.97 }}
            transition={{ duration: 0.5, ease: EASE.frost as never }}
            role="dialog"
            aria-label="Request storage"
            aria-modal={false}
          >
            <div className="panel-hud relative max-h-[min(78vh,46rem)] overflow-y-auto rounded-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-ice/12 bg-navy/92 px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <Snowflake className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
                  <span className="font-mono text-[10px] tracking-[0.24em] text-frost uppercase">
                    Request Storage
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-ice/18 text-silver transition-colors hover:border-danger/50 hover:text-danger"
                  aria-label="Close request panel"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>

              <div className="p-3 sm:p-4">
                {reference ? (
                  <div className="flex flex-col items-center px-2 py-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cool/45 bg-cool/12">
                      <Snowflake className="h-5 w-5 text-cool" aria-hidden />
                    </span>
                    <p className="mt-5 font-display text-lg font-bold tracking-[0.02em] text-frost uppercase">
                      Request received
                    </p>
                    <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-cyan-core">
                      {reference}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReference(null);
                        setOpen(false);
                      }}
                      className="mt-6 font-mono text-[9px] tracking-[0.24em] text-silver/60 uppercase transition-colors hover:text-frost"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <InquiryForm
                    compact
                    source="inquiry-dock"
                    className="border-0 bg-transparent p-0 shadow-none"
                    onSuccess={(ref) => setReference(ref)}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* the hatch */}
      <AnimatePresence>
        {!open && (
          <motion.div
            key="dock-trigger"
            className="pointer-events-auto"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.45, ease: EASE.snap as never }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                setDismissed(true);
              }}
              data-cta="true"
              data-cursor="explore"
              data-cursor-label="REQUEST"
              aria-expanded={open}
              className={cn(
                "cta-primary sweep-host group/dock relative flex items-center gap-3 overflow-hidden rounded-full py-3.5 pr-5 pl-4",
                "bg-[linear-gradient(135deg,#b8ecff,#7DD3FC_30%,#22D3EE)] font-mono text-[10px] font-bold tracking-[0.22em] text-midnight uppercase",
                "shadow-[0_0_0_1px_rgba(125,211,252,0.55),0_20px_48px_-18px_rgba(34,211,238,0.95)]",
                "transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_0_1px_rgba(244,250,255,0.8),0_26px_64px_-16px_rgba(34,211,238,1)]",
                nudge && !reduced && "animate-breathe",
              )}
            >
              <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-midnight/15">
                <Inbox className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="relative">Request Storage</span>

              {/* idle pulse ring */}
              {!reduced && !dismissed && (
                <span
                  className="pointer-events-none absolute inset-0 rounded-full border border-frost/50"
                  style={{ animation: "pulse-ring 3.2s cubic-bezier(0.16,1,0.3,1) infinite" }}
                  aria-hidden
                />
              )}
            </button>

            <AnimatePresence>
              {nudge && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE.frost as never }}
                  className="mt-2 max-w-[15rem] text-right font-mono text-[8px] leading-relaxed tracking-[0.18em] text-ice/65 uppercase"
                >
                  Need space? Send the volume and duration — we&apos;ll quote it.
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
