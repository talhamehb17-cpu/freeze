"use client";

import { motion, type Variants } from "framer-motion";
import { forwardRef, type ElementType, type ReactNode } from "react";

import {
  fadeIn,
  fadeUp,
  frostReveal,
  inView,
  revealMask,
  scaleIn,
  slideInLeft,
  slideInRight,
  stagger,
} from "@/animations/presets";
import { useReducedMotion } from "@/hooks/use-motion";

/**
 * One reveal primitive for the whole product.
 * `variant` picks the preset from the centralised motion engine — components
 * never hand-roll timings (spec §07).
 */

export type RevealVariant =
  | "fadeUp"
  | "fadeIn"
  | "scaleIn"
  | "slideInLeft"
  | "slideInRight"
  | "frostReveal"
  | "revealMask";

const PRESETS: Record<RevealVariant, Variants> = {
  fadeUp,
  fadeIn,
  scaleIn,
  slideInLeft,
  slideInRight,
  frostReveal,
  revealMask,
};

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: ElementType;
  once?: boolean;
  amount?: number;
  id?: string;
}

export const Reveal = forwardRef<HTMLDivElement, RevealProps>(function Reveal(
  { children, variant = "fadeUp", delay = 0, className, as, once = true, amount, id },
  ref,
) {
  const reduced = useReducedMotion();
  const MotionTag = (as ? motion[as as keyof typeof motion] : motion.div) as typeof motion.div;

  if (reduced) {
    const Tag = (as ?? "div") as ElementType;
    return (
      <Tag id={id} ref={ref as never} className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <MotionTag
      id={id}
      ref={ref as never}
      className={className}
      variants={PRESETS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: amount ?? inView.amount, margin: inView.margin }}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
});

/** Parent that staggers its <Reveal> children. */
export function RevealGroup({
  children,
  className,
  amount = 0.15,
  delay = 0,
  step = 0.08,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
  delay?: number;
  step?: number;
  as?: ElementType;
}) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  const Tag = as as ElementType;

  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount, margin: inView.margin }}
      variants={{ hidden: {}, show: { transition: stagger(step, delay) } }}
    >
      {children}
    </MotionTag>
  );
}


