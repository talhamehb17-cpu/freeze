"use client";

import { useEffect, type ReactNode } from "react";

import { TemperatureProvider } from "@/components/atmosphere/TemperatureProvider";
import { ColdAtmosphere } from "@/components/ui/ColdAtmosphere";
import { CustomCursor } from "@/components/ui/CustomCursor";
import { FreezeProvider } from "@/components/ui/FreezeOverlay";

/**
 * Client shell around every route.
 *
 * Owns the three systems that must exist once and persist across navigations:
 * the global temperature, the freeze overlay and the custom pointer. The cold
 * atmosphere is fixed-position and lives behind all content.
 */
export function AppShell({ children }: { children: ReactNode }) {
  // Keep a true viewport height available to CSS (mobile browser chrome).
  useEffect(() => {
    const set = () =>
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    set();
    window.addEventListener("resize", set, { passive: true });
    window.addEventListener("orientationchange", set);
    return () => {
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, []);

  return (
    <TemperatureProvider>
      <FreezeProvider>
        <ColdAtmosphere />
        <CustomCursor />
        {children}
      </FreezeProvider>
    </TemperatureProvider>
  );
}
