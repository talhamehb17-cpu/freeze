"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Inbox,
  Mail,
  Phone,
  Save,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

import { updateInquiryStatusAction, type AdminActionResult } from "@/app/actions/admin";
import { EASE } from "@/animations/presets";
import { MagneticButton } from "@/components/ui/Button";
import { DemoBadge, HudPanel, StatusPill } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import { INQUIRY_STATUSES } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import type { InquiryStatus, InquiryView } from "@/types";

/**
 * INQUIRY QUEUE (spec §35) — the operations desk's working surface.
 *
 * Status changes go through a server action that re-checks the role, validates
 * with Zod, writes an audit row and revalidates the route. The row never
 * mutates local state on its own, so what is on screen is always what the server
 * accepted.
 */

const FILTERS: (InquiryStatus | "ALL")[] = ["ALL", ...INQUIRY_STATUSES];

export function InquiryQueue({
  inquiries,
  simulated,
}: {
  inquiries: InquiryView[];
  simulated: boolean;
}) {
  const reduced = useReducedMotion();
  const [filter, setFilter] = useState<InquiryStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<{ id: string; ok: boolean; message: string } | null>(null);

  const [state, formAction, pending] = useActionState<AdminActionResult<InquiryView> | null, FormData>(
    updateInquiryStatusAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok && state.data) {
      setFlash({ id: state.data.id, ok: true, message: `${state.data.reference} → ${state.data.status}` });
      setOpenId(null);
    } else if (!state.ok) {
      setFlash({ id: openId ?? "", ok: false, message: state.error });
    }
    const t = window.setTimeout(() => setFlash(null), 4200);
    return () => window.clearTimeout(t);
  }, [state, openId]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: inquiries.length };
    for (const i of inquiries) map[i.status] = (map[i.status] ?? 0) + 1;
    return map;
  }, [inquiries]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inquiries.filter((i) => {
      if (filter !== "ALL" && i.status !== filter) return false;
      if (!q) return true;
      return [i.reference, i.name, i.company, i.email, i.product, i.message]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [inquiries, filter, query]);

  return (
    <div className="space-y-5">
      {/* toast */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -14 }}
            transition={{ duration: 0.4, ease: EASE.frost as never }}
            role="status"
            aria-live="polite"
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3",
              flash.ok ? "border-cool/45 bg-cool/10" : "border-danger/45 bg-danger/10",
            )}
          >
            {flash.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-cool" aria-hidden />
            ) : (
              <TriangleAlert className="h-4 w-4 shrink-0 text-danger" aria-hidden />
            )}
            <span
              className={cn(
                "font-mono text-[9px] tracking-[0.16em] uppercase",
                flash.ok ? "text-cool" : "text-danger",
              )}
            >
              {flash.ok ? "Updated · " : "Rejected · "}
              {flash.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <HudPanel
        title="Inquiry queue"
        code="REQ"
        badge={simulated ? <DemoBadge size="xs" label="Demo dataset" /> : undefined}
        className="overflow-hidden"
      >
        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-ice/10 px-4 py-3">
          <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-ice/12 bg-navy/70 p-px">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "px-2.5 py-1.5 font-mono text-[8px] tracking-[0.16em] uppercase transition-colors duration-300",
                  filter === f ? "bg-cyan-core/15 text-cyan-core" : "text-silver/45 hover:bg-industrial/60 hover:text-frost",
                )}
              >
                {f}
                <span className="ml-1.5 text-silver/35 tabular">{counts[f] ?? 0}</span>
              </button>
            ))}
          </div>

          <label className="ml-auto flex min-w-[11rem] flex-1 items-center gap-2 rounded-lg border border-ice/12 bg-navy/60 px-3 py-1.5 transition-colors focus-within:border-cyan-core/55 sm:flex-none">
            <Search className="h-3 w-3 shrink-0 text-silver/40" aria-hidden />
            <span className="sr-only">Search inquiries</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Reference, name, company…"
              className="w-full bg-transparent font-mono text-[9px] tracking-[0.1em] text-frost uppercase placeholder:text-silver/35 focus:outline-none"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Inbox className="h-6 w-6 text-silver/30" aria-hidden />
            <p className="max-w-sm font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
              {inquiries.length === 0
                ? "No storage requests have been submitted yet. Anything sent from the public form lands here."
                : "No requests match that filter."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ice/8">
            {rows.map((q, i) => {
              const open = openId === q.id;
              return (
                <motion.li
                  key={q.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: reduced ? 0 : Math.min(i * 0.025, 0.3) }}
                  className={cn("relative transition-colors duration-300", open ? "bg-industrial/45" : "hover:bg-industrial/25")}
                >
                  {/* row header */}
                  <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : q.id)}
                      aria-expanded={open}
                      aria-controls={`inq-${q.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-core"
                    >
                      <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.35 }}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ice/15 bg-navy text-silver/60"
                      >
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      </motion.span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="font-mono text-[10px] tracking-[0.1em] text-cyan-core">{q.reference}</span>
                          <span className="truncate font-display text-[0.92rem] font-bold tracking-[-0.015em] text-frost">
                            {q.company || q.name}
                          </span>
                          <span className="font-mono text-[8px] tracking-[0.16em] text-silver/45 uppercase">
                            {q.product} · {q.quantity} {q.unit} · {q.durationMonths} mo
                          </span>
                        </span>
                        <span className="mt-1 flex items-center gap-2 font-mono text-[8px] tracking-[0.14em] text-silver/40 uppercase">
                          <Clock3 className="h-2.5 w-2.5" aria-hidden />
                          {new Date(q.createdAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {q.source && <span className="text-cyan-core/60">· via {q.source}</span>}
                        </span>
                      </span>
                    </button>
                    <StatusPill status={q.status} size="xs" pulse={q.status === "NEW"} />
                  </div>

                  {/* detail */}
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        id={`inq-${q.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduced ? 0.15 : 0.45, ease: EASE.frost as never }}
                        className="overflow-hidden"
                      >
                        <form action={formAction} className="grid gap-5 border-t border-ice/10 px-4 py-5 sm:px-5 lg:grid-cols-[1fr_1.1fr]">
                          <input type="hidden" name="id" value={q.id} />

                          <div className="space-y-3">
                            <h3 className="font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">
                              Request detail
                            </h3>
                            <dl className="space-y-2">
                              <DetailRow icon={<Mail className="h-3 w-3" aria-hidden />} label="Contact" value={q.name} />
                              <DetailRow label="Email" value={<a href={`mailto:${q.email}`} className="text-cyan-core hover:text-frost">{q.email}</a>} />
                              <DetailRow icon={<Phone className="h-3 w-3" aria-hidden />} label="Phone" value={q.phone} />
                              {q.company && <DetailRow label="Company" value={q.company} />}
                              <DetailRow label="Category" value={q.product} />
                              <DetailRow label="Volume" value={`${q.quantity} ${q.unit}`} />
                              <DetailRow label="Duration" value={`${q.durationMonths} month(s)`} />
                              <DetailRow label="Updated" value={new Date(q.updatedAt).toLocaleString("en-GB")} />
                            </dl>
                            {q.message && (
                              <div className="rounded-lg border border-ice/12 bg-navy/50 px-3.5 py-3">
                                <div className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Message</div>
                                <p className="mt-1.5 text-[0.82rem] leading-relaxed text-frost/85">{q.message}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div>
                              <span className="font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">
                                Set status
                              </span>
                              <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                {INQUIRY_STATUSES.map((s) => (
                                  <label
                                    key={s}
                                    className={cn(
                                      "relative flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 transition-colors duration-300",
                                      "has-[:checked]:border-cyan-core/60 has-[:checked]:bg-cyan-core/12",
                                      q.status === s && !open
                                        ? "border-ice/25"
                                        : "border-ice/12 bg-navy/50 hover:border-ice/30",
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      name="status"
                                      value={s}
                                      defaultChecked={q.status === s}
                                      className="sr-only"
                                    />
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "h-2 w-2 rounded-full transition-colors",
                                        q.status === s ? "bg-cyan-core" : "bg-silver/25",
                                      )}
                                    />
                                    <span className="font-mono text-[8px] tracking-[0.14em] text-silver/75 uppercase">
                                      {s}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label
                                htmlFor={`notes-${q.id}`}
                                className="font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase"
                              >
                                Internal note
                              </label>
                              <textarea
                                id={`notes-${q.id}`}
                                name="notes"
                                rows={3}
                                maxLength={2000}
                                defaultValue={q.notes ?? notes[q.id] ?? ""}
                                onChange={(e) => setNotes((n) => ({ ...n, [q.id]: e.target.value }))}
                                placeholder="Outcome, quote reference, follow-up date…"
                                className={cn(
                                  "mt-2 w-full resize-y rounded-lg border border-ice/12 bg-navy/60 px-3.5 py-3",
                                  "text-[0.82rem] leading-relaxed text-frost placeholder:text-silver/30",
                                  "transition-colors duration-300 focus:border-cyan-core/55 focus:outline-none",
                                )}
                              />
                            </div>

                            <div className="flex items-center gap-3">
                              <MagneticButton
                                type="submit"
                                variant="primary"
                                size="md"
                                loading={pending}
                                loadingText="Saving"
                                magnetic={false}
                                icon={<Save className="h-3.5 w-3.5" aria-hidden />}
                              >
                                {pending ? "Saving…" : "Save status"}
                              </MagneticButton>
                              <button
                                type="button"
                                onClick={() => setOpenId(null)}
                                className="font-mono text-[9px] tracking-[0.18em] text-silver/50 uppercase transition-colors hover:text-frost"
                              >
                                Close
                              </button>
                            </div>

                            <p className="font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/35 uppercase">
                              Saving writes an audit row against your operator account.
                            </p>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-ice/10 px-5 py-2.5 font-mono text-[8px] tracking-[0.16em] text-silver/40 uppercase">
          <span>
            Showing {rows.length} of {inquiries.length}
          </span>
          <span className="hidden sm:inline">Newest first</span>
        </div>
      </HudPanel>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ice/8 pb-2">
      <dt className="flex shrink-0 items-center gap-1.5 font-mono text-[8px] tracking-[0.18em] text-silver/45 uppercase">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 break-words text-right font-mono text-[9px] tracking-[0.08em] text-frost/90">
        {value}
      </dd>
    </div>
  );
}
