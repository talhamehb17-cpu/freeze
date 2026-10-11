"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PAGE_TRANSITION } from "@/animations/presets";
import { useReducedMotion } from "@/hooks/use-motion";

/**
 * PAGE TRANSITION (spec §33 — 300ms to 800ms, never make users wait).
 *
 * Deliberately restrained: a single frost line sweeps the viewport on a route
 * change. No curtain, no full-bleed wipe, no spinner — a heavy transition
 * between marketing pages reads as slow even when it is not, and the brief asks
 * for "expensive and precise", not theatrical. The pages themselves carry their
 * own entrance animations (masked headlines, staggered reveals), so wrapping
 * them in a second layer would be redundant.
 *
 * IMPORTANT: this renders only an overlay. It does not wrap page content in an
 * animated element, because a `transform` on an ancestor becomes the containing
 * block for every `position: fixed` descendant — which would break the floating
 * inquiry hatch and any fixed chrome.
 *
 * Skipped under `prefers-reduced-motion` and on the first mount.
 */
export function PageTransition() {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  const previous = useRef(pathname);
  const [sweep, setSweep] = useState(false);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    if (reduced) return;

    setSweep(true);
    const t = window.setTimeout(() => setSweep(false), PAGE_TRANSITION.enter * 1000 + 220);
    return () => window.clearTimeout(t);
  }, [pathname, reduced]);

  return (
    <AnimatePresence>
      {sweep && (
        <motion.div
          key="page-sweep"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[9500] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: PAGE_TRANSITION.exit }}
        >
          {/* the frost body of the sweep */}
          <motion.span
            className="absolute inset-x-0 h-[22vh]"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(125,211,252,0.05) 28%, rgba(34,211,238,0.11) 50%, rgba(125,211,252,0.05) 72%, transparent)",
            }}
            initial={{ y: "-25vh" }}
            animate={{ y: "105vh" }}
            transition={{ duration: PAGE_TRANSITION.enter + 0.18, ease: PAGE_TRANSITION.ease }}
          />
          {/* a hairline riding ahead of it, so the sweep has a visible edge */}
          <motion.span
            className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-ice/70 to-transparent"
            initial={{ y: "-2vh" }}
            animate={{ y: "102vh" }}
            transition={{ duration: PAGE_TRANSITION.enter + 0.18, ease: PAGE_TRANSITION.ease }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
