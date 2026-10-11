"use client";

import { motion } from "framer-motion";
import { Fingerprint, KeyRound, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { EASE } from "@/animations/presets";
import { LogoMark } from "@/components/brand/Logo";
import { DemoBadge } from "@/components/ui/Hud";
import { MaskLines } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { BRAND, LOCATION } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The shared shell for /login and /signup.
 *
 * Left: a cold, lit facility photograph with a slow scan pass and the access
 * assurances. Right: the form. Both animate in as a single sequence — mask
 * reveal on the image, staggered headline, frost sweep across the panel edge —
 * so entering credentials feels like opening a controlled door, not filling a
 * web form.
 */

const ASSURANCES = [
  {
    icon: ShieldCheck,
    title: "Session cookies",
    body: "HttpOnly, SameSite=Lax, signed. Your session is never readable by page script.",
  },
  {
    icon: KeyRound,
    title: "Hashed passwords",
    body: "bcrypt at cost 10. Plain text is never stored, logged or returned.",
  },
  {
    icon: Fingerprint,
    title: "Server-side roles",
    body: "Authorisation is checked on the server for every request — never by the UI.",
  },
];

export function AuthStage({
  children,
  eyebrow,
  lines,
  lead,
  image,
  imageCode,
  footer,
}: {
  children: ReactNode;
  eyebrow: string;
  lines: string[];
  lead: string;
  image: string;
  imageCode: string;
  footer: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-midnight">
      {/* base atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 12% 0%, rgba(34,211,238,0.13), transparent 58%), radial-gradient(90% 70% at 100% 100%, rgba(125,211,252,0.09), transparent 62%)",
        }}
        aria-hidden
      />
      <div className="hud-grid-fine pointer-events-none absolute inset-0 opacity-[0.18]" aria-hidden />
      <span className="noise-layer pointer-events-none absolute inset-0 opacity-[0.045]" aria-hidden />

      <div className="relative mx-auto grid min-h-[100svh] w-full max-w-[1500px] lg:grid-cols-[1.02fr_1fr]">
        {/* ======================= left: imagery + assurance ======================= */}
        <motion.aside
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0.3 : 1.1, ease: EASE.frost as never }}
          className="relative isolate hidden overflow-hidden border-r border-ice/10 lg:block"
          aria-hidden
        >
          <motion.div
            initial={{ scale: reduced ? 1 : 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: reduced ? 0.4 : 2.2, ease: EASE.frost as never }}
            className="absolute inset-0"
          >
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="52vw"
              quality={82}
              className="object-cover"
              style={{ filter: "saturate(0.7) contrast(1.12) brightness(0.5)" }}
            />
          </motion.div>

          {/* cold grade + vignette */}
          <div
            className="absolute inset-0 mix-blend-soft-light"
            style={{ background: "linear-gradient(160deg, rgba(125,211,252,0.28), transparent 46%, rgba(34,211,238,0.22))" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(105deg, rgba(5,9,20,0.94) 8%, rgba(5,9,20,0.42) 52%, rgba(5,9,20,0.9))" }}
          />
          <span className="scanlines pointer-events-none absolute inset-0 opacity-70" />

          {/* slow scan pass */}
          {!reduced && (
            <motion.span
              className="pointer-events-none absolute inset-x-0 h-24"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(125,211,252,0.1), rgba(34,211,238,0.16), transparent)",
              }}
              initial={{ y: "-20%" }}
              animate={{ y: "120%" }}
              transition={{ duration: 9, repeat: Infinity, ease: "linear", repeatDelay: 2.4 }}
            />
          )}

          <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
            <Link href="/" className="inline-flex w-fit items-center gap-4" aria-label={`${BRAND.name} — home`}>
              <LogoMark size={44} animated />
              <span className="leading-none">
                <span className="block font-display text-lg font-bold tracking-[0.12em] text-frost uppercase">
                  {BRAND.name}
                </span>
                <span className="mt-1.5 block font-mono text-[9px] tracking-[0.3em] text-ice/75 uppercase">
                  {BRAND.suffix}
                </span>
              </span>
            </Link>

            <div className="max-w-md">
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-cyan-core" />
                <span className="font-mono text-[10px] tracking-[0.32em] text-cyan-core uppercase">
                  {eyebrow}
                </span>
              </div>

              <div className="mt-6">
                <MaskLines
                  lines={lines}
                  as="h1"
                  className="font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-[0.98] font-bold tracking-[-0.04em] text-frost"
                  delay={0.35}
                />
              </div>

              <motion.p
                initial={{ opacity: 0, y: reduced ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: reduced ? 0 : 0.75, ease: EASE.frost as never }}
                className="mt-5 text-[0.95rem] leading-relaxed text-silver/80"
              >
                {lead}
              </motion.p>

              <motion.ul
                initial="hide"
                animate="show"
                variants={{ hide: {}, show: { transition: { staggerChildren: 0.1, delayChildren: reduced ? 0.1 : 0.95 } } }}
                className="mt-9 space-y-px overflow-hidden rounded-xl border border-ice/12 bg-ice/8 backdrop-blur-[2px]"
              >
                {ASSURANCES.map((a) => (
                  <motion.li
                    key={a.title}
                    variants={{
                      hide: { opacity: 0, x: reduced ? 0 : -18 },
                      show: { opacity: 1, x: 0, transition: { duration: 0.65, ease: EASE.frost as never } },
                    }}
                    className="group/as flex gap-4 bg-navy/55 px-5 py-4 transition-colors duration-500 hover:bg-industrial/50"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cyan-core/28 bg-cyan-core/8 text-cyan-core transition-shadow duration-500 group-hover/as:shadow-[0_0_20px_-6px_rgba(34,211,238,0.95)]">
                      <a.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-display text-[0.9rem] font-bold tracking-[-0.01em] text-frost">
                        {a.title}
                      </span>
                      <span className="mt-1 block text-[0.8rem] leading-relaxed text-silver/70">{a.body}</span>
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: reduced ? 0.1 : 1.3 }}
              className="flex items-center justify-between gap-4 font-mono text-[9px] tracking-[0.2em] text-silver/45 uppercase"
            >
              <span>
                {LOCATION.area} · {LOCATION.city}
              </span>
              <span className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cool opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cool" />
                </span>
                {imageCode}
              </span>
            </motion.div>
          </div>
        </motion.aside>

        {/* ========================== right: the form ========================== */}
        <section className="relative flex items-center justify-center px-5 py-14 sm:px-10 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 34, scale: reduced ? 1 : 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: reduced ? 0.35 : 1, delay: reduced ? 0 : 0.15, ease: EASE.frost as never }}
            className="relative w-full max-w-[27rem]"
          >
            {/* frost sweep across the top edge */}
            {!reduced && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-px h-px overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <motion.span
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-ice to-transparent"
                  initial={{ x: "-120%" }}
                  animate={{ x: "320%" }}
                  transition={{ duration: 1.9, delay: 1, ease: EASE.frost as never }}
                />
              </motion.span>
            )}

            <div className="panel-hud scanlines relative overflow-hidden rounded-2xl p-7 sm:p-9">
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(34,211,238,0.14), transparent 68%)" }}
                aria-hidden
              />

              {/* mobile brand — the left panel is hidden below lg */}
              <Link href="/" className="relative mb-8 inline-flex items-center gap-3 lg:hidden">
                <LogoMark size={36} animated />
                <span className="leading-none">
                  <span className="block font-display text-sm font-bold tracking-[0.12em] text-frost uppercase">
                    {BRAND.name}
                  </span>
                  <span className="mt-1 block font-mono text-[8px] tracking-[0.26em] text-ice/75 uppercase">
                    {BRAND.suffix}
                  </span>
                </span>
              </Link>

              <div className="relative mb-7 flex items-center justify-between gap-3 lg:mb-0">
                <DemoBadge size="xs" label="Demo build" withNote={false} />
                <span className="font-mono text-[8px] tracking-[0.22em] text-silver/40 uppercase">
                  TLS · CSRF · Rate limited
                </span>
              </div>

              <div className="relative mt-6">{children}</div>
            </div>

            <div className="mt-6 text-center">{footer}</div>
          </motion.div>
        </section>
      </div>

      {/* corner ticks */}
      <CornerTicks />
    </div>
  );
}

function CornerTicks() {
  return (
    <div className="pointer-events-none absolute inset-4 hidden lg:block" aria-hidden>
      {[
        "left-0 top-0 border-l border-t",
        "right-0 top-0 border-r border-t",
        "left-0 bottom-0 border-l border-b",
        "right-0 bottom-0 border-r border-b",
      ].map((pos) => (
        <span key={pos} className={cn("absolute h-4 w-4 border-cyan-core/40", pos)} />
      ))}
    </div>
  );
}
