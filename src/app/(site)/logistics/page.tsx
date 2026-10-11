import type { Metadata } from "next";

import { ColdChainTimeline } from "@/components/cold-chain/ColdChainTimeline";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { LogisticsRoute } from "@/components/logistics/LogisticsRoute";
import { PageHero } from "@/components/layout/PageHero";
import { DemoNotice, HudPanel, HudRow } from "@/components/ui/Hud";
import { LOCATION, ROUTE_STEPS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cold-chain logistics",
  description: `Refrigerated movement between dock, zone and outbound vehicle from ${LOCATION.area}, ${LOCATION.city}. Receive, store, load, check, dispatch — custody preserved at every handover.`,
  alternates: { canonical: "/logistics" },
};

/**
 * /logistics — the route, then the five handovers that define it, then the
 * fleet. The map is explicitly labelled stylised and not to scale: it is a
 * diagram of the process, not a claim about coverage.
 */
export default function LogisticsPage() {
  return (
    <>
      <PageHero
        index="07"
        eyebrow="Logistics"
        lines={["The chain", "does not stop", "at the door."]}
        lead="Refrigerated movement between the dock, the zone and the outbound vehicle — logged at every handover so custody is never a matter of memory."
        image="/assets/fleet-night.jpg"
        imageAlt="Refrigerated trucks staged on a lit dispatch apron at night"
        imageCode="LOG-01"
        meta={[
          { label: "Handovers", value: String(ROUTE_STEPS.length), tone: "cyan" },
          { label: "Base", value: LOCATION.area },
          { label: "Custody", value: "Logged" },
          { label: "Coverage", value: "AWAITING CONFIRMATION", tone: "amber" },
        ]}
      />

      <LogisticsRoute />

      {/* ------------------------------ handovers ------------------------------ */}
      <section
        aria-labelledby="handovers"
        className="relative mx-auto w-full max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-core" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">Handovers</span>
            </div>
            <h2
              id="handovers"
              className="mt-5 font-display text-[clamp(1.9rem,4.4vw,3rem)] leading-[0.98] font-bold tracking-[-0.045em] text-frost"
            >
              Five points where
              <br />
              the chain can break.
            </h2>
            <p className="mt-5 max-w-xl text-[0.96rem] leading-relaxed text-silver/80">
              Intake, put-away, loading, gate verification and release. Each one is a place where
              temperature, custody or paperwork can go wrong — so each one is recorded.
            </p>

            <div className="mt-9">
              <FrostFrame
                src="/assets/loading-dock.jpg"
                alt="Dock-sealed loading bay with a refrigerated vehicle backed onto the leveller"
                aspect="aspect-[16/10]"
                hud
                label="Dock-sealed loading"
                sublabel="BAY-02"
                sizes="(max-width:1024px) 100vw, 44vw"
              />
            </div>
          </div>

          <ol className="space-y-3">
            {ROUTE_STEPS.map((step, i) => (
              <li
                key={step.key}
                className="panel group/step relative overflow-hidden rounded-xl px-5 py-5 transition-colors duration-500 hover:border-cyan-core/35"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-core/28 bg-cyan-core/8 font-display text-[0.95rem] font-bold text-cyan-core tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-[1.1rem] leading-tight font-bold tracking-[-0.02em] text-frost uppercase">
                      {step.label}
                    </h3>
                    <p className="mt-2 text-[0.88rem] leading-relaxed text-silver/75">{step.detail}</p>
                  </div>
                </div>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 group-hover/step:scale-x-100"
                />
              </li>
            ))}
          </ol>
        </div>

        {/* ------------------------------- fleet ------------------------------- */}
        <div className="mt-20 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FrostFrame
              src="/assets/fleet-night.jpg"
              alt="Refrigerated fleet parked on the facility apron under night lighting"
              aspect="aspect-[16/9]"
              hud
              label="Refrigerated fleet"
              sublabel="FLT-09"
              sizes="(max-width:1024px) 100vw, 62vw"
            />
          </div>
          <HudPanel title="Movement record" code="MOV">
            <div className="space-y-px px-5 py-4">
              <HudRow label="Intake" value="Logged at gate" tone="ice" />
              <HudRow label="Put-away" value="Bound to location" />
              <HudRow label="Loading" value="Dock sealed" tone="cyan" />
              <HudRow label="Gate pass" value="Verified" tone="cool" />
              <HudRow label="Release" value="Custody recorded" />
              <HudRow label="Fleet size" value="CONFIGURABLE" tone="amber" />
              <HudRow label="Delivery coverage" value="CONFIGURABLE" tone="amber" />
            </div>
            <div className="border-t border-ice/10 px-5 py-4">
              <DemoNotice>
                Vehicle count, delivery coverage and transit times have not been supplied. They are
                shown as CONFIGURABLE rather than estimated, and the route diagram is a stylised
                process map — not a claim about geographic reach.
              </DemoNotice>
            </div>
          </HudPanel>
        </div>
      </section>

      <ColdChainTimeline />
      <FinalCTA />
    </>
  );
}
