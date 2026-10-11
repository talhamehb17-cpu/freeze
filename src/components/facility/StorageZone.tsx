"use client";

import { motion } from "framer-motion";
import { Layers, ThermometerSnowflake } from "lucide-react";

import { EASE } from "@/animations/presets";
import { FrostFrame } from "@/components/ui/FrostFrame";
import { StatusPill } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import type { Zone } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * STORAGE ZONE (spec §21) — one zone, in full.
 *
 * Photograph, purpose, mapped status and the reported condition. Capacity is
 * printed as CONFIGURABLE unless the business has confirmed a real figure —
 * the component has no way to invent one and does not try.
 */

const ZONE_IMAGES: Record<Zone["kind"], { src: string; alt: string }> = {
  receiving: { src: "/assets/loading-dock.jpg", alt: "Receiving hall with dock levellers and staged inbound cargo" },
  cold: { src: "/assets/cold-room-aisle.jpg", alt: "Chilled cold room aisle with pallet racking" },
  frozen: { src: "/assets/cold-room-aisle.jpg", alt: "Frozen storage aisle with racked palletised stock" },
  pharma: { src: "/assets/product-pharma.jpg", alt: "Precision pharmaceutical vault with controlled shelving" },
  loading: { src: "/assets/loading-dock.jpg", alt: "Loading bay with a docked refrigerated vehicle" },
  dispatch: { src: "/assets/fleet-night.jpg", alt: "Dispatch apron with refrigerated fleet at night" },
  security: { src: "/assets/security-camera.jpg", alt: "Security and control position monitoring the facility" },
};

export function StorageZone({
  zone,
  index,
  live,
}: {
  zone: Zone;
  index: string;
  /** Reported condition from the data layer, when a record exists. */
  live?: {
    temperature: number | null;
    humidity: number | null;
    occupancyPct: number;
    status: string;
  };
}) {
  const reduced = useReducedMotion();
  const image = ZONE_IMAGES[zone.kind];

  return (
    <motion.article
      id={`zone-${zone.id}`}
      initial={{ opacity: 0, y: reduced ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: reduced ? 0.2 : 0.9, ease: EASE.frost as never }}
      className="panel group/zone scroll-mt-28 overflow-hidden rounded-2xl"
    >
      <div className="grid lg:grid-cols-[1fr_1.05fr]">
        <div className="relative p-4 sm:p-5">
          <FrostFrame
            src={image.src}
            alt={image.alt}
            aspect="aspect-[16/11]"
            hud
            label={zone.name}
            sublabel={zone.code}
            sizes="(max-width:1024px) 100vw, 44vw"
            kenBurns={false}
          />
        </div>

        <div className="flex flex-col justify-center gap-5 px-5 py-6 sm:px-7">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.28em] text-cyan-core tabular">{index}</span>
            <span className="h-px w-6 bg-cyan-core/60" aria-hidden />
            <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.24em] text-silver/55 uppercase">
              <Layers className="h-3 w-3" aria-hidden />
              {zone.kind}
            </span>
            <StatusPill status={zone.status} size="xs" pulse={false} className="ml-auto" />
          </div>

          <h3 className="font-display text-[clamp(1.5rem,3.2vw,2.1rem)] leading-[1] font-bold tracking-[-0.035em] text-frost">
            {zone.name}
          </h3>

          <p className="text-[0.92rem] leading-relaxed text-silver/80">{zone.purpose}</p>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10 sm:grid-cols-4">
            <Cell
              label="Condition"
              value={zone.temperature}
              icon={<ThermometerSnowflake className="h-3 w-3" aria-hidden />}
              tone="cyan"
            />
            <Cell
              label="Reported"
              value={live?.temperature == null ? "CONFIGURABLE" : `${live.temperature.toFixed(1)}°C`}
            />
            <Cell label="Humidity" value={live?.humidity == null ? "—" : `${Math.round(live.humidity)}% RH`} />
            <Cell
              label="Capacity"
              value={zone.capacity ? `${zone.capacity.value} ${zone.capacity.unit}` : "CONFIGURABLE"}
              tone={zone.capacity ? "frost" : "amber"}
            />
          </dl>

          {live && (
            <div>
              <div className="flex items-baseline justify-between gap-3 font-mono text-[8px] tracking-[0.18em] text-silver/45 uppercase">
                <span>Occupancy</span>
                <span className="tabular">{Math.round(live.occupancyPct)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-steel/60">
                <motion.span
                  className={cn(
                    "block h-full rounded-full",
                    live.occupancyPct > 90
                      ? "bg-danger"
                      : live.occupancyPct > 75
                        ? "bg-amber-tj"
                        : "bg-gradient-to-r from-cyan-core to-ice",
                  )}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(100, Math.max(2, live.occupancyPct))}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: reduced ? 0.15 : 1.1, ease: EASE.frost as never }}
                />
              </div>
            </div>
          )}

          {!zone.capacity && (
            <p className="rounded-md border border-amber-tj/30 bg-amber-tj/8 px-3.5 py-2.5 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-amber-tj/85 uppercase">
              Pallet capacity awaiting client confirmation — shown as CONFIGURABLE rather than
              estimated.
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function Cell({
  label,
  value,
  icon,
  tone = "frost",
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "frost" | "cyan" | "amber";
}) {
  return (
    <div className="bg-midnight px-3 py-2.5">
      <dt className="flex items-center gap-1.5 font-mono text-[7px] tracking-[0.2em] text-silver/45 uppercase">
        {icon && <span className="text-cyan-core/80">{icon}</span>}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1.5 font-mono text-[10px] tracking-[0.06em] uppercase",
          tone === "cyan" ? "text-cyan-core" : tone === "amber" ? "text-amber-tj" : "text-frost",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
