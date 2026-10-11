"use client";

import { useEffect, useState } from "react";

/**
 * Motion + device capability hooks.
 *
 * Everything expensive in this product (custom cursor, parallax, particle
 * density, pinned camera moves) is gated through these so `prefers-reduced-motion`
 * and touch devices get a genuinely simplified experience (spec §07, §34).
 */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return reduced;
}

export function useIsTouch(): boolean {
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    const apply = () => setTouch(mq.matches || window.innerWidth < 1024);
    apply();
    mq.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      mq.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  return touch;
}

/** True when the premium pointer system should run (desktop, fine pointer, motion allowed). */
export function useCustomCursorEnabled(): boolean {
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  return !reduced && !touch;
}

export function useViewport() {
  const [size, setSize] = useState({ width: 1280, height: 800, ready: false });

  useEffect(() => {
    const apply = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight, ready: true });
    apply();
    window.addEventListener("resize", apply, { passive: true });
    return () => window.removeEventListener("resize", apply);
  }, []);

  return size;
}

/** Scroll progress (0→1) of the whole document. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}

/** Tracks whether the page has scrolled past a threshold (drives the navbar). */
export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/** Normalised pointer position (-0.5 → 0.5) relative to an element. */
export function usePointerPosition<T extends HTMLElement>() {
  const [ref, setRef] = useState<T | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!ref) return;
    const onMove = (e: PointerEvent) => {
      const rect = ref.getBoundingClientRect();
      setPos({
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      });
    };
    const onLeave = () => setPos({ x: 0, y: 0 });
    ref.addEventListener("pointermove", onMove);
    ref.addEventListener("pointerleave", onLeave);
    return () => {
      ref.removeEventListener("pointermove", onMove);
      ref.removeEventListener("pointerleave", onLeave);
    };
  }, [ref]);

  return { ref: setRef, pos };
}
