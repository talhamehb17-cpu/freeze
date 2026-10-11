"use client";

import Image from "next/image";
import {
  Activity,
  Boxes,
  ClipboardList,
  Route as RouteIcon,
  ThermometerSnowflake,
  Truck,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef, useState } from "react";

import { GhostIndex, Kicker } from "@/components/ui/Typography";
import { StatusPill } from "@/components/ui/Hud";
import { useReducedMotion, useIsTouch } from "@/hooks/use-motion";
import { COLD_CHAIN_STAGES, type Stage } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * THE COLD CHAIN (spec §17).
 *
 * Desktop: the section pins and the journey travels horizontally as you scroll —
 * ARRIVAL → RECEIVING → TEMPERATURE CONTROL → STORAGE → MONITORING → DISPATCH.
 * The connecting line fills in exact proportion to scroll progress, and each
 * stage activates (icon draws, panel lights, image unfrosts) as it reaches the
 * centre of the viewport.
 *
 * Mobile / reduced motion: the same content as a clean vertical timeline. No
 * pinning, no horizontal drag — the story still reads top to bottom.
 */

const ICONS = {
  truck: Truck,
  clipboard: ClipboardList,
  thermometer: ThermometerSnowflake,
  boxes: Boxes,
  activity: Activity,
  route: RouteIcon,
} as const;

const STAGE_IMAGE: Record<Stage["key"], { src: string; alt: string }> = {
  arrival: { src: "/assets/facility-hero.jpg", alt: "Refrigerated vehicle arriving at the facility gate at night" },
  receiving: { src: "/assets/loading-dock.jpg", alt: "Loading dock door open with cold fog rolling out" },
  temperature: { src: "/assets/cold-room-aisle.jpg", alt: "Frozen storage aisle under cold blue lighting" },
  storage: { src: "/assets/product-produce.jpg", alt: "Palletised produce in a chilled storage room" },
  monitoring: { src: "/assets/control-room.jpg", alt: "Facility operations control room with monitoring wall" },
  dispatch: { src: "/assets/fleet-night.jpg", alt: "Refrigerated fleet staged for dispatch at night" },
};

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function ColdChainTimeline() {
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const horizontal = !reduced && !touch;

  const sectionRef = useRef<HTMLElement | null>(null);
  const pinRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lineRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!horizontal) return;
    const section = sectionRef.current;
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!section || !pin || !track) return;

    const ctx = gsap.context(() => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance() + window.innerHeight * 0.6}`,
          pin,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (lineRef.current) {
              lineRef.current.style.transform = `scaleX(${self.progress})`;
            }
            const next = Math.min(
              COLD_CHAIN_STAGES.length - 1,
              Math.round(self.progress * (COLD_CHAIN_STAGES.length - 1)),
            );
            setActive((prev) => (prev === next ? prev : next));
          },
        },
      });

      return () => tween.scrollTrigger?.kill();
    }, section);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, [horizontal]);

  return (
    <section
      ref={sectionRef}
      id="cold-chain"
      className="relative isolate bg-midnight"
      aria-label="The cold chain journey"
    >
      {/* ------------------------------ header ------------------------------ */}
      <div className="relative mx-auto w-full max-w-[1500px] px-5 pt-24 pb-10 sm:px-8 sm:pt-32 lg:px-12">
        <GhostIndex index="01" className="-top-6 right-0 lg:right-10" />
        <Kicker index="01">The cold chain</Kicker>
        <h2 className="mt-5 max-w-4xl font-display text-[clamp(2.2rem,6vw,4.6rem)] leading-[0.92] font-bold tracking-[-0.045em] text-frost">
          Six stages.
          <br />
          <span className="text-gradient-frost">One unbroken chain.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-[0.98rem] leading-relaxed text-silver/80 sm:text-[1.05rem]">
          From the moment a vehicle reaches the gate to the moment it is released, the product
          never leaves a controlled environment. Scroll the journey.
        </p>

        {/* stage rail */}
        <div className="mt-10 hidden items-center gap-4 lg:flex">
          <div className="relative h-px flex-1 overflow-hidden bg-ice/12">
            <div
              ref={lineRef}
              className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-cyan-core via-ice to-frost"
              style={{ transition: "transform 120ms linear" }}
            />
          </div>
          <span className="font-mono text-[9px] tracking-[0.26em] text-silver/55 uppercase tabular">
            {String(active + 1).padStart(2, "0")} / {String(COLD_CHAIN_STAGES.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* --------------------------- horizontal --------------------------- */}
      {horizontal ? (
        <div ref={pinRef} className="relative h-[100svh] w-full overflow-hidden">
          <div
            ref={trackRef}
            className="flex h-full w-max items-center gap-6 px-[8vw] will-change-transform"
          >
            {COLD_CHAIN_STAGES.map((stage, i) => (
              <StageCard key={stage.key} stage={stage} index={i} active={i === active} horizontal />
            ))}

            {/* terminal panel */}
            <div className="flex h-[74vh] w-[26rem] shrink-0 flex-col justify-center rounded-2xl border border-cyan-core/25 bg-[linear-gradient(160deg,rgba(21,34,53,0.8),rgba(5,9,20,0.94))] p-9">
              <SnowflakeGlyph className="h-10 w-10 text-cyan-core" />
              <h3 className="mt-7 font-display text-3xl leading-[0.95] font-bold tracking-[-0.03em] text-frost">
                The chain
                <br />
                never breaks.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-silver/75">
                Every stage is logged, every handover is documented, and every batch stays
                addressable from arrival to dispatch.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <StatusPill status="ACTIVE" />
                <StatusPill status="SECURED" />
              </div>
            </div>
          </div>

          {/* ambient floor light */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(34,211,238,0.08) 60%, rgba(5,9,20,0.95))",
            }}
            aria-hidden
          />
        </div>
      ) : (
        /* --------------------------- vertical --------------------------- */
        <div className="relative mx-auto w-full max-w-[1500px] px-5 pb-24 sm:px-8 lg:px-12">
          <div className="relative">
            <span className="absolute top-0 bottom-0 left-[15px] w-px bg-gradient-to-b from-cyan-core/60 via-ice/20 to-transparent sm:left-[19px]" aria-hidden />
            <ol className="flex flex-col gap-6">
              {COLD_CHAIN_STAGES.map((stage, i) => (
                <li key={stage.key} className="relative pl-12 sm:pl-16">
                  <span
                    className="absolute top-6 left-0 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-core/50 bg-midnight font-mono text-[9px] text-cyan-core sm:h-10 sm:w-10 sm:text-[10px]"
                    aria-hidden
                  >
                    {stage.index}
                  </span>
                  <StageCard stage={stage} index={i} active />
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function StageCard({
  stage,
  index,
  active,
  horizontal = false,
}: {
  stage: Stage;
  index: number;
  active: boolean;
  horizontal?: boolean;
}) {
  const Icon = ICONS[stage.icon];
  const image = STAGE_IMAGE[stage.key];

  return (
    <article
      className={cn(
        "group/stage relative shrink-0 overflow-hidden rounded-2xl border transition-[border-color,box-shadow,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        active
          ? "border-cyan-core/45 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_40px_90px_-50px_rgba(34,211,238,0.6)]"
          : "border-ice/12",
        horizontal
          ? "flex h-[74vh] w-[27rem] flex-col bg-[linear-gradient(165deg,rgba(21,34,53,0.72),rgba(5,9,20,0.92))]"
          : "bg-[linear-gradient(165deg,rgba(21,34,53,0.6),rgba(5,9,20,0.9))]",
      )}
    >
      {/* image */}
      <div className={cn("relative overflow-hidden", horizontal ? "h-[38%]" : "h-44 sm:h-52")} data-image="true">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={horizontal ? "27rem" : "(max-width:640px) 100vw, 40rem"}
          quality={75}
          className={cn(
            "object-cover transition-[transform,filter,opacity] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
            active ? "scale-100 opacity-90 saturate-100" : "scale-110 opacity-40 saturate-[0.35]",
          )}
          style={{ filter: active ? undefined : "blur(1.5px)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,9,20,0.35) 0%, rgba(5,9,20,0.1) 40%, rgba(5,9,20,0.94) 100%)",
          }}
        />
        {/* frost that melts as the stage activates */}
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: active ? 0 : 0.55,
            background:
              "radial-gradient(110% 90% at 50% 50%, transparent 34%, rgba(244,250,255,0.2) 78%, rgba(244,250,255,0.42) 100%)",
          }}
        />
        <div className="absolute top-3.5 left-4 flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md border transition-all duration-500",
              active
                ? "border-cyan-core/70 bg-cyan-core/18 text-cyan-core shadow-[0_0_20px_-6px_rgba(34,211,238,0.9)]"
                : "border-ice/20 bg-navy/70 text-silver/60",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-mono text-[9px] tracking-[0.26em] text-frost/80 uppercase">
            {stage.index}
          </span>
        </div>
      </div>

      {/* body */}
      <div className={cn("flex flex-1 flex-col p-6", horizontal && "p-7")}>
        <h3 className="font-display text-[1.5rem] leading-none font-bold tracking-[-0.03em] text-frost uppercase">
          {stage.title}
        </h3>
        <p
          className={cn(
            "mt-2.5 font-mono text-[9px] tracking-[0.22em] uppercase transition-colors duration-500",
            active ? "text-cyan-core" : "text-silver/45",
          )}
        >
          {stage.short}
        </p>
        <p className="mt-4 flex-1 text-[0.86rem] leading-relaxed text-silver/75">{stage.body}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-ice/10 pt-4">
          {stage.metric.map((m) => (
            <div key={m.label}>
              <div className="font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">
                {m.label}
              </div>
              <div
                className={cn(
                  "mt-1 font-mono text-[10px] tracking-[0.14em] transition-colors duration-500",
                  active ? "text-ice" : "text-silver/60",
                )}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* activation sweep */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
          active ? "scale-x-100" : "scale-x-0",
        )}
        aria-hidden
      />
      <span className="sr-only">
        Stage {index + 1} of {COLD_CHAIN_STAGES.length}
      </span>
    </article>
  );
}

function SnowflakeGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M24 5v38M7.5 14.5l33 19M40.5 14.5l-33 19" />
        <path d="M24 12l-4.5-4.5M24 12l4.5-4.5M24 36l-4.5 4.5M24 36l4.5 4.5" />
        <path d="M13.5 18l-6.2-1M13.5 18l-1-6.2M34.5 30l6.2 1M34.5 30l1 6.2" />
        <path d="M34.5 18l6.2-1M34.5 18l1-6.2M13.5 30l-6.2 1M13.5 30l-1 6.2" />
      </g>
    </svg>
  );
}
