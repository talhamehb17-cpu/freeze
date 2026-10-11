"use client";

import { motion } from "framer-motion";
import { Beef, Droplets, Fish, Leaf, Pill, ThermometerSnowflake } from "lucide-react";

import { EASE } from "@/animations/presets";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { DemoNotice } from "@/components/ui/Hud";
import { MaskLines } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";
import type { ProductVault } from "@/lib/site";

/**
 * PRODUCT CARD (spec §19/§20) — the full dossier for one category.
 *
 * Alternates image and copy down the page. Temperature and humidity are printed
 * exactly as the data layer holds them: CLIENT CONFIGURED / MANAGED. No setpoint
 * is ever invented, and the notice says so in words.
 */

const ICONS = { leaf: Leaf, beef: Beef, fish: Fish, pill: Pill } as const;

export function ProductCard({
  product,
  index,
  flip = false,
}: {
  product: ProductVault;
  index: string;
  flip?: boolean;
}) {
  const reduced = useReducedMotion();
  const Icon = ICONS[product.icon];

  return (
    <article
      id={`product-${product.key}`}
      className="scroll-mt-28 border-t border-ice/10 py-16 first:border-t-0 sm:py-20"
    >
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          flip && "lg:[&>*:first-child]:order-2",
        )}
      >
        {/* ------------------------------- image ------------------------------- */}
        <motion.div
          initial={{ opacity: 0, x: reduced ? 0 : flip ? 40 : -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.2 : 1, ease: EASE.frost as never }}
          className="relative"
        >
          <FrostFrame
            src={product.image}
            alt={`${product.name} held in a temperature-controlled zone at the Tahseen Jaber facility`}
            aspect="aspect-[4/3]"
            hud
            label={product.name}
            sublabel={`${index} · ${product.kicker}`}
            sizes="(max-width:1024px) 100vw, 46vw"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl opacity-45 blur-3xl"
            style={{ background: `radial-gradient(60% 60% at 50% 50%, ${product.accentSoft}, transparent 70%)` }}
          />
        </motion.div>

        {/* -------------------------------- copy -------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: reduced ? 0.2 : 0.9, delay: reduced ? 0 : 0.12, ease: EASE.frost as never }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg border"
              style={{ borderColor: `${product.accent}55`, background: product.accentSoft }}
            >
              <Icon className="h-4 w-4" style={{ color: product.accent }} aria-hidden />
            </span>
            <span className="font-mono text-[9px] tracking-[0.28em] text-silver/55 uppercase">
              {index} · {product.kicker}
            </span>
          </div>

          <MaskLines
            lines={[product.headline]}
            as="h2"
            delay={0.1}
            className="mt-5 font-display text-[clamp(1.9rem,4.4vw,3.1rem)] leading-[0.98] font-bold tracking-[-0.04em] text-frost"
          />

          <p className="mt-5 max-w-xl text-[0.96rem] leading-relaxed text-silver/80">{product.body}</p>

          {/* condition readouts */}
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10">
            <Readout
              icon={<ThermometerSnowflake className="h-3.5 w-3.5" aria-hidden />}
              label="Temperature"
              value={product.temperature}
              accent={product.accent}
            />
            <Readout
              icon={<Droplets className="h-3.5 w-3.5" aria-hidden />}
              label="Humidity"
              value={product.humidity}
              accent={product.accent}
            />
          </div>

          {/* features */}
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {product.features.map((f, i) => (
              <motion.li
                key={f}
                initial={{ opacity: 0, x: reduced ? 0 : -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.5, delay: reduced ? 0 : i * 0.06, ease: EASE.frost as never }}
                className="flex items-start gap-2.5 rounded-lg border border-ice/10 bg-navy/40 px-3.5 py-2.5"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                  style={{ background: product.accent }}
                />
                <span className="text-[0.82rem] leading-snug text-silver/80">{f}</span>
              </motion.li>
            ))}
          </ul>

          {/* handling */}
          <dl className="mt-6 space-y-px overflow-hidden rounded-xl border border-ice/12 bg-ice/8">
            {product.handling.map((h) => (
              <div key={h.label} className="flex items-baseline justify-between gap-4 bg-midnight px-4 py-3">
                <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/50 uppercase">{h.label}</dt>
                <dd className="text-right font-mono text-[9px] tracking-[0.12em] text-frost/90 uppercase">{h.value}</dd>
              </div>
            ))}
          </dl>

          <DemoNotice className="mt-6">
            Profile agreed per contract. Setpoints are configured against your product and are not
            published as a fixed figure, because a single number would misrepresent the range this
            zone can hold.
          </DemoNotice>
        </motion.div>
      </div>
    </article>
  );
}

function Readout({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-midnight px-4 py-3.5">
      <div className="flex items-center gap-2 font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-[0.95rem] font-bold tracking-[0.02em] text-frost uppercase">
        {value}
      </div>
    </div>
  );
}
