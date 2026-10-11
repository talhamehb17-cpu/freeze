import type { Metadata } from "next";
import {
  Activity,
  Boxes,
  FileText,
  ShieldCheck,
  ThermometerSnowflake,
  Truck,
} from "lucide-react";

import { ColdChainTimeline } from "@/components/cold-chain/ColdChainTimeline";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { PageHero } from "@/components/layout/PageHero";
import { PrecisionCooling } from "@/components/cold-chain/PrecisionCooling";
import { ProductVault } from "@/components/products/ProductVault";
import { StorageOptions } from "@/components/sections/StorageOptions";
import { SERVICES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Temperature-controlled storage, cold-chain logistics, batch traceability, facility monitoring, secure access control and documentation — six services operating as one system.",
  alternates: { canonical: "/solutions" },
};

const SERVICE_ICONS = {
  thermometer: ThermometerSnowflake,
  truck: Truck,
  boxes: Boxes,
  activity: Activity,
  shield: ShieldCheck,
  file: FileText,
} as const;

/** Each service gets a photograph — the solutions page should be seen, not read. */
const SERVICE_IMAGES = [
  { src: "/assets/cold-room-aisle.jpg", alt: "Chilled cold room aisle with pallet racking under cold lighting" },
  { src: "/assets/fleet-night.jpg", alt: "Refrigerated fleet staged on the dispatch apron at night" },
  { src: "/assets/product-produce.jpg", alt: "Crates of fresh produce staged for batch tracking" },
  { src: "/assets/control-room.jpg", alt: "Facility monitoring control room with a telemetry wall" },
  { src: "/assets/security-camera.jpg", alt: "Warehouse interior covered by camera and access control" },
  { src: "/assets/loading-dock.jpg", alt: "Loading dock with paperwork and staged outbound cargo" },
] as const;

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        index="02"
        eyebrow="Solutions"
        lines={["Six services.", "One system."]}
        lead="Refrigeration, racking, access control, inventory records, monitoring and transport. Run separately they are a warehouse with a chiller. Run together they are a cold chain."
        image="/assets/facility-hero.jpg"
        imageAlt="Refrigerated warehouse interior with racking and cold lighting"
        imageCode="SOL-01"
        meta={[
          { label: "Services", value: String(SERVICES.length), tone: "cyan" },
          { label: "Storage models", value: "4" },
          { label: "Traceability", value: "Per pallet" },
          { label: "Monitoring", value: "Continuous" },
        ]}
      />

      {/* ------------------------------ services ------------------------------ */}
      <section
        aria-labelledby="solutions-grid"
        className="relative mx-auto w-full max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-cyan-core" aria-hidden />
          <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">What we operate</span>
        </div>
        <h2
          id="solutions-grid"
          className="max-w-3xl font-display text-[clamp(1.9rem,4.6vw,3.2rem)] leading-[0.98] font-bold tracking-[-0.045em] text-frost"
        >
          Every layer of the chain.
        </h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {SERVICES.map((service, i) => {
            const Icon = SERVICE_ICONS[service.icon as keyof typeof SERVICE_ICONS];
            const image = SERVICE_IMAGES[i % SERVICE_IMAGES.length]!;
            return (
              <article
                key={service.title}
                id={`service-${i + 1}`}
                className="panel group/svc scroll-mt-28 overflow-hidden rounded-2xl transition-colors duration-500 hover:border-cyan-core/35"
              >
                <div className="relative">
                  <FrostFrame
                    src={image.src}
                    alt={image.alt}
                    aspect="aspect-[16/8]"
                    hud
                    label={service.title}
                    sublabel={`Service ${String(i + 1).padStart(2, "0")}`}
                    sizes="(max-width:1024px) 100vw, 46vw"
                    kenBurns={false}
                  />
                </div>
                <div className="px-5 py-6 sm:px-7">
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cyan-core/28 bg-cyan-core/8 text-cyan-core transition-shadow duration-500 group-hover/svc:shadow-[0_0_26px_-6px_rgba(34,211,238,0.95)]">
                      <Icon className="h-4.5 w-4.5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-display text-[1.15rem] leading-tight font-bold tracking-[-0.025em] text-frost">
                        {service.title}
                      </h3>
                      <p className="mt-2.5 text-[0.9rem] leading-relaxed text-silver/78">{service.body}</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <ColdChainTimeline />
      <PrecisionCooling />
      <ProductVault />
      <StorageOptions />
      <FinalCTA />
    </>
  );
}
