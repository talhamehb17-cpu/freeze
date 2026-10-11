import type { ReactNode } from "react";

import { DemoBadge } from "@/components/ui/Hud";

/**
 * Shared heading block for every command-centre screen, so the section index,
 * title and data-source badge read the same way across the surface.
 */
export function AdminPageHeader({
  index,
  eyebrow,
  title,
  lead,
  aside,
  simulated,
}: {
  index: string;
  eyebrow: string;
  title: string;
  lead: string;
  aside?: ReactNode;
  simulated?: boolean;
}) {
  return (
    <header className="panel relative mb-5 overflow-hidden rounded-2xl">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 140% at 0% 0%, rgba(34,211,238,0.13), transparent 58%)" }}
        aria-hidden
      />
      <div className="relative flex flex-wrap items-end justify-between gap-6 px-6 py-6 sm:px-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[9px] tracking-[0.28em] text-cyan-core/80 tabular">{index}</span>
            <span className="h-px w-6 bg-cyan-core/60" aria-hidden />
            <span className="font-mono text-[9px] tracking-[0.28em] text-silver/60 uppercase">{eyebrow}</span>
            {simulated && <DemoBadge size="xs" label="Demo dataset" />}
          </div>
          <h1 className="mt-4 font-display text-[clamp(1.7rem,3.8vw,2.5rem)] leading-[1] font-bold tracking-[-0.04em] text-frost">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9rem] leading-relaxed text-silver/75">{lead}</p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}
