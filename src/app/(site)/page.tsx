import type { Metadata } from "next";

import { CapabilityBand } from "@/components/sections/CapabilityBand";
import { ColdChainTimeline } from "@/components/cold-chain/ColdChainTimeline";
import { PrecisionCooling } from "@/components/cold-chain/PrecisionCooling";
import { ProductVault } from "@/components/products/ProductVault";
import { FacilityMap } from "@/components/facility/FacilityMap";
import { InventoryScanner } from "@/components/inventory/InventoryScanner";
import { SecurityMatrix } from "@/components/security/SecurityMatrix";
import { LogisticsRoute } from "@/components/logistics/LogisticsRoute";
import { StorageOptions } from "@/components/sections/StorageOptions";
import { TrustSection } from "@/components/sections/TrustSection";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { HeroScene } from "@/components/hero/HeroScene";
import { ensureReady, listInventory } from "@/lib/db/repositories";
import { BRAND, LOCATION } from "@/lib/site";

export const metadata: Metadata = {
  title: `${BRAND.name} ${BRAND.suffix} | ${LOCATION.city}`,
  description: `${BRAND.promise} Zoned cold rooms, frozen storage, precision pharmaceutical holding and cold-chain logistics from ${LOCATION.area}, ${LOCATION.city}, ${LOCATION.country}.`,
  alternates: { canonical: "/" },
};

/**
 * The home page is the journey (spec §16):
 * HERO → COLD CHAIN → PRECISION COOLING → PRODUCTS → FACILITY → INVENTORY
 *      → SECURITY → LOGISTICS → FLEXIBLE STORAGE → TRUST → REQUEST STORAGE
 */
export default async function Home() {
  await ensureReady();
  // Inventory drives the scanner demo. Falls back to the seeded demo set when
  // no database is configured, so the page never renders empty.
  const items = await listInventory({ limit: 6 });

  return (
    <>
      <HeroScene />
      <CapabilityBand />
      <ColdChainTimeline />
      <PrecisionCooling />
      <ProductVault />
      <FacilityMap />
      <InventoryScanner items={items} />
      <SecurityMatrix />
      <LogisticsRoute />
      <StorageOptions />
      <TrustSection />
      <FinalCTA />
    </>
  );
}
