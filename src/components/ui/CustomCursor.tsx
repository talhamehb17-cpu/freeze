"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useCustomCursorEnabled } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * Premium pointer system (spec §08).
 *
 *  • Desktop / fine-pointer only — disabled on touch and for reduced-motion.
 *  • Two layers: a crisp core that tracks the pointer 1:1, and a translucent
 *    ring that trails it on a spring. The lag is what makes it feel expensive.
 *  • Six semantic states. Any element can declare its intent with
 *    `data-cursor="explore|inspect|view|drag|active"` or `data-cursor-label="…"`.
 *  • Interactive links/CTAs expand the ring and pull it magnetically.
 */

type CursorState = "default" | "explore" | "inspect" | "view" | "drag" | "active" | "hidden";

const STATE_COPY = {
  explore: "EXPLORE",
  inspect: "INSPECT",
  view: "VIEW",
  drag: "DRAG",
  active: "ACTIVE",
} as const satisfies Partial<Record<CursorState, string>>;

type LabelledState = keyof typeof STATE_COPY;

const DECLARED_STATES = ["explore", "inspect", "view", "drag", "active"] as const;

function isLabelledState(value: string): value is LabelledState {
  return (DECLARED_STATES as readonly string[]).includes(value);
}

const STATE_SIZE: Record<CursorState, number> = {
  hidden: 0,
  default: 34,
  explore: 58,
  inspect: 76,
  view: 92,
  drag: 66,
  active: 26,
};

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, summary, label";

export function CustomCursor() {
  const enabled = useCustomCursorEnabled();

  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const ringX = useSpring(x, { stiffness: 420, damping: 34, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 420, damping: 34, mass: 0.5 });

  const [state, setState] = useState<CursorState>("hidden");
  const [label, setLabel] = useState<string | null>(null);
  const [pressed, setPressed] = useState(false);
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([]);

  const last = useRef({ x: 0, y: 0, t: 0 });
  const sparkId = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    document.body.dataset.cursor = "on";

    const resolveState = (target: EventTarget | null): { next: CursorState; label: string | null } => {
      let el = target as HTMLElement | null;
      while (el && el !== document.body) {
        const declared = el.dataset?.cursor;
        if (declared && isLabelledState(declared)) {
          return { next: declared, label: el.dataset.cursorLabel ?? STATE_COPY[declared] };
        }
        if (el.matches?.(INTERACTIVE)) {
          const isCta = el.matches("[data-cta='true'], .cta-primary");
          return {
            next: isCta ? "explore" : "active",
            label: el.dataset.cursorLabel ?? (isCta ? "OPEN" : null),
          };
        }
        if (el.matches?.("img, picture, [data-image='true'], video, figure")) {
          return { next: "view", label: el.dataset.cursorLabel ?? "VIEW" };
        }
        el = el.parentElement;
      }
      return { next: "default", label: null };
    };

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);

      const now = performance.now();
      const dt = Math.max(1, now - last.current.t);
      const dist = Math.hypot(event.clientX - last.current.x, event.clientY - last.current.y);
      velocity.current = velocity.current * 0.82 + (dist / dt) * 0.18;
      last.current = { x: event.clientX, y: event.clientY, t: now };

      setState((prev) => (prev === "hidden" ? "default" : prev));

      // Frost sparks — only on genuinely fast movement, and only a handful.
      if (velocity.current > 1.9 && sparks.length < 7 && Math.random() > 0.55) {
        const id = ++sparkId.current;
        const angle = Math.atan2(
          event.clientY - last.current.y || 1,
          event.clientX - last.current.x || 1,
        );
        setSparks((s) => [
          ...s,
          {
            id,
            x: event.clientX,
            y: event.clientY,
            dx: Math.cos(angle + Math.PI) * 22,
            dy: Math.sin(angle + Math.PI) * 22,
          },
        ]);
        window.setTimeout(() => setSparks((s) => s.filter((sp) => sp.id !== id)), 720);
      }
    };

    const onOver = (event: PointerEvent) => {
      const { next, label: l } = resolveState(event.target);
      setState(next);
      setLabel(l);
    };

    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onLeave = () => setState("hidden");
    const onEnter = () => setState((p) => (p === "hidden" ? "default" : p));

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.documentElement.addEventListener("pointerenter", onEnter);

    return () => {
      delete document.body.dataset.cursor;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.documentElement.removeEventListener("pointerenter", onEnter);
    };
  }, [enabled, x, y, sparks.length]);

  if (!enabled) return null;

  const size = STATE_SIZE[state] ?? 34;
  const scale = pressed ? 0.82 : 1;
  const labelled = Boolean(label) && state !== "default" && state !== "hidden";

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block" aria-hidden="true">
      {/* frost sparks */}
      <AnimatePresence>
        {sparks.map((s) => (
          <motion.span
            key={s.id}
            className="absolute h-1 w-1 rounded-full bg-frost"
            style={{ left: s.x, top: s.y, boxShadow: "0 0 8px 2px rgba(125,211,252,0.75)" }}
            initial={{ opacity: 0.95, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 0.2, x: s.dx, y: s.dy }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </AnimatePresence>

      {/* trailing ring */}
      <motion.div
        className={cn(
          "absolute -top-1/2 -left-1/2 flex items-center justify-center rounded-full",
          "border transition-[width,height,background-color,border-color,opacity] duration-[420ms]",
          "ease-[cubic-bezier(0.16,1,0.3,1)]",
          labelled
            ? "border-cyan-core/70 bg-navy/85 backdrop-blur-[3px]"
            : "border-ice/45 bg-ice/[0.06] backdrop-blur-[1px]",
        )}
        style={{
          x: ringX,
          y: ringY,
          width: size,
          height: size,
          scale,
          opacity: state === "hidden" ? 0 : 1,
        }}
      >
        <AnimatePresence mode="wait">
          {labelled && (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="font-mono text-[8px] leading-none font-medium tracking-[0.18em] whitespace-nowrap text-frost uppercase"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* crosshair for INSPECT — the facility-map state */}
        {state === "inspect" && (
          <span className="absolute inset-0">
            <span className="absolute top-1/2 left-0 h-px w-2 -translate-y-1/2 bg-cyan-core/80" />
            <span className="absolute top-1/2 right-0 h-px w-2 -translate-y-1/2 bg-cyan-core/80" />
            <span className="absolute top-0 left-1/2 h-2 w-px -translate-x-1/2 bg-cyan-core/80" />
            <span className="absolute bottom-0 left-1/2 h-2 w-px -translate-x-1/2 bg-cyan-core/80" />
          </span>
        )}
      </motion.div>

      {/* crisp core */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 rounded-full"
        style={{
          x,
          y,
          width: 7,
          height: 7,
          scale: pressed ? 1.5 : 1,
          opacity: state === "hidden" ? 0 : 1,
          backgroundColor: "#F4FAFF",
          boxShadow: "0 0 10px 2px rgba(34,211,238,0.85)",
        }}
      />
    </div>
  );
}
