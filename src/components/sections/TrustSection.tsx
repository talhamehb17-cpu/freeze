"use client";

import { motion } from "framer-motion";
import { BadgeCheck, FileCheck2, History, ScrollText, ShieldCheck, Trophy } from "lucide-react";

import { EASE } from "@/animations/presets";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { DemoBadge } from "@/components/ui/Hud";
import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { TRUST_POINTS } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * TRUST (spec §16, §45).
 *
 * We cannot invent certifications, awards, client counts, capacity figures or
 * testimonials — so this section does something more credible instead: it
 * states the operating commitments we can actually stand behind, and shows the
 * unverified items as explicit "pending confirmation" slots the client fills in.
 */

const COMMITMENTS = [
  {
    Icon: ShieldCheck,
    title: "Zoned separation",
    body: "Categories are physically separated so cross-contact and odour transfer are engineered out, not managed after the fact.",
  },
  {
    Icon: FileCheck2,
    title: "Documented handling",
    body: "Intake, put-away, movement and release each produce a record bound to the batch, not to a memory.",
  },
  {
    Icon: ScrollText,
    title: "Honest reporting",
    body: "Where a figure is not confirmed we publish CONFIGURABLE. We would rather show a gap than fill it with a guess.",
  },
  {
    Icon: BadgeCheck,
    title: "Controlled access",
    body: "Restricted zones are badged and logged. Access is a permission, not a habit.",
  },
] as const;

/** Items that require client-supplied proof before they can be published. */
const PENDING = [
  { Icon: Trophy, label: "Certifications", note: "Published once certificates are supplied and verified" },
  { Icon: History, label: "Company history", note: "Written from confirmed facts, never assumed" },
  { Icon: BadgeCheck, label: "Client references", note: "Shown only with explicit client permission" },
] as const;

export function TrustSection() {
  const reduced = useReducedMotion();

  return (
    <section
      id="trust"
      className="relative isolate overflow-hidden bg-midnight py-24 sm:py-32"
      aria-label="Operating commitments"
    >
      <div className="relative mx-auto w-full max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <GhostIndex index="09" className="-top-10 -left-4 hidden lg:block" />
            <Kicker index="09">Trust</Kicker>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,6vw,4.4rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
              We publish
              <br />
              <span className="text-gradient-frost">what we can prove.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
              A cold store is trusted on evidence, not adjectives. These are the commitments we
              operate to; anything we cannot evidence is listed as pending rather than claimed.
            </p>

            <ul className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {TRUST_POINTS.map((point, i) => (
                <motion.li
                  key={point.label}
                  initial={{ opacity: 0, y: reduced ? 0 : 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.55, delay: i * 0.05, ease: EASE.frost as never }}
                  className="border-l border-ice/14 pl-3.5"
                >
                  <div className="font-mono text-[8px] tracking-[0.2em] text-silver/50 uppercase">
                    {point.label}
                  </div>
                  <div className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-ice uppercase">
                    {point.value}
                  </div>
                </motion.li>
              ))}
            </ul>

            <div className="mt-9">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] tracking-[0.26em] text-silver/55 uppercase">
                  Awaiting client confirmation
                </span>
                <span className="h-px flex-1 bg-ice/12" />
                <DemoBadge size="xs" label="Pending" />
              </div>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {PENDING.map(({ Icon, label, note }) => (
                  <li
                    key={label}
                    className="rounded-lg border border-dashed border-amber-tj/30 bg-amber-tj/[0.05] px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-amber-tj/80" aria-hidden />
                      <span className="font-mono text-[9px] tracking-[0.18em] text-amber-tj/85 uppercase">
                        {label}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-[8.5px] leading-relaxed tracking-[0.1em] text-silver/50 uppercase">
                      {note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {COMMITMENTS.map(({ Icon, title, body }, i) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, x: reduced ? 0 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.7, delay: i * 0.08, ease: EASE.frost as never }}
                className={cn(
                  "group/trust panel relative flex items-start gap-5 overflow-hidden rounded-xl p-5 sm:p-6",
                  "transition-[border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-cyan-core/40",
                )}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-core/30 bg-cyan-core/10 text-cyan-core transition-shadow duration-500 group-hover/trust:shadow-[0_0_26px_-6px_rgba(34,211,238,0.95)]">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold tracking-[-0.02em] text-frost">
                    {title}
                  </span>
                  <span className="mt-2 block text-[0.88rem] leading-relaxed text-silver/75">{body}</span>
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-gradient-to-b from-cyan-core to-transparent transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/trust:scale-y-100"
                />
              </motion.article>
            ))}

            <FrostFrame
              src="/assets/security-camera.jpg"
              alt="Industrial security camera with frost on the housing inside a cold storage facility"
              aspect="aspect-[16/7]"
              hud
              label="Controlled boundary"
              sublabel="Gate · zone · door"
              sizes="(max-width:1024px) 100vw, 46vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
