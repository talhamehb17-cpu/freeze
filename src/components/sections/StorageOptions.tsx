"use client";

import { motion } from "framer-motion";
import { Lock, Repeat, ShieldCheck, Zap } from "lucide-react";

import { EASE } from "@/animations/presets";
import { MagneticLink } from "@/components/ui/Button";
import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { STORAGE_OPTIONS } from "@/lib/site";
import { cn } from "@/lib/utils";

/** FLEXIBLE STORAGE (spec §16 / §25) — four engagement models. */

const ICONS = { zap: Zap, shield: ShieldCheck, lock: Lock, repeat: Repeat } as const;

export function StorageOptions() {
  const reduced = useReducedMotion();

  return (
    <section
      id="storage-options"
      className="relative isolate overflow-hidden bg-midnight py-24 sm:py-32"
      aria-label="Storage options"
    >
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <GhostIndex index="08" className="-top-10 -left-4 hidden lg:block" />
            <Kicker index="08">Flexible storage</Kicker>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
              Store for an hour.
              <br />
              <span className="text-gradient-frost">Or for a season.</span>
            </h2>
          </div>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-silver/75">
            Four ways to use the facility — from a cross-dock transfer that never reaches a rack, to
            a reserved zone under a multi-season contract.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STORAGE_OPTIONS.map((option, i) => {
            const Icon = ICONS[option.icon as keyof typeof ICONS];
            return (
              <motion.article
                key={option.key}
                initial={{ opacity: 0, y: reduced ? 0 : 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.75, delay: i * 0.08, ease: EASE.frost as never }}
                whileHover={reduced ? undefined : { y: -8 }}
                className={cn(
                  "group/opt panel relative flex flex-col overflow-hidden rounded-2xl p-6",
                  "transition-[border-color,box-shadow] duration-500",
                  "hover:border-cyan-core/45 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_40px_80px_-46px_rgba(34,211,238,0.6)]",
                )}
                data-cursor="explore"
                data-cursor-label="DETAILS"
              >
                {/* index wash */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-6 -right-3 font-display text-[6rem] leading-none font-bold text-transparent [-webkit-text-stroke:1px_rgba(125,211,252,0.12)] transition-all duration-700 group-hover/opt:[-webkit-text-stroke-color:rgba(34,211,238,0.32)]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-core/32 bg-cyan-core/10 text-cyan-core transition-all duration-500 group-hover/opt:shadow-[0_0_26px_-6px_rgba(34,211,238,0.95)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>

                <h3 className="relative mt-6 font-display text-xl leading-tight font-bold tracking-[-0.02em] text-frost">
                  {option.name}
                </h3>
                <span className="relative mt-2 font-mono text-[9px] tracking-[0.24em] text-cyan-core/80 uppercase">
                  {option.period}
                </span>

                <p className="relative mt-4 flex-1 text-[0.86rem] leading-relaxed text-silver/75">
                  {option.body}
                </p>

                <ul className="relative mt-5 space-y-2 border-t border-ice/10 pt-4">
                  {option.points.map((point) => (
                    <li key={point} className="flex items-center gap-2.5">
                      <span className="h-1 w-1 shrink-0 rotate-45 bg-cyan-core" aria-hidden />
                      <span className="font-mono text-[9px] tracking-[0.14em] text-silver/70 uppercase">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* top activation line */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/opt:scale-x-100"
                />
              </motion.article>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-ice/12 bg-[linear-gradient(140deg,rgba(21,34,53,0.6),rgba(5,9,20,0.85))] px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-frost sm:text-2xl">
              Not sure which model fits?
            </h3>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-silver/75">
              Send the product, the volume and the duration. We will tell you which zone it belongs
              in and return a custom quote — no published rate card, no invented numbers.
            </p>
          </div>
          <MagneticLink
            href="/request-storage"
            variant="primary"
            size="lg"
            className="shrink-0"
            iconRight={<Zap className="h-4 w-4" aria-hidden />}
          >
            Request a quote
          </MagneticLink>
        </div>
      </div>
    </section>
  );
}
