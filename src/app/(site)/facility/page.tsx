import type { Metadata } from "next";

import { FinalCTA } from "@/components/sections/FinalCTA";
import { FacilityMap } from "@/components/facility/FacilityMap";
import { StorageZone } from "@/components/facility/StorageZone";
import { InventoryScanner } from "@/components/inventory/InventoryScanner";
import { SecurityMatrix } from "@/components/security/SecurityMatrix";
import { PageHero } from "@/components/layout/PageHero";
import { ensureReady, listInventory, listZones } from "@/lib/db/repositories";
import { LOCATION, ZONES } from "@/lib/site";

export const metadata: Metadata = {
  title: "The facility",
  description: `Eight mapped zones across receiving, chilled, frozen, pharmaceutical, loading, dispatch and security at ${LOCATION.area}, ${LOCATION.city}. Interactive floor plan, zone dossiers and access control.`,
  alternates: { canonical: "/facility" },
};

/**
 * /facility — floor plan first (the interactive map), then every zone in full,
 * then the two systems that make the building trustworthy: batch verification
 * and access control.
 */
export default async function FacilityPage() {
  await ensureReady();

  const [liveZones, inventory] = await Promise.all([listZones(), listInventory({ limit: 6 })]);
  const liveByCode = new Map(liveZones.map((z) => [z.code, z]));

  return (
    <>
      <PageHero
        index="04"
        eyebrow="The building"
        lines={["Eight zones.", "One controlled envelope."]}
        lead={`Receiving, chilled, frozen, precision, loading, dispatch and security — separated so categories never share air, and mapped so every pallet has an address. ${LOCATION.area}, ${LOCATION.city}.`}
        image="/assets/aerial-industrial.jpg"
        imageAlt="Industrial warehouse complex viewed from above at dusk"
        imageCode="FAC-01"
        meta={[
          { label: "Mapped zones", value: String(ZONES.length), tone: "cyan" },
          { label: "Monitored", value: String(ZONES.filter((z) => z.monitored).length) },
          { label: "Location", value: LOCATION.area },
          { label: "Capacity", value: "CONFIGURABLE", tone: "amber" },
        ]}
      />

      <FacilityMap />

      {/* ---------------------------- zone dossiers ---------------------------- */}
      <section
        aria-labelledby="zone-dossiers"
        className="relative mx-auto w-full max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-cyan-core" aria-hidden />
          <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">Zone dossiers</span>
        </div>
        <h2
          id="zone-dossiers"
          className="max-w-3xl font-display text-[clamp(1.9rem,4.6vw,3.2rem)] leading-[0.98] font-bold tracking-[-0.045em] text-frost"
        >
          Every room has a job.
        </h2>
        <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-silver/80">
          Select a zone on the floor plan to see it here. Conditions shown are illustrative until a
          sensor provider is connected; pallet capacity stays CONFIGURABLE until the business confirms
          a real figure.
        </p>

        <div className="mt-14 grid gap-5">
          {ZONES.map((z, i) => (
            <StorageZone
              key={z.id}
              zone={z}
              index={String(i + 1).padStart(2, "0")}
              live={liveByCode.get(z.code)}
            />
          ))}
        </div>
      </section>

      <InventoryScanner items={inventory} />
      <SecurityMatrix />
      <FinalCTA />
    </>
  );
}
