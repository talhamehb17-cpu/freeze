"use client";

import { ArrowRight, MessageSquare, Snowflake } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

import { EASE } from "@/animations/presets";
import { MagneticLink } from "@/components/ui/Button";
import { useFreeze } from "@/components/ui/FreezeOverlay";
import { MaskLines } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";

/**
 * FINAL CTA (spec §47).
 *
 * Dark facility, warehouse light, cold mist, minimal particles, enormous type.
 * Hovering the primary CTA fires a single frost pulse — the last beat of the
 * cold-chain story before the footer.
 */

export function FinalCTA() {
  const reduced = useReducedMotion();
  const { freeze } = useFreeze();

  return (
    <section
      id="request"
      className="relative isolate flex min-h-[92svh] w-full items-center overflow-hidden bg-midnight"
      aria-label="Request storage"
    >
      {/* facility bed */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/assets/facility-hero.jpg"
          alt="Tahseen Jaber cold storage facility illuminated at night"
          fill
          sizes="100vw"
          quality={78}
          className="object-cover object-center"
          style={{ filter: "saturate(0.6) contrast(1.15) brightness(0.42)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(3,6,14,0.98) 0%, rgba(5,9,20,0.72) 34%, rgba(5,9,20,0.86) 68%, rgba(3,6,14,1) 100%)",
          }}
        />
        <div
          className="absolute inset-0 mix-blend-color"
          style={{ background: "linear-gradient(200deg,#0a2a44,#050914 58%,#071c2c)" }}
        />
      </div>

      {/* warehouse light pools */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {[18, 42, 66, 88].map((left, i) => (
          <motion.span
            key={left}
            className={reduced ? "absolute top-0 h-[70vh] w-[9vw] blur-[70px]" : "absolute top-0 h-[70vh] w-[9vw] animate-breathe blur-[70px]"}
            style={{
              left: `${left}%`,
              background: "linear-gradient(180deg, rgba(125,211,252,0.22), transparent 76%)",
              transform: `rotate(${i % 2 === 0 ? 7 : -7}deg)`,
              animationDelay: `${i * -1.8}s`,
            }}
          />
        ))}
      </div>

      {/* floor mist */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[46vh] overflow-hidden" aria-hidden>
        <div
          className={reduced ? "absolute inset-x-[-20%] bottom-[-16%] h-[70%] blur-[54px]" : "absolute inset-x-[-20%] bottom-[-16%] h-[70%] animate-mist blur-[54px]"}
          style={{
            background:
              "radial-gradient(54% 100% at 34% 100%, rgba(244,250,255,0.2), transparent 72%), radial-gradient(46% 100% at 72% 100%, rgba(125,211,252,0.18), transparent 74%)",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1500px] px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.7, ease: EASE.frost as never }}
            className="flex items-center gap-3"
          >
            <Snowflake className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.34em] text-ice/85 uppercase">
              Begin the chain
            </span>
          </motion.div>

          <MaskLines
            as="h2"
            lines={["Your products.", "Our control."]}
            className="mt-6 font-display text-[clamp(3rem,11vw,8.5rem)] leading-[0.86] font-bold tracking-[-0.055em] text-frost"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, delay: 0.16, ease: EASE.frost as never }}
            className="mt-8 max-w-xl text-[1rem] leading-relaxed text-silver/85 sm:text-[1.12rem]"
          >
            Temperature-controlled storage built for modern supply chains — zoned, monitored,
            documented and released only against a verified gate pass.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.85, delay: 0.26, ease: EASE.frost as never }}
            className="mt-11 flex flex-wrap items-center gap-3 sm:gap-4"
          >
            <span
              onMouseEnter={() => {
                if (!reduced && typeof window !== "undefined") {
                  freeze({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.78 });
                }
              }}
              className="inline-flex"
            >
              <MagneticLink
                href="/request-storage"
                variant="primary"
                size="lg"
                iconRight={<ArrowRight className="h-4 w-4" aria-hidden />}
              >
                Request Storage
              </MagneticLink>
            </span>

            <MagneticLink
              href="/contact"
              variant="secondary"
              size="lg"
              icon={<MessageSquare className="h-4 w-4" aria-hidden />}
            >
              Contact us
            </MagneticLink>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            {["Uuayrij Industrial Area", "Baghdad, Iraq", "Zoned cold storage", "Cold-chain logistics"].map(
              (item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] text-silver/55 uppercase"
                >
                  <span className="h-1 w-1 rotate-45 bg-cyan-core/70" aria-hidden />
                  {item}
                </span>
              ),
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
