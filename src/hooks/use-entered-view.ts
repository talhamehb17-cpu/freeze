"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fires once when an element enters the viewport.
 * Used to start sequenced scenes (hero, cold room, scanner) exactly when the
 * visitor is actually looking at them — never before, never off-screen.
 */
export function useEnteredView<T extends Element = HTMLDivElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const { threshold = 0.25, rootMargin = "0px 0px -10% 0px", once = true } = options ?? {};
  const ref = useRef<T | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setEntered(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, entered };
}
