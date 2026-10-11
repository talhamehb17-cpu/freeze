"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/use-motion";

/**
 * Magnetic pull — the element drifts toward the pointer and snaps back on exit.
 * Strength is deliberately low; this is a precision gesture, not a bounce.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.28, resetMs = 520) {
  const ref = useRef<T | null>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let frame = 0;

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x * strength}px, ${y * strength * 0.72}px, 0)`;
      });
      setActive(true);
    };

    const onLeave = () => {
      if (frame) cancelAnimationFrame(frame);
      el.style.transition = `transform ${resetMs}ms cubic-bezier(0.16,1,0.3,1)`;
      el.style.transform = "translate3d(0,0,0)";
      setActive(false);
      window.setTimeout(() => {
        el.style.transition = "";
      }, resetMs);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strength, resetMs, reduced]);

  return { ref, active, disabled: reduced };
}

/** Counts from 0 → value once the element enters the viewport. */
export function useCountUp(target: number, duration = 1600, decimals = 0) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(0);
  const reduced = useReducedMotion();
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // expo-out — fast arrival, gentle settle
          const eased = 1 - Math.pow(2, -10 * t);
          const next = target * (t === 1 ? 1 : eased);
          setValue(Number(next.toFixed(decimals)));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals, reduced]);

  return { ref, value };
}
