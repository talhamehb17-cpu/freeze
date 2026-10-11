"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Boxes, CheckCircle2, Plus, Search, TriangleAlert } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  createInventoryAction,
  updateInventoryStatusAction,
  type AdminActionResult,
} from "@/app/actions/admin";
import { EASE } from "@/animations/presets";
import { MagneticButton } from "@/components/ui/Button";
import { SegmentedField, StepperField, TextField } from "@/components/forms/Field";
import { DemoBadge, DemoNotice, HudPanel, StatusPill } from "@/components/ui/Hud";
import { useReducedMotion } from "@/hooks/use-motion";
import { PRODUCT_CATEGORIES, UNITS } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";
import type { InventoryStatus, InventoryView, ProductCategory, UnitOfMeasure, ZoneView } from "@/types";

/**
 * INVENTORY CONSOLE (spec §35) — batch register with put-away.
 *
 * Two server actions, both re-authorised server-side: create a batch, and move
 * a batch through RECEIVED → IN_STORAGE → RESERVED → IN_TRANSIT → DISPATCHED
 * (or QUARANTINE). Zone occupancy is updated by the repository, not here.
 */

const STATUSES: InventoryStatus[] = [
  "RECEIVED",
  "IN_STORAGE",
  "RESERVED",
  "IN_TRANSIT",
  "DISPATCHED",
  "QUARANTINE",
];

export function InventoryConsole({
  inventory,
  zones,
  clients,
  simulated,
}: {
  inventory: InventoryView[];
  zones: ZoneView[];
  clients: { id: string; name: string; code: string }[];
  simulated: boolean;
}) {
  const reduced = useReducedMotion();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InventoryStatus | "ALL">("ALL");
  const [composerOpen, setComposerOpen] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null);

  const [createState, createAction, createPending] = useActionState<
    AdminActionResult<InventoryView> | null,
    FormData
  >(createInventoryAction, null);

  const [statusState, statusAction, statusPending] = useActionState<
    AdminActionResult<InventoryView> | null,
    FormData
  >(updateInventoryStatusAction, null);

  useEffect(() => {
    if (createState) {
      if (createState.ok) {
        setFlash({ ok: true, message: `Batch ${createState.data?.batch} received into ${createState.data?.zone}` });
        setComposerOpen(false);
      } else {
        setFlash({ ok: false, message: createState.error });
      }
    }
  }, [createState]);

  useEffect(() => {
    if (statusState) {
      setFlash(
        statusState.ok
          ? { ok: true, message: `${statusState.data?.batch} → ${statusState.data?.status}` }
          : { ok: false, message: statusState.error },
      );
    }
  }, [statusState]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 4200);
    return () => window.clearTimeout(t);
  }, [flash]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inventory.filter((i) => {
      if (filter !== "ALL" && i.status !== filter) return false;
      if (!q) return true;
      return [i.batch, i.productName, i.product, i.zone, i.location]
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [inventory, filter, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: inventory.length };
    for (const i of inventory) map[i.status] = (map[i.status] ?? 0) + 1;
    return map;
  }, [inventory]);

  return (
    <div className="space-y-5">
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
            <span className={cn("font-mono text-[9px] tracking-[0.16em] uppercase", flash.ok ? "text-cool" : "text-danger")}>
              {flash.ok ? "Saved · " : "Rejected · "}
              {flash.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------ register ------------------------------ */}
      <HudPanel
        title="Batch register"
        code="INV"
        badge={
          <div className="flex items-center gap-2">
            {simulated && <DemoBadge size="xs" label="Demo dataset" />}
            <MagneticButton
              type="button"
              variant={composerOpen ? "ghost" : "secondary"}
              size="sm"
              magnetic={false}
              onClick={() => setComposerOpen((v) => !v)}
              aria-expanded={composerOpen}
              icon={<Plus className="h-3 w-3" aria-hidden />}
            >
              {composerOpen ? "Close" : "Receive batch"}
            </MagneticButton>
          </div>
        }
        className="overflow-hidden"
      >
        {/* put-away composer */}
        <AnimatePresence initial={false}>
          {composerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0.15 : 0.5, ease: EASE.frost as never }}
              className="overflow-hidden"
            >
              <CreateBatchForm
                zones={zones}
                clients={clients}
                action={createAction}
                pending={createPending}
                error={createState && !createState.ok ? createState.fields : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 border-b border-ice/10 px-4 py-3">
          <div className="flex flex-wrap gap-px overflow-hidden rounded-lg border border-ice/12 bg-navy/70 p-px">
            {(["ALL", ...STATUSES] as (InventoryStatus | "ALL")[]).map((f) => (
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
                {f.replace(/_/g, " ")}
                <span className="ml-1.5 text-silver/35 tabular">{counts[f] ?? 0}</span>
              </button>
            ))}
          </div>

          <label className="ml-auto flex min-w-[11rem] flex-1 items-center gap-2 rounded-lg border border-ice/12 bg-navy/60 px-3 py-1.5 transition-colors focus-within:border-cyan-core/55 sm:flex-none">
            <Search className="h-3 w-3 shrink-0 text-silver/40" aria-hidden />
            <span className="sr-only">Search inventory</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Batch, product, location…"
              className="w-full bg-transparent font-mono text-[9px] tracking-[0.1em] text-frost uppercase placeholder:text-silver/35 focus:outline-none"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Boxes className="h-6 w-6 text-silver/30" aria-hidden />
            <p className="max-w-sm font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
              {inventory.length === 0
                ? "The register is empty. Receive a batch to open the first record."
                : "No batches match that filter."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ice/8">
            {rows.map((row, i) => (
              <motion.li
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: reduced ? 0 : Math.min(i * 0.025, 0.3) }}
                className="group/batch px-4 py-4 transition-colors duration-300 hover:bg-industrial/30 sm:px-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-[10px] tracking-[0.1em] text-cyan-core">{row.batch}</span>
                      <span className="font-display text-[0.95rem] font-bold tracking-[-0.015em] text-frost">
                        {row.productName}
                      </span>
                      <StatusPill status={row.status} size="xs" pulse={false} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8px] tracking-[0.14em] text-silver/45 uppercase">
                      <span>{row.zone}</span>
                      <span className="text-silver/25">/</span>
                      <span>{row.location}</span>
                      <span className="text-silver/25">/</span>
                      <span className="tabular">
                        {row.quantity} {row.unit}
                      </span>
                      <span className="text-silver/25">/</span>
                      <span className="text-cyan-core/85">{row.temperature}</span>
                      <span className="text-silver/25">/</span>
                      <span className={row.tracking === "ACTIVE" ? "text-cool" : "text-silver/40"}>
                        {row.tracking}
                      </span>
                    </div>
                  </div>

                  {/* status transition */}
                  <form action={statusAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={row.id} />
                    <label className="sr-only" htmlFor={`status-${row.id}`}>
                      Set status for batch {row.batch}
                    </label>
                    <select
                      id={`status-${row.id}`}
                      name="status"
                      defaultValue={row.status}
                      className={cn(
                        "rounded-md border border-ice/15 bg-navy/70 px-2.5 py-1.5",
                        "font-mono text-[8px] tracking-[0.14em] text-frost uppercase",
                        "transition-colors duration-300 focus:border-cyan-core/60 focus:outline-none",
                      )}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <MagneticButton
                      type="submit"
                      variant="ghost"
                      size="sm"
                      magnetic={false}
                      loading={statusPending}
                      loadingText="Saving"
                    >
                      Move
                    </MagneticButton>
                  </form>
                </div>
              </motion.li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-ice/10 px-5 py-2.5 font-mono text-[8px] tracking-[0.16em] text-silver/40 uppercase">
          <span>
            Showing {rows.length} of {inventory.length}
          </span>
          <span className="hidden sm:inline">Sorted by arrival, newest first</span>
        </div>
      </HudPanel>

      <DemoNotice>
        Batch codes, temperatures and quantities here are seeded demonstration records. Zone pallet
        capacity is CONFIGURABLE until the client confirms real figures, so utilisation is derived only
        where a capacity exists.
      </DemoNotice>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CreateBatchForm({
  zones,
  clients,
  action,
  pending,
  error,
}: {
  zones: ZoneView[];
  clients: { id: string; name: string; code: string }[];
  action: (payload: FormData) => void;
  pending: boolean;
  error?: Record<string, string>;
}) {
  const [product, setProduct] = useState<ProductCategory>("SEAFOOD");
  const [unit, setUnit] = useState<UnitOfMeasure>("PALLET");
  const [quantity, setQuantity] = useState(12);

  return (
    <form action={action} className="border-b border-ice/10 bg-navy/40 px-4 py-5 sm:px-5">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-md border border-cyan-core/30 bg-cyan-core/8 text-cyan-core">
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div>
          <h3 className="font-display text-[0.95rem] font-bold tracking-[-0.015em] text-frost">Receive a batch</h3>
          <p className="mt-0.5 font-mono text-[8px] tracking-[0.16em] text-silver/45 uppercase">
            A batch code is generated on save
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextField
          label="Product name"
          name="productName"
          required
          maxLength={160}
          placeholder="e.g. Basra shrimp, 10kg blocks"
          error={error?.productName}
          disabled={pending}
        />

        <div>
          <span className="mb-2 block font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">
            Destination zone
          </span>
          <label className="sr-only" htmlFor="new-batch-zone">
            Destination zone
          </label>
          <select
            id="new-batch-zone"
            name="zoneId"
            required
            defaultValue={zones[0]?.id}
            className={cn(
              "h-11 w-full rounded-lg border border-ice/12 bg-navy/70 px-3.5",
              "font-mono text-[10px] tracking-[0.1em] text-frost uppercase",
              "transition-colors duration-300 focus:border-cyan-core/55 focus:outline-none",
              error?.zoneId && "border-danger/55",
            )}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.code} · {z.name}
              </option>
            ))}
          </select>
          {error?.zoneId && <p className="mt-1.5 font-mono text-[8px] tracking-[0.14em] text-danger uppercase">{error.zoneId}</p>}
        </div>

        <TextField
          label="Rack / location"
          name="location"
          required
          maxLength={32}
          placeholder="e.g. A-04-2"
          error={error?.location}
          disabled={pending}
        />

        <div>
          <span className="mb-2 block font-mono text-[8px] tracking-[0.22em] text-silver/50 uppercase">
            Assign to client
          </span>
          <label className="sr-only" htmlFor="new-batch-client">
            Assign to client
          </label>
          <select
            id="new-batch-client"
            name="clientId"
            defaultValue=""
            className="h-11 w-full rounded-lg border border-ice/12 bg-navy/70 px-3.5 font-mono text-[10px] tracking-[0.1em] text-frost uppercase transition-colors duration-300 focus:border-cyan-core/55 focus:outline-none"
          >
            <option value="">Unassigned</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </div>

        <SegmentedField
          name="new-batch-product"
          label="Category"
          columns={5}
          options={PRODUCT_CATEGORIES.map((p) => ({ value: p as ProductCategory, label: p }))}
          value={product}
          onChange={(v) => setProduct(v as ProductCategory)}
          error={error?.product}
        />
        <input type="hidden" name="product" value={product} />

        <SegmentedField
          name="new-batch-unit"
          label="Unit"
          columns={5}
          options={UNITS.map((u) => ({ value: u as UnitOfMeasure, label: u }))}
          value={unit}
          onChange={(v) => setUnit(v as UnitOfMeasure)}
        />
        <input type="hidden" name="unit" value={unit} />

        <div className="lg:col-span-2">
          <StepperField label="Quantity" value={quantity} onChange={setQuantity} min={1} max={100000} unit={unit.toLowerCase()} />
          <input type="hidden" name="quantity" value={quantity} />
        </div>

        <TextField
          className="lg:col-span-2"
          label="Condition label"
          name="temperatureLabel"
          maxLength={64}
          placeholder="e.g. −18°C FROZEN — or leave blank for the zone profile"
          hint="Optional. Left blank, the zone's configured profile is used."
          disabled={pending}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <MagneticButton type="submit" variant="primary" size="md" magnetic={false} loading={pending} loadingText="Receiving">
          {pending ? "Receiving…" : "Receive batch"}
        </MagneticButton>
        <span className="font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
          Writes an audit row and updates zone occupancy
        </span>
      </div>
    </form>
  );
}
