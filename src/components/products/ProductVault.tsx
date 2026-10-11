"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Beef, Check, Fish, Leaf, Lock, Pill, Snowflake, ThermometerSnowflake } from "lucide-react";
import { useState } from "react";

import { EASE } from "@/animations/presets";
import { useTemperature } from "@/components/atmosphere/TemperatureProvider";
import { ChipButton } from "@/components/ui/Button";
import { DemoBadge, HudRow } from "@/components/ui/Hud";
import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { PRODUCTS, type ProductKey, type ProductVault as Vault } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * PRODUCT VAULTS (spec §19 / §20).
 *
 * Selecting a category changes the entire environment — background imagery,
 * accent lighting, the temperature UI, the icon and the information panel —
 * in one coordinated transition. Nothing here claims a temperature or a
 * compliance level the client has not confirmed.
 */

const ICONS = {
  leaf: Leaf,
  beef: Beef,
  fish: Fish,
  pill: Pill,
} as const;

export function ProductVault({
  defaultCategory = "seafood",
}: {
  defaultCategory?: ProductKey;
}) {
  const reduced = useReducedMotion();
  const [activeKey, setActiveKey] = useState<ProductKey>(defaultCategory);
  const active = PRODUCTS.find((p) => p.key === activeKey) ?? PRODUCTS[0]!;
  const { frost } = useTemperature();

  return (
    <section
      id="products"
      className="relative isolate overflow-hidden bg-midnight py-24 sm:py-32"
      aria-label="Product storage environments"
    >
      {/* environment wash — changes with the selected category */}
      <AnimatePresence initial={false}>
        <motion.div
          key={active.key}
          className="pointer-events-none absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.3 : 1.1, ease: EASE.frost as never }}
          style={{
            background: `radial-gradient(90% 70% at 78% 22%, ${active.accentSoft}, transparent 62%),
                         radial-gradient(70% 60% at 10% 88%, rgba(34,211,238,0.08), transparent 66%)`,
          }}
          aria-hidden
        />
      </AnimatePresence>

      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <GhostIndex index="03" className="-top-10 -left-4 hidden lg:block" />
            <Kicker index="03">Product environments</Kicker>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
              Four worlds.
              <br />
              <span
                className="transition-colors duration-700"
                style={{ color: active.accent }}
              >
                One standard.
              </span>
            </h2>
            <p className="mt-6 text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
              Produce, protein, seafood and pharmaceuticals are not the same problem. Each gets its
              own environment, its own profile and its own handling rules.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map((p) => {
              const Icon = ICONS[p.icon];
              const isActive = p.key === activeKey;
              return (
                <ChipButton
                  key={p.key}
                  active={isActive}
                  onClick={() => setActiveKey(p.key)}
                  className="flex items-center gap-2 !px-3.5 !py-2"
                  aria-label={`Show ${p.name} environment`}
                  style={isActive ? { borderColor: `${p.accent}aa`, color: p.accent } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {p.name}
                </ChipButton>
              );
            })}
          </div>
        </div>

        {/* --------------------------- the vault --------------------------- */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
          {/* environment stage */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.key}
              initial={{ opacity: 0, scale: reduced ? 1 : 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reduced ? 1 : 0.99 }}
              transition={{ duration: reduced ? 0.3 : 0.85, ease: EASE.frost as never }}
              className="relative"
            >
              <div
                className="group/vault relative isolate aspect-[16/11] overflow-hidden rounded-2xl border sm:aspect-[16/9]"
                style={{ borderColor: `${active.accent}33` }}
                data-image="true"
                data-cursor="view"
                data-cursor-label="VIEW"
              >
                <Image
                  src={active.image}
                  alt={`${active.name} storage environment at the Tahseen Jaber facility`}
                  fill
                  priority={false}
                  sizes="(max-width:1024px) 100vw, 58vw"
                  quality={82}
                  className={cn(
                    "object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                    !reduced && "group-hover/vault:scale-[1.05]",
                  )}
                  style={{ filter: `saturate(0.9) contrast(1.08) brightness(0.78)` }}
                />

                {/* category tint */}
                <div
                  className="absolute inset-0 mix-blend-soft-light transition-opacity duration-1000"
                  style={{ background: `linear-gradient(160deg, ${active.accent}44, transparent 55%, ${active.accent}22)` }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(5,9,20,0.5) 0%, rgba(5,9,20,0.12) 40%, rgba(5,9,20,0.95) 100%)",
                  }}
                />

                {/* frost bloom tied to the global temperature */}
                <div
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{
                    opacity: 0.15 + frost * 0.4,
                    background:
                      "radial-gradient(112% 92% at 50% 50%, transparent 46%, rgba(244,250,255,0.14) 82%, rgba(244,250,255,0.34) 100%)",
                  }}
                  aria-hidden
                />

                {/* HUD corners */}
                {(["top-3 left-3 border-t border-l", "top-3 right-3 border-t border-r", "bottom-3 left-3 border-b border-l", "bottom-3 right-3 border-b border-r"] as const).map(
                  (pos) => (
                    <span
                      key={pos}
                      aria-hidden
                      className={cn("pointer-events-none absolute h-6 w-6 opacity-70", pos)}
                      style={{ borderColor: active.accent }}
                    />
                  ),
                )}

                {/* scanline */}
                <span className="scanlines pointer-events-none absolute inset-0 rounded-2xl" aria-hidden />

                {/* headline */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-md border"
                      style={{ borderColor: `${active.accent}66`, backgroundColor: `${active.accent}18` }}
                    >
                      {(() => {
                        const Icon = ICONS[active.icon];
                        return <Icon className="h-4 w-4" style={{ color: active.accent }} aria-hidden />;
                      })()}
                    </span>
                    <span
                      className="font-mono text-[9px] tracking-[0.28em] uppercase"
                      style={{ color: active.accent }}
                    >
                      {active.kicker}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-[clamp(1.9rem,4.4vw,3.2rem)] leading-[0.95] font-bold tracking-[-0.04em] text-frost">
                    {active.headline}
                  </h3>

                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.14, ease: EASE.frost as never }}
                    className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-silver/85"
                  >
                    {active.body}
                  </motion.p>
                </div>

                {/* top-right badge */}
                <div className="absolute top-4 right-4">
                  <DemoBadge size="xs" />
                </div>
              </div>

              {/* feature strip */}
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {active.features.map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: reduced ? 0 : -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.07, ease: EASE.frost as never }}
                    className="flex items-center gap-2.5 rounded-lg border border-ice/12 bg-navy/45 px-3.5 py-2.5"
                  >
                    <Check className="h-3 w-3 shrink-0" style={{ color: active.accent }} aria-hidden />
                    <span className="font-mono text-[9px] tracking-[0.16em] text-silver/85 uppercase">
                      {f}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>

          {/* information panel */}
          <VaultPanel active={active} />
        </div>
      </div>
    </section>
  );
}

function VaultPanel({ active }: { active: Vault }) {
  const reduced = useReducedMotion();
  const Icon = ICONS[active.icon];

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        key={active.key}
        initial={{ opacity: 0, y: reduced ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduced ? 0 : -16 }}
        transition={{ duration: 0.6, ease: EASE.frost as never }}
        className="panel-hud scanlines flex h-full flex-col overflow-hidden rounded-2xl"
        aria-live="polite"
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-5 py-3.5"
          style={{ borderColor: `${active.accent}26`, backgroundColor: `${active.accent}0d` }}
        >
          <div className="flex items-center gap-2.5">
            <Icon className="h-4 w-4" style={{ color: active.accent }} aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.26em] text-frost uppercase">
              {active.name}
            </span>
          </div>
          <span
            className="font-mono text-[9px] tracking-[0.22em] uppercase"
            style={{ color: active.accent }}
          >
            Controlled storage
          </span>
        </div>

        <div className="flex-1 px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[8px] tracking-[0.26em] text-silver/55 uppercase">
                Temperature
              </div>
              <div className="mt-1.5 font-display text-2xl leading-none font-bold text-frost">
                {active.temperature}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[8px] tracking-[0.26em] text-silver/55 uppercase">
                Humidity
              </div>
              <div className="mt-1.5 font-mono text-[11px] tracking-[0.16em] text-ice uppercase">
                {active.humidity}
              </div>
            </div>
          </div>

          <div
            className="mt-5 rounded-lg border px-4 py-3"
            style={{ borderColor: `${active.accent}2a`, backgroundColor: "rgba(8,20,38,0.6)" }}
          >
            <div className="flex items-center gap-2">
              <ThermometerSnowflake className="h-3.5 w-3.5" style={{ color: active.accent }} aria-hidden />
              <span className="font-mono text-[9px] tracking-[0.22em] text-silver/70 uppercase">
                Profile agreed per contract
              </span>
            </div>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-silver/65">
              We do not publish a fixed storage temperature for this category. The setpoint is
              configured to the profile your product requires and documented on the contract.
            </p>
          </div>

          <div className="mt-5">
            {active.handling.map((h) => (
              <HudRow key={h.label} label={h.label} value={h.value} tone="ice" />
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-ice/12 bg-industrial/30 px-4 py-3">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-silver/60" aria-hidden />
            <p className="font-mono text-[9px] leading-relaxed tracking-[0.12em] text-silver/60 uppercase">
              {active.key === "pharma"
                ? "Handling is documented and access is restricted. Compliance certifications are published only once verified by the business."
                : "Segregated handling with batch-level traceability from intake to dispatch."}
            </p>
          </div>
        </div>

        <div className="border-t border-ice/10 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] text-silver/55 uppercase">
              <Snowflake className="h-3 w-3 text-cyan-core" aria-hidden />
              Environment matched
            </span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: active.accent, boxShadow: `0 0 12px 2px ${active.accent}` }}
            />
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
