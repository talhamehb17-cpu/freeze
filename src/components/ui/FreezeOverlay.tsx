"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import { useReducedMotion } from "@/hooks/use-motion";
import { seededRandom } from "@/lib/utils";

/**
 * The freezing animation.
 *
 * Fire `freeze()` from anywhere and the whole viewport crystallises:
 *   • frost blooms inward from the four edges
 *   • ice crackle veins grow along deterministic paths (spec §07 `frostReveal`)
 *   • the scene briefly desaturates and sharpens
 *   • a cold shockwave ring expands from the trigger point
 *
 * Reduced-motion users get a single soft opacity pulse instead — the beat still
 * lands, without the movement.
 */

interface FreezeContextValue {
  freeze: (origin?: { x: number; y: number }) => void;
  frozen: boolean;
}

const FreezeContext = createContext<FreezeContextValue>({ freeze: () => {}, frozen: false });

export const useFreeze = () => useContext(FreezeContext);

const VEINS = 9;

function buildVeins(seed: string) {
  const rand = seededRandom(seed);
  return Array.from({ length: VEINS }, (_, i) => {
    const side = i % 4;
    const start = rand();
    let x0 = 0;
    let y0 = 0;
    if (side === 0) { x0 = start * 100; y0 = 0; }
    else if (side === 1) { x0 = 100; y0 = start * 100; }
    else if (side === 2) { x0 = start * 100; y0 = 100; }
    else { x0 = 0; y0 = start * 100; }

    const len = 26 + rand() * 42;
    const angle = (side * 90 + 180 + (rand() - 0.5) * 62) * (Math.PI / 180);
    const x1 = x0 + Math.cos(angle) * len;
    const y1 = y0 + Math.sin(angle) * len;
    const cx = x0 + Math.cos(angle) * len * 0.5 + (rand() - 0.5) * 14;
    const cy = y0 + Math.sin(angle) * len * 0.5 + (rand() - 0.5) * 14;

    return {
      d: `M ${x0.toFixed(2)} ${y0.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`,
      delay: i * 0.045 + rand() * 0.08,
      width: 0.18 + rand() * 0.32,
      branch: `M ${cx.toFixed(2)} ${cy.toFixed(2)} l ${(rand() - 0.5) * 12} ${(rand() - 0.5) * 12}`,
    };
  });
}

export function FreezeProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [seed, setSeed] = useState("tj-frost-1");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const freeze = useCallback(
    (o?: { x: number; y: number }) => {
      if (timer.current) clearTimeout(timer.current);
      if (o && typeof window !== "undefined") {
        setOrigin({ x: (o.x / window.innerWidth) * 100, y: (o.y / window.innerHeight) * 100 });
      }
      setSeed(`tj-frost-${Date.now()}`);
      setActive(true);
      timer.current = setTimeout(() => setActive(false), reduced ? 620 : 1650);
    },
    [reduced],
  );

  const veins = buildVeins(seed);

  return (
    <FreezeContext.Provider value={{ freeze, frozen: active }}>
      {children}

      <AnimatePresence>
        {active && (
          <motion.div
            key="freeze"
            className="pointer-events-none fixed inset-0 z-[80]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.25 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          >
            {/* cold shockwave from the trigger point */}
            {!reduced && (
              <motion.span
                className="absolute rounded-full border border-frost/60"
                style={{ left: `${origin.x}%`, top: `${origin.y}%` }}
                initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.85 }}
                animate={{
                  width: "240vmax",
                  height: "240vmax",
                  x: "-120vmax",
                  y: "-120vmax",
                  opacity: 0,
                }}
                transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
              />
            )}

            {/* frost bloom creeping in from every edge */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 100% at 50% 50%, transparent 30%, rgba(125,211,252,0.20) 68%, rgba(244,250,255,0.52) 100%)",
                animation: reduced ? undefined : "frost-bloom 0.9s cubic-bezier(0.16,1,0.3,1) forwards",
                backdropFilter: reduced ? undefined : "blur(2.5px) saturate(120%) brightness(1.08)",
              }}
            />

            {/* ice crackle veins */}
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <g className={reduced ? undefined : "ice-crackle"}>
                {veins.map((v, i) => (
                  <g key={i}>
                    <path
                      d={v.d}
                      fill="none"
                      stroke="#F4FAFF"
                      strokeOpacity="0.85"
                      strokeWidth={v.width}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      style={
                        {
                          "--len": 320,
                          animationDelay: reduced ? "0s" : `${v.delay}s`,
                        } as React.CSSProperties
                      }
                    />
                    <path
                      d={v.branch}
                      fill="none"
                      stroke="#7DD3FC"
                      strokeOpacity="0.7"
                      strokeWidth={v.width * 0.7}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      style={
                        {
                          "--len": 120,
                          animationDelay: reduced ? "0s" : `${v.delay + 0.22}s`,
                        } as React.CSSProperties
                      }
                    />
                  </g>
                ))}
              </g>
            </svg>

            {/* crystalline speckle */}
            <div
              className="noise-layer absolute inset-0 mix-blend-screen"
              style={{ opacity: reduced ? 0.06 : 0.16, backgroundSize: "120px 120px" }}
            />

            {/* readout */}
            {!reduced && (
              <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="panel-hud scanlines flex items-center gap-3 px-4 py-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-core opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-core" />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.28em] text-ice uppercase">
                    Frost sequence engaged
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </FreezeContext.Provider>
  );
}
