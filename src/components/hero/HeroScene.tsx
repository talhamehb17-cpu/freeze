"use client";

import { ArrowRight, Boxes, Fish, Leaf, Pill, Snowflake } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { EASE } from "@/animations/presets";
import { TemperatureController } from "@/components/hero/TemperatureController";
import { TemperatureHUD } from "@/components/hero/TemperatureHUD";
import { HeroSlider } from "@/components/hero/HeroSlider";
import { AnimatedTruck } from "@/components/hero/AnimatedTruck";
import { LoadingBay } from "@/components/hero/LoadingBay";
import { useTemperature } from "@/components/atmosphere/TemperatureProvider";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";

/**
 * HERO — "COLD CHAIN ARRIVAL" (spec §10–§14).
 *
 * One GSAP timeline runs the whole story:
 *   01 DARKNESS   →  02 ATMOSPHERE  →  03 TRUCK ARRIVAL  →  04 DOCKING
 *   05 DOOR OPENS →  06 CARGO       →  07 SYSTEM ACTIVE  →  08 BRAND REVEAL
 *
 * Total ≈ 4.9s and it is SKIPPABLE: any scroll, click, tap or keypress jumps
 * straight to the finished state. Nobody is ever made to wait for an animation.
 *
 * Everything animates DOM/CSS directly (transforms, opacity, CSS custom
 * properties) — the timeline never triggers a React re-render.
 */

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

const SCENES = [
  { at: 0.0, code: "01", label: "Darkness" },
  { at: 0.22, code: "02", label: "Atmosphere" },
  { at: 0.42, code: "03", label: "Truck arrival" },
  { at: 1.95, code: "04", label: "Docking" },
  { at: 2.25, code: "05", label: "Cold room opens" },
  { at: 3.15, code: "06", label: "Cargo" },
  { at: 3.6, code: "07", label: "Systems active" },
  { at: 4.0, code: "08", label: "Brand reveal" },
] as const;

const CARGO = [
  { key: "PRODUCE", Icon: Leaf, tone: "#4ade80" },
  { key: "MEAT", Icon: Boxes, tone: "#7DD3FC" },
  { key: "SEAFOOD", Icon: Fish, tone: "#22D3EE" },
  { key: "PHARMA", Icon: Pill, tone: "#a5b4fc" },
] as const;

export function HeroScene() {
  const reduced = useReducedMotion();
  const { frost, temperature } = useTemperature();

  const rootRef = useRef<HTMLElement | null>(null);
  const bayRef = useRef<HTMLDivElement | null>(null);
  const truckRef = useRef<HTMLDivElement | null>(null);
  const truckBodyRef = useRef<HTMLDivElement | null>(null);
  const cargoRef = useRef<HTMLDivElement | null>(null);
  const hudRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const veilRef = useRef<HTMLDivElement | null>(null);
  const mistRef = useRef<HTMLDivElement | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const [scene, setScene] = useState<(typeof SCENES)[number]>(SCENES[0]);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  const skip = useCallback(() => {
    const tl = tlRef.current;
    if (tl && tl.progress() < 1) tl.progress(1);
    setDone(true);
  }, []);

  /* ------------------------------ the timeline ----------------------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Final-state helpers so skipping / reduced motion is exact.
    const finish = () => {
      gsap.set(bayRef.current, { "--bay-open": 1, "--bay-spill": 1, "--bay-glow": 1 });
      gsap.set(truckRef.current, { x: 0 });
      gsap.set(truckBodyRef.current, { opacity: 1 });
      gsap.set([hudRef.current?.children ?? [], copyRef.current?.querySelectorAll(".hero-anim") ?? []], {
        opacity: 1,
        y: 0,
      });
      gsap.set(ctaRef.current?.children ?? [], { opacity: 1, y: 0 });
      gsap.set(veilRef.current, { opacity: 0 });
      gsap.set(mistRef.current, { opacity: 1 });
      root.querySelectorAll<HTMLElement>(".hero-line > span").forEach((el) => {
        gsap.set(el, { yPercent: 0 });
      });
      setScene(SCENES[SCENES.length - 1]);
      setDone(true);
      setReady(true);
    };

    if (reduced) {
      finish();
      return;
    }

    const ctx = gsap.context(() => {
      const bay = bayRef.current!;
      const truck = truckRef.current!;
      const dockX = 0;
      const startX = -(truck.getBoundingClientRect().right + 80);

      gsap.set(bay, { "--bay-open": 0, "--bay-spill": 0, "--bay-glow": 0.35 });
      gsap.set(truck, { x: startX });
      gsap.set(truckBodyRef.current, { opacity: 1 });
      gsap.set(veilRef.current, { opacity: 1 });
      gsap.set(mistRef.current, { opacity: 0 });
      gsap.set(hudRef.current?.children ?? [], { opacity: 0, y: 26 });
      gsap.set(ctaRef.current?.children ?? [], { opacity: 0, y: 22 });
      gsap.set(copyRef.current?.querySelectorAll(".hero-anim") ?? [], { opacity: 0, y: 20 });
      gsap.set(cargoRef.current?.children ?? [], { opacity: 0, x: -70, scale: 0.9 });
      gsap.set(".hero-line > span", { yPercent: 108 });
      gsap.set(railRef.current, { opacity: 0 });

      const tl = gsap.timeline({
        delay: 0.18,
        defaults: { ease: EASE.frost.join(",") as unknown as gsap.EaseString },
        onStart: () => setReady(true),
        onComplete: () => {
          setDone(true);
          setScene(SCENES[SCENES.length - 1]);
        },
        onUpdate: () => {
          const t = tl.time();
          let current: (typeof SCENES)[number] = SCENES[0];
          for (const s of SCENES) if (t >= s.at) current = s;
          setScene((prev) => (prev.code === current.code ? prev : current));
        },
      });

      // 01 — DARKNESS: a veil of deep navy lifts off the scene.
      tl.to(veilRef.current, { opacity: 0, duration: 1.15, ease: "power2.out" }, 0);
      tl.to(railRef.current, { opacity: 1, duration: 0.8 }, 0.1);

      // 02 — ATMOSPHERE: cold mist creeps across the floor.
      tl.to(mistRef.current, { opacity: 1, duration: 1.5, ease: "power1.inOut" }, 0.35);
      tl.to(bay, { "--bay-glow": 0.62, duration: 1.4, ease: "power1.inOut" }, 0.35);

      // 03 — TRUCK ARRIVAL: smooth acceleration, then deceleration into the bay.
      tl.fromTo(
        truck,
        { x: startX },
        { x: dockX, duration: 1.75, ease: "power2.inOut" },
        0.5,
      );
      // subtle suspension settle as it stops
      tl.to(
        truckBodyRef.current,
        { y: 2.5, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 },
        2.12,
      );

      // 04 — DOCKING: bay lighting comes up around the mouth.
      tl.to(bay, { "--bay-glow": 1, duration: 0.7, ease: "power2.out" }, 2.16);

      // 05 — COLD ROOM OPENS: the door lifts, light floods, mist pours out.
      tl.to(bay, {
        "--bay-open": 1,
        "--bay-spill": 1,
        duration: 1.05,
        ease: "power3.inOut",
      }, 2.3);

      // 06 — CARGO: the four categories travel toward the chamber.
      tl.to(
        cargoRef.current?.children ?? [],
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.75,
          stagger: 0.11,
          ease: "power3.out",
        },
        3.2,
      );

      // 07 — SYSTEMS ACTIVE: HUD panels come online.
      tl.to(
        hudRef.current?.children ?? [],
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" },
        3.55,
      );

      // 08 — BRAND REVEAL: architecture-first type, line by line.
      tl.to(
        ".hero-line > span",
        { yPercent: 0, duration: 1.05, stagger: 0.09, ease: "power4.out" },
        3.95,
      );
      tl.to(
        copyRef.current?.querySelectorAll(".hero-anim") ?? [],
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" },
        4.25,
      );
      tl.to(
        ctaRef.current?.children ?? [],
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.09, ease: "power3.out" },
        4.5,
      );

      tlRef.current = tl;
    }, root);

    return () => {
      ctx.revert();
      tlRef.current = null;
    };
    // `temperature` intentionally excluded — the controller writes CSS vars itself.
  }, [reduced]);

  /* --------------------------- skip on any intent -------------------------- */
  useEffect(() => {
    if (done || reduced) return;
    const events: (keyof WindowEventMap)[] = ["wheel", "touchstart", "keydown", "pointerdown"];
    const handler = (e: Event) => {
      // Let the temperature control and CTAs work without skipping mid-gesture.
      if (e instanceof PointerEvent || e.type === "touchstart") {
        const target = e.target as HTMLElement | null;
        if (target?.closest("[data-hero-interactive='true']")) return;
      }
      skip();
    };
    events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, handler));
  }, [done, reduced, skip]);

  /* --------------------- gentle scroll parallax after intro ---------------- */
  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(bayRef.current, { y: p * -60, opacity: 1 - p * 0.55 });
          gsap.set(truckRef.current, { y: p * -34 });
          gsap.set(copyRef.current, { y: p * 90, opacity: 1 - p * 1.25 });
          gsap.set(hudRef.current, { opacity: 1 - p * 1.6 });
        },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced, ready]);

  const accent = frost > 0.72 ? "#7DD3FC" : frost > 0.42 ? "#8ec9ea" : "#a7b4c5";

  return (
    <section
      ref={rootRef}
      id="hero"
      className="relative isolate flex min-h-[100svh] w-full flex-col overflow-hidden bg-midnight"
      aria-label="Tahseen Jaber Cold Storage & Logistics — arrival"
    >
      {/* ---------------- photographic bed: sliding imagery ---------------- */}
      <HeroSlider className="z-0" />

      {/* ---------------- the facility ---------------- */}
      <div
        ref={bayRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[58vh] min-h-[340px] w-full sm:h-[62vh] lg:h-[68vh]"
        style={{ "--bay-accent": accent } as React.CSSProperties}
      >
        <LoadingBay open={0} glow={0.35} accent={accent} className="h-full w-full" />
      </div>

      {/* ---------------- the truck ---------------- */}
      <div
        ref={truckRef}
        className="pointer-events-none absolute bottom-[13.5vh] left-[34%] z-20 w-[74%] max-w-[940px] will-change-transform sm:bottom-[15vh] lg:bottom-[17vh] lg:left-[30%] lg:w-[62%]"
        style={{ opacity: 0 }}
      >
        <div ref={truckBodyRef} className="will-change-transform" style={{ marginBottom: "-8.5%" }}>
          <AnimatedTruck moving={!done && !reduced} lights reeferOn livery={done ? 1 : 0.4} />
        </div>
      </div>

      {/* ---------------- cargo flow ---------------- */}
      <div
        ref={cargoRef}
        className="pointer-events-none absolute bottom-[26vh] left-1/2 z-20 flex -translate-x-1/2 gap-2.5 sm:bottom-[30vh] lg:bottom-[34vh]"
      >
        {CARGO.map(({ key, Icon, tone }) => (
          <div
            key={key}
            className="panel-hud flex items-center gap-2 rounded-md px-2.5 py-1.5 backdrop-blur-md"
            style={{ borderColor: `${tone}55` }}
          >
            <Icon className="h-3 w-3" style={{ color: tone }} aria-hidden />
            <span className="font-mono text-[8px] tracking-[0.2em] whitespace-nowrap text-frost/90 uppercase sm:text-[9px]">
              {key}
            </span>
          </div>
        ))}
      </div>

      {/* ---------------- floor mist ---------------- */}
      <div
        ref={mistRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[22] h-[34vh] opacity-0"
        aria-hidden
      >
        <div
          className={cn("absolute inset-x-[-15%] bottom-[-25%] h-full blur-[46px]", !reduced && "animate-mist")}
          style={{
            background:
              "radial-gradient(52% 100% at 32% 100%, rgba(244,250,255,0.24), transparent 72%), radial-gradient(48% 100% at 70% 100%, rgba(125,211,252,0.22), transparent 74%)",
          }}
        />
      </div>

      {/* ---------------- darkness veil (Scene 01) ---------------- */}
      <div
        ref={veilRef}
        className="pointer-events-none absolute inset-0 z-[35] bg-[radial-gradient(120%_90%_at_50%_40%,#081426_0%,#03060e_72%)] opacity-0"
        aria-hidden
      />

      {/* ---------------- scene rail ---------------- */}
      <div
        ref={railRef}
        className="pointer-events-none absolute top-1/2 left-4 z-30 hidden -translate-y-1/2 flex-col gap-3 opacity-0 xl:flex"
        aria-hidden
      >
        {SCENES.map((s) => (
          <div key={s.code} className="flex items-center gap-2.5">
            <span
              className={cn(
                "h-px transition-all duration-500",
                s.code === scene.code ? "w-7 bg-cyan-core" : "w-3.5 bg-ice/25",
              )}
            />
            <span
              className={cn(
                "font-mono text-[8px] tracking-[0.24em] uppercase transition-colors duration-500",
                s.code === scene.code ? "text-frost" : "text-silver/35",
              )}
            >
              {s.code} {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ---------------- HUD ---------------- */}
      <div
        ref={hudRef}
        className="pointer-events-none absolute top-[16vh] right-4 z-30 hidden w-[16.5rem] flex-col gap-3 lg:flex xl:right-10"
      >
        <div className="pointer-events-auto">
          <TemperatureHUD zone="ZONE A" />
        </div>
        <div className="pointer-events-auto hidden xl:block">
          <TemperatureController />
        </div>
      </div>

      {/* ---------------- copy ---------------- */}
      <div className="relative z-40 flex flex-1 items-center">
        <div className="mx-auto w-full max-w-[1400px] px-5 pt-[18vh] pb-[26vh] sm:px-8 lg:px-12 lg:pt-[16vh]">
          <div ref={copyRef} className="max-w-4xl">
            <div className="hero-anim flex items-center gap-3 opacity-0">
              <Snowflake className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.36em] text-ice/85 uppercase sm:text-[11px]">
                Uuayrij Industrial Area · Baghdad
              </span>
            </div>

            <h1 className="mt-6 font-display font-bold tracking-[-0.05em] text-frost">
              <span className="hero-line mask-line block text-[clamp(2.6rem,8.4vw,6.4rem)] leading-[0.9]">
                <span className="block">Tahseen Jaber</span>
              </span>
              <span className="hero-line mask-line mt-1 block text-[clamp(2rem,6.4vw,4.9rem)] leading-[0.92] text-gradient-frost sm:mt-2">
                <span className="block">Cold Storage</span>
              </span>
              <span className="hero-line mask-line mt-1 block text-[clamp(2rem,6.4vw,4.9rem)] leading-[0.92] sm:mt-2">
                <span className="block">
                  <span className="text-transparent [-webkit-text-stroke:1.4px_rgba(125,211,252,0.62)]">
                    &amp; Logistics
                  </span>
                </span>
              </span>
            </h1>

            <p className="hero-anim mt-7 max-w-xl text-[0.98rem] leading-relaxed text-silver opacity-0 sm:text-[1.08rem]">
              Precision temperature-controlled storage and cold-chain logistics —
              engineered around your product, monitored around the clock.
            </p>

            <div className="hero-anim mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 opacity-0">
              {["Zoned separation", "Batch traceability", "Controlled access", "Continuous monitoring"].map(
                (item) => (
                  <span
                    key={item}
                    className="flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-ice/70 uppercase sm:text-[10px]"
                  >
                    <span className="h-1 w-1 rotate-45 bg-cyan-core" aria-hidden />
                    {item}
                  </span>
                ),
              )}
            </div>

            {/* ---------------- CTAs ---------------- */}
            <div ref={ctaRef} className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="opacity-0" data-hero-interactive="true">
                <Link
                  href="/request-storage"
                  data-cta="true"
                  className={cn(
                    "cta-primary sweep-host group/cta relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-lg px-8",
                    "bg-[linear-gradient(135deg,#b8ecff_0%,#7DD3FC_26%,#22D3EE_60%,#0891b2_100%)] font-mono text-[11px] font-bold tracking-[0.22em] text-midnight uppercase",
                    "shadow-[0_0_0_1px_rgba(125,211,252,0.55),0_20px_52px_-20px_rgba(34,211,238,0.95)]",
                    "transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_0_1px_rgba(244,250,255,0.8),0_28px_70px_-18px_rgba(34,211,238,1)]",
                  )}
                >
                  Request Storage
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/cta:translate-x-1.5"
                    aria-hidden
                  />
                </Link>
              </span>

              <span className="opacity-0" data-hero-interactive="true">
                <a
                  href="#cold-chain"
                  data-cursor="explore"
                  data-cursor-label="EXPLORE"
                  className={cn(
                    "group/exp inline-flex h-14 items-center gap-3 rounded-lg border border-ice/25 bg-industrial/35 px-7 backdrop-blur-md",
                    "font-mono text-[11px] tracking-[0.22em] text-frost uppercase",
                    "transition-all duration-300 hover:border-cyan-core/70 hover:bg-industrial/70",
                  )}
                >
                  Explore Facility
                  <span className="relative flex h-4 w-4 items-center justify-center">
                    <span className="absolute h-4 w-4 rounded-full border border-cyan-core/50 transition-transform duration-500 group-hover/exp:scale-150 group-hover/exp:opacity-0" />
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-core transition-transform duration-500 group-hover/exp:scale-125" />
                  </span>
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- mobile temperature control ---------------- */}
      <div
        className="absolute inset-x-4 bottom-[15vh] z-40 lg:hidden"
        data-hero-interactive="true"
      >
        <TemperatureController compact />
      </div>

      {/* ---------------- scroll cue ---------------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center sm:bottom-6">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[8px] tracking-[0.34em] text-silver/50 uppercase">Scroll</span>
          <span className="relative h-9 w-px overflow-hidden bg-ice/15">
            {!reduced && (
              <span className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-cyan-core to-transparent [animation:scanline_2.6s_cubic-bezier(0.65,0,0.35,1)_infinite]" />
            )}
          </span>
        </div>
      </div>

      {/* live temperature chip */}
      <div className="pointer-events-none absolute top-[16vh] left-4 z-30 hidden lg:block xl:left-10">
        <div className="panel-hud flex items-center gap-3 px-3.5 py-2.5">
          <Snowflake className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
          <div className="leading-none">
            <div className="font-mono text-[8px] tracking-[0.26em] text-silver/65 uppercase">Chamber</div>
            <div className="mt-1 font-display text-lg font-bold tabular text-frost">
              {temperature > 0 ? `+${temperature.toFixed(1)}` : temperature.toFixed(1)}°C
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
