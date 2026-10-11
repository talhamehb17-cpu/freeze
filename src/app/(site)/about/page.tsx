import type { Metadata } from "next";
import { Compass, Gauge, Lock, ShieldCheck, Snowflake, ThermometerSnowflake } from "lucide-react";

import { FacilityMap } from "@/components/facility/FacilityMap";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { PageHero } from "@/components/layout/PageHero";
import { TrustSection } from "@/components/sections/TrustSection";
import { DemoNotice, HudPanel, HudRow } from "@/components/ui/Hud";
import { BRAND, LOCATION } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `${BRAND.full} operates temperature-controlled storage and cold-chain logistics from ${LOCATION.area}, ${LOCATION.city}, ${LOCATION.country}. How we work, and what we will not claim.`,
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    icon: ThermometerSnowflake,
    title: "The profile belongs to the product",
    body: "We do not publish one temperature for everything. Each category gets a room, an airflow pattern and a handling discipline agreed against your specification.",
  },
  {
    icon: Lock,
    title: "Separation is physical, not procedural",
    body: "Categories are zoned so they never share air. Where cross-contact must be eliminated entirely, a dedicated zone is separated rather than merely labelled.",
  },
  {
    icon: Gauge,
    title: "Every pallet has an address",
    body: "Batch, zone and location are recorded at put-away and follow the pallet to dispatch. Nothing moves through the building unaccounted for.",
  },
  {
    icon: ShieldCheck,
    title: "Custody is logged at each handover",
    body: "Gate, dock, zone and release are each a recorded event. Access is restricted, and the trail is auditable rather than remembered.",
  },
  {
    icon: Snowflake,
    title: "The chain does not pause for paperwork",
    body: "Documentation runs alongside the cold chain, not across it. Records, invoices and gate passes are issued without holding stock at ambient.",
  },
  {
    icon: Compass,
    title: "We say what we do not know",
    body: "Where a figure has not been confirmed — capacity, coverage, certification, a founding date — it is marked CONFIGURABLE rather than filled in with something plausible.",
  },
] as const;

/**
 * /about — how the business operates, stated plainly.
 *
 * No founding story, no awards, no client counts and no certifications appear
 * here, because none have been supplied. The Trust section carries explicit
 * "awaiting client confirmation" slots instead, which is the honest version of
 * the same page.
 */
export default function AboutPage() {
  return (
    <>
      <PageHero
        index="08"
        eyebrow="About"
        lines={["Engineered cold.", "Not improvised."]}
        lead={`${BRAND.full} operates temperature-controlled storage and cold-chain logistics from ${LOCATION.area}, ${LOCATION.city}. This page describes how the facility works — and, just as importantly, what we have not been able to confirm.`}
        image="/assets/team-cold-gear.jpg"
        imageAlt="Cold store aisle with racking, palletised stock and cold lighting"
        imageCode="ABT-01"
        meta={[
          { label: "Location", value: LOCATION.area },
          { label: "City", value: `${LOCATION.city}, ${LOCATION.country}` },
          { label: "Established", value: "PENDING CONFIRMATION", tone: "amber" },
          { label: "Discipline", value: "Zoned cold chain", tone: "cyan" },
        ]}
      />

      {/* ------------------------------ statement ------------------------------ */}
      <section
        aria-labelledby="about-statement"
        className="relative mx-auto w-full max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-core" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">Position</span>
            </div>
            <h2
              id="about-statement"
              className="mt-5 font-display text-[clamp(1.9rem,4.6vw,3.2rem)] leading-[0.98] font-bold tracking-[-0.045em] text-frost"
            >
              A cold store is judged
              <br />
              by what it holds,
              <br />
              <span className="text-gradient-frost">not what it claims.</span>
            </h2>
            <div className="mt-7 space-y-5 text-[0.98rem] leading-relaxed text-silver/80">
              <p>
                Refrigeration is the easy part to describe and the hard part to hold. What actually
                determines whether a load survives is the discipline around it: which room it goes
                into, how long the door stays open, who is allowed in, where the pallet is racked, and
                whether anyone can prove all of that afterwards.
              </p>
              <p>
                We built this facility around those questions. Zones are separated by category. Access
                is restricted and logged. Batches are addressable down to a rack location. Conditions
                are monitored continuously and surfaced through a command centre rather than a
                clipboard.
              </p>
              <p>
                We also built this site around a rule: nothing on it is invented. Where a number has
                not been confirmed by the business, it is marked CONFIGURABLE. Where data is
                illustrative rather than measured, it is badged DEMO. Where a certification has not
                been supplied, the slot is left visibly empty.
              </p>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <FrostFrame
                src="/assets/cold-room-aisle.jpg"
                alt="Cold room aisle with pallet racking under cold lighting"
                aspect="aspect-[4/3]"
                label="Cold room aisle"
                sublabel="ZN-04"
                sizes="(max-width:640px) 100vw, 44vw"
              />
              <FrostFrame
                src="/assets/control-room.jpg"
                alt="Operations control room with monitoring wall and workstations"
                aspect="aspect-[4/3]"
                label="Operations control"
                sublabel="CTL-01"
                sizes="(max-width:640px) 100vw, 44vw"
              />
            </div>
          </div>

          <div className="space-y-5">
            <HudPanel title="The record" code="ID">
              <div className="space-y-px px-5 py-4">
                <HudRow label="Business" value={BRAND.legal} tone="ice" />
                <HudRow label="Area" value={LOCATION.area} />
                <HudRow label="City" value={LOCATION.city} />
                <HudRow label="Country" value={LOCATION.country} />
                <HudRow label="Timezone" value={LOCATION.timezone} tone="cyan" />
                <HudRow label="Established" value="PENDING CONFIRMATION" tone="amber" />
                <HudRow label="Certifications" value="NOT SUPPLIED" tone="amber" />
                <HudRow label="Client count" value="NOT PUBLISHED" tone="amber" />
              </div>
              <div className="border-t border-ice/10 px-5 py-4">
                <DemoNotice>
                  These three rows stay visible until the business supplies them. Filling them with a
                  plausible-sounding date, a generic certificate or a rounded client count would be a
                  false claim on a public page.
                </DemoNotice>
              </div>
            </HudPanel>

            <HudPanel title="Facility at a glance" code="FAC">
              <div className="p-4">
                <FrostFrame
                  src="/assets/aerial-industrial.jpg"
                  alt="Industrial warehouse complex viewed from above at dusk"
                  aspect="aspect-[16/10]"
                  hud
                  label={LOCATION.area}
                  sublabel="EXT-01"
                  sizes="(max-width:1024px) 100vw, 38vw"
                />
              </div>
              <div className="border-t border-ice/10 px-5 py-4">
                <HudRow label="Mapped zones" value="8" tone="ice" />
                <div className="mt-2">
                  <HudRow label="Categories held" value="4" />
                </div>
                <div className="mt-2">
                  <HudRow label="Pallet capacity" value="CONFIGURABLE" tone="amber" />
                </div>
              </div>
            </HudPanel>
          </div>
        </div>
      </section>

      {/* ------------------------------ principles ------------------------------ */}
      <section
        aria-labelledby="about-principles"
        className="relative border-y border-ice/10 bg-[linear-gradient(180deg,rgba(8,20,38,0.55),rgba(5,9,20,0.9))]"
      >
        <div className="mx-auto w-full max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-cyan-core" aria-hidden />
            <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">Operating principles</span>
          </div>
          <h2
            id="about-principles"
            className="max-w-3xl font-display text-[clamp(1.9rem,4.6vw,3.2rem)] leading-[0.98] font-bold tracking-[-0.045em] text-frost"
          >
            Six rules we do not trade away.
          </h2>

          <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-ice/12 bg-ice/10 md:grid-cols-2 xl:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li
                key={p.title}
                className="group/prin relative bg-midnight p-6 transition-colors duration-500 hover:bg-industrial/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-core/28 bg-cyan-core/8 text-cyan-core transition-shadow duration-500 group-hover/prin:shadow-[0_0_26px_-6px_rgba(34,211,238,0.95)]">
                  <p.icon className="h-4 w-4" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-[1.05rem] leading-tight font-bold tracking-[-0.02em] text-frost">
                  {p.title}
                </h3>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-silver/75">{p.body}</p>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 group-hover/prin:scale-x-100"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FacilityMap />
      <TrustSection />
      <FinalCTA />
    </>
  );
}
