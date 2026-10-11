"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * GSAP is registered once, globally, for the cinematic scroll sections only.
 * Simple effects use CSS or Framer Motion — we do not pay for GSAP twice
 * (spec §35: "Use CSS where CSS is enough").
 */

let registered = false;

export function registerGsap() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out" });
  registered = true;
}

export function useGsap() {
  useEffect(() => {
    registerGsap();
  }, []);
  return { gsap, ScrollTrigger };
}

export { gsap, ScrollTrigger };
