/**
 * Centralised motion language.
 *
 * Rule: every animation must communicate something. These presets are the ONLY
 * timings the product uses — do not invent one-off easings in components.
 */

import type { Transition, Variants } from "framer-motion";

/** Shared easing curves (mirrors the `--ease-*` tokens in globals.css). */
export const EASE = {
  frost: [0.16, 1, 0.3, 1] as const,
  cryo: [0.65, 0, 0.35, 1] as const,
  drift: [0.4, 0, 0.2, 1] as const,
  snap: [0.34, 1.56, 0.64, 1] as const,
} satisfies Record<string, readonly [number, number, number, number]>;

export const DURATION = {
  instant: 0.18,
  fast: 0.32,
  base: 0.55,
  slow: 0.85,
  cinematic: 1.25,
} as const;

const t = (duration: number, ease: readonly number[] = EASE.frost, delay = 0): Transition => ({
  duration,
  ease: ease as Transition["ease"],
  delay,
});

/* -------------------------------------------------------------------------- */
/* Presets                                                                     */
/* -------------------------------------------------------------------------- */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: t(DURATION.slow) },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: t(DURATION.base) },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -22 },
  show: { opacity: 1, y: 0, transition: t(DURATION.base) },
};

/** Left-to-right mask wipe — used for panels, images and rule lines. */
export const revealMask: Variants = {
  hidden: { clipPath: "inset(0 100% 0 0)" },
  show: { clipPath: "inset(0 0% 0 0)", transition: t(DURATION.cinematic, EASE.cryo) },
};

/** Vertical curtain reveal — used for imagery. */
export const revealCurtain: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  show: { clipPath: "inset(0 0 0% 0)", transition: t(DURATION.cinematic, EASE.cryo) },
};

/** Per-line/per-word typography reveal. Parent = `textReveal`, children stagger. */
export const textReveal: Variants = {
  hidden: { y: "110%", opacity: 0 },
  show: { y: "0%", opacity: 1, transition: t(DURATION.cinematic, EASE.frost) },
};

export const textRevealParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.075, delayChildren: 0.05 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: t(DURATION.slow, EASE.snap) },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -56 },
  show: { opacity: 1, x: 0, transition: t(DURATION.slow) },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 56 },
  show: { opacity: 1, x: 0, transition: t(DURATION.slow) },
};

/** Frost crystallising onto a surface: blur + scale + opacity in one gesture. */
export const frostReveal: Variants = {
  hidden: { opacity: 0, scale: 1.06, filter: "blur(14px) saturate(60%)" },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px) saturate(100%)",
    transition: t(DURATION.cinematic, EASE.frost),
  },
};

/** Temperature shift — colour/position move used by the hero controller. */
export const temperatureShift: Transition = {
  duration: 0.7,
  ease: EASE.frost as Transition["ease"],
};

export const hoverLift = {
  whileHover: { y: -6 },
  transition: t(DURATION.fast, EASE.snap),
};

export const stagger = (amount = 0.08, delay = 0): Transition => ({
  staggerChildren: amount,
  delayChildren: delay,
});

/** Viewport trigger shared by scroll-revealed sections. */
export const inView = { once: true, margin: "-12% 0px -12% 0px", amount: 0.2 } as const;

/** Page transition timing (spec §33 — 300ms–800ms, never make users wait). */
export const PAGE_TRANSITION = {
  enter: 0.42,
  exit: 0.3,
  ease: EASE.cryo,
} as const;
