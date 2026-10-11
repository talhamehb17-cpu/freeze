"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Global temperature state.
 *
 * One number drives the entire visual system: frost density, mist volume,
 * light temperature, condensation and every HUD readout. The hero's
 * TemperatureController writes to it; ColdAtmosphere, FrostOverlay and the
 * product vaults read from it.
 *
 * ⚠ This is a VISUAL interaction only. It does not — and cannot — control a
 * refrigeration system. The UI says so explicitly wherever it is offered.
 */

export const TEMP_MIN = -30;
export const TEMP_MAX = 10;
export const TEMP_DEFAULT = -18;

interface TemperatureContextValue {
  /** Degrees Celsius. Range −30 … +10. */
  temperature: number;
  setTemperature: (value: number) => void;
  /** 0 (warm) → 1 (deep frozen), derived from temperature. */
  frost: number;
  /** 0 → 1, how much mist should be visible. */
  mist: number;
  /** Light colour temperature as a hex string, shifting warm → glacial. */
  lightColor: string;
  /** True while the visitor has touched the control. */
  engaged: boolean;
  setEngaged: (value: boolean) => void;
}

const TemperatureContext = createContext<TemperatureContextValue | null>(null);

function norm(temperature: number) {
  return Math.min(1, Math.max(0, (TEMP_MAX - temperature) / (TEMP_MAX - TEMP_MIN)));
}

function lightFor(frost: number) {
  // Warm steel at +10°C → glacial cyan at −30°C.
  const warm = { r: 203, g: 213, b: 225 };
  const cold = { r: 125, g: 211, b: 252 };
  const r = Math.round(warm.r + (cold.r - warm.r) * frost);
  const g = Math.round(warm.g + (cold.g - warm.g) * frost);
  const b = Math.round(warm.b + (cold.b - warm.b) * frost);
  return `rgb(${r} ${g} ${b})`;
}

export function TemperatureProvider({ children }: { children: ReactNode }) {
  const [temperature, setRaw] = useState(TEMP_DEFAULT);
  const [engaged, setEngaged] = useState(false);

  const setTemperature = useCallback((value: number) => {
    setRaw(Math.min(TEMP_MAX, Math.max(TEMP_MIN, Math.round(value * 10) / 10)));
  }, []);

  const value = useMemo<TemperatureContextValue>(() => {
    const frost = norm(temperature);
    return {
      temperature,
      setTemperature,
      frost,
      // Mist peaks in the mid-cold band and thins out at extreme deep freeze.
      mist: Math.min(1, 0.35 + frost * 0.9 - Math.max(0, frost - 0.82) * 1.4),
      lightColor: lightFor(frost),
      engaged,
      setEngaged,
    };
  }, [temperature, setTemperature, engaged]);

  return <TemperatureContext.Provider value={value}>{children}</TemperatureContext.Provider>;
}

export function useTemperature(): TemperatureContextValue {
  const ctx = useContext(TemperatureContext);
  if (!ctx) {
    // Sensible defaults so components never crash outside the provider (e.g. Storybook).
    return {
      temperature: TEMP_DEFAULT,
      setTemperature: () => {},
      frost: norm(TEMP_DEFAULT),
      mist: 0.8,
      lightColor: lightFor(norm(TEMP_DEFAULT)),
      engaged: false,
      setEngaged: () => {},
    };
  }
  return ctx;
}
