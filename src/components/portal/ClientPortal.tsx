"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Boxes,
  Download,
  FileText,
  Gauge,
  Inbox,
  LayoutDashboard,
  Plus,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { EASE } from "@/animations/presets";
import { MagneticLink } from "@/components/ui/Button";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { StorageCalculator } from "@/components/forms/StorageCalculator";
import { DemoBadge, DemoNotice, HudPanel, HudRow, StatusPill } from "@/components/ui/Hud";
import { StatusDashboard } from "@/components/portal/StatusDashboard";
import { TelemetryChart, type TelemetryTarget } from "@/components/portal/TelemetryChart";
import { ScrambleText } from "@/components/ui/Typography";
import { useReducedMotion } from "@/hooks/use-motion";
import { cn } from "@/lib/utils";
import type { ContractView, DocumentView } from "@/lib/db/repositories";
import type {
  FacilityEventView,
  InquiryView,
  InventoryView,
  SessionUser,
  TelemetrySample,
  ZoneView,
} from "@/types";

/**
 * CLIENT PORTAL (spec §32).
 *
 * Six surfaces behind one signed-in route: overview, inventory, telemetry,
 * contracts, documents and a request composer. Everything is handed down by
 * `/(portal)/portal/page.tsx`, already scoped to the caller's `clientId` — the
 * component never widens its own scope and never fetches the database.
 */

export interface PortalTelemetryZone {
  zoneCode: string;
  zoneLabel: string;
  samples: TelemetrySample[];
  target?: TelemetryTarget;
}

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "telemetry", label: "Telemetry", icon: Activity },
  { key: "contracts", label: "Contracts", icon: ScrollText },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "request", label: "New request", icon: Plus },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ClientPortal({
  user,
  client,
  inventory,
  zones,
  events,
  contracts,
  documents,
  inquiries,
  telemetry,
  simulated,
  welcome = false,
}: {
  user: SessionUser;
  client: { code: string; name: string } | null;
  inventory: InventoryView[];
  zones: ZoneView[];
  events: FacilityEventView[];
  contracts: ContractView[];
  documents: DocumentView[];
  inquiries: InquiryView[];
  telemetry: PortalTelemetryZone[];
  simulated: boolean;
  welcome?: boolean;
}) {
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<TabKey>(welcome ? "request" : "overview");

  const pallets = inventory
    .filter((i) => ["RECEIVED", "IN_STORAGE", "RESERVED"].includes(i.status))
    .reduce((sum, i) => sum + (i.unit === "PALLET" ? i.quantity : 1), 0);
  const inTransit = inventory.filter((i) => i.status === "IN_TRANSIT").length;
  const activeContracts = contracts.filter((c) => c.status === "ACTIVE").length;
  const openInquiries = inquiries.filter((i) => !["REJECTED", "COMPLETED"].includes(i.status)).length;

  const tiles = [
    { label: "Pallets held", value: pallets, note: "Received · stored · reserved", tone: "frost" as const },
    { label: "Batches", value: inventory.length, note: "On record for this account", tone: "cyan" as const },
    { label: "In transit", value: inTransit, note: "Released to cold-chain transport", tone: "cool" as const },
    { label: "Active contracts", value: activeContracts, note: `${openInquiries} open request(s)`, tone: "amber" as const },
  ];

  return (
    <div className="space-y-6">
      {/* ------------------------------ header ------------------------------ */}
      <header className="panel relative overflow-hidden rounded-2xl">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(90% 130% at 8% 0%, rgba(34,211,238,0.15), transparent 62%)" }}
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6 px-6 py-7 sm:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-core" aria-hidden />
              <span className="font-mono text-[9px] tracking-[0.28em] text-cyan-core uppercase">
                Client portal
              </span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(1.9rem,4.6vw,3rem)] leading-[0.98] font-bold tracking-[-0.04em] text-frost">
              {client ? client.name : "Your storage"}
            </h1>
            <p className="mt-3 max-w-xl text-[0.9rem] leading-relaxed text-silver/75">
              {welcome
                ? "Account created. Compose your first storage request below and it will be linked to this record."
                : "Batches, zone conditions, contracts and documents for your account in one place."}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10">
            <MetaCell label="Account" value={client?.code ?? user.email} />
            <MetaCell label="Role" value={user.role} />
            <MetaCell label="Signed in as" value={user.name} />
            <MetaCell label="Data source" value={simulated ? "DEMO" : "CONNECTED"} tone={simulated ? "amber" : "cool"} />
          </dl>
        </div>
      </header>

      {/* ------------------------------- tabs ------------------------------- */}
      <nav aria-label="Portal sections" className="sticky top-[4.6rem] z-30 -mx-1 px-1">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-ice/12 bg-midnight/88 p-1 backdrop-blur-md">
          {TABS.map((t) => {
            const active = tab === t.key;
            const count =
              t.key === "inventory"
                ? inventory.length
                : t.key === "contracts"
                  ? contracts.length
                  : t.key === "documents"
                    ? documents.length
                    : t.key === "telemetry"
                      ? telemetry.length
                      : undefined;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 font-mono text-[9px] tracking-[0.18em] uppercase transition-colors duration-300",
                  active ? "text-midnight" : "text-silver/55 hover:bg-industrial/50 hover:text-frost",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="portal-tab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-br from-ice to-cyan-core"
                    transition={{ duration: reduced ? 0.15 : 0.5, ease: EASE.frost as never }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <t.icon className="h-3.5 w-3.5" aria-hidden />
                  {t.label}
                  {count !== undefined && count > 0 && (
                    <span
                      className={cn(
                        "rounded px-1 py-px text-[8px] tabular",
                        active ? "bg-midnight/20 text-midnight" : "bg-ice/10 text-silver/60",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ------------------------------ panels ------------------------------ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: reduced ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -14 }}
          transition={{ duration: reduced ? 0.15 : 0.5, ease: EASE.frost as never }}
        >
          {tab === "overview" && (
            <StatusDashboard
              tiles={tiles}
              inventory={inventory}
              zones={zones}
              events={events}
              simulated={simulated}
              inventoryTitle="Your batches"
              inventoryCode={client?.code}
              emptyMessage="No batches on record yet. Submit a storage request and we will confirm space, handling profile and dates."
            />
          )}

          {tab === "inventory" && (
            <div className="space-y-5">
              <StatusDashboard
                tiles={tiles.slice(0, 3)}
                inventory={inventory}
                simulated={simulated}
                inventoryTitle="Inventory register"
                inventoryCode={client?.code}
                emptyMessage="No batches on record for this account yet."
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {inventory.slice(0, 4).map((item) => (
                  <BatchCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {tab === "telemetry" && (
            <div className="space-y-5">
              {telemetry.length === 0 ? (
                <HudPanel title="Telemetry" code="TEL">
                  <p className="px-6 py-14 text-center font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
                    No zones are reporting readings for your batches yet.
                  </p>
                </HudPanel>
              ) : (
                telemetry.map((z) => (
                  <TelemetryChart
                    key={z.zoneCode}
                    samples={z.samples}
                    zoneLabel={z.zoneLabel}
                    zoneCode={z.zoneCode}
                    target={z.target}
                    title={`Condition history · ${z.zoneLabel}`}
                  />
                ))
              )}
              <DemoNotice>
                The telemetry layer is an interface demonstration. Values are illustrative until a
                sensor provider is connected — nothing here should be read as a facility commitment.
              </DemoNotice>
            </div>
          )}

          {tab === "contracts" && (
            <div className="space-y-5">
              {contracts.length === 0 ? (
                <EmptyPanel
                  icon={ScrollText}
                  title="No contracts on file"
                  body="Once a storage request is quoted and approved, the agreement appears here with its zone, pallet count and temperature profile."
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {contracts.map((c) => (
                    <HudPanel key={c.id} code={c.reference} badge={<StatusPill status={c.status} size="xs" pulse={false} />}>
                      <div className="px-5 py-5">
                        <div className="flex items-center gap-2 font-mono text-[8px] tracking-[0.2em] text-cyan-core/80 uppercase">
                          <ScrollText className="h-3 w-3" aria-hidden />
                          Storage agreement
                        </div>
                        <h3 className="mt-3 font-display text-[1.05rem] leading-tight font-bold tracking-[-0.02em] text-frost">
                          {c.product} · {c.pallets} pallets
                        </h3>
                        <div className="mt-4 space-y-2">
                          <HudRow label="Zone" value={c.zoneName ?? "To be assigned"} tone="ice" />
                          <HudRow label="Starts" value={formatDate(c.startsAt)} />
                          <HudRow label="Ends" value={c.endsAt ? formatDate(c.endsAt) : "Open ended"} />
                          <HudRow
                            label="Temperature profile"
                            value={c.temperatureProfile ?? "Agreed per contract"}
                            tone="cyan"
                          />
                        </div>
                      </div>
                    </HudPanel>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "documents" && (
            <div className="space-y-5">
              {documents.length === 0 ? (
                <EmptyPanel
                  icon={FileText}
                  title="No documents yet"
                  body="Gate passes, receipts, invoices and certificates issued against your batches are collected here."
                />
              ) : (
                <HudPanel title="Document register" code="DOC">
                  <ul className="divide-y divide-ice/8">
                    {documents.map((d) => (
                      <li
                        key={d.id}
                        className="group/doc flex items-center gap-4 px-5 py-4 transition-colors duration-300 hover:bg-industrial/45"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ice/15 bg-navy text-ice transition-colors duration-500 group-hover/doc:border-cyan-core/55 group-hover/doc:text-cyan-core">
                          <FileText className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-display text-[0.9rem] font-bold tracking-[-0.01em] text-frost">
                            {d.title}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[8px] tracking-[0.16em] text-silver/45 uppercase">
                            <span className="text-cyan-core/85">{d.kind.replace(/_/g, " ")}</span>
                            <span>{d.reference}</span>
                            <span>{formatDate(d.createdAt)}</span>
                          </div>
                        </div>
                        {d.url ? (
                          <a
                            href={d.url}
                            download
                            className="flex shrink-0 items-center gap-2 rounded-md border border-ice/20 px-3 py-2 font-mono text-[8px] tracking-[0.18em] text-silver/70 uppercase transition-colors duration-300 hover:border-cyan-core/60 hover:text-cyan-core"
                          >
                            <Download className="h-3 w-3" aria-hidden />
                            Download
                          </a>
                        ) : (
                          <span className="shrink-0 rounded-md border border-ice/12 px-3 py-2 font-mono text-[8px] tracking-[0.18em] text-silver/35 uppercase">
                            On request
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </HudPanel>
              )}
            </div>
          )}

          {tab === "request" && (
            <div className="grid gap-5 xl:grid-cols-[1.05fr_1fr]">
              <div className="space-y-5">
                <HudPanel title="Storage request" code="REQ" badge={<DemoBadge size="xs" label="Linked to account" />}>
                  <div className="p-5 sm:p-6">
                    <InquiryForm source="portal" compact />
                  </div>
                </HudPanel>

                {inquiries.length > 0 && (
                  <HudPanel title="Your requests" code="HIST">
                    <ul className="divide-y divide-ice/8">
                      {inquiries.map((q) => (
                        <li key={q.id} className="flex items-center gap-4 px-5 py-3.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ice/15 bg-navy text-ice">
                            <Inbox className="h-3.5 w-3.5" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-[10px] tracking-[0.1em] text-frost">
                              <ScrambleText text={q.reference} speed={40} trigger="mount" />
                            </div>
                            <div className="mt-1 font-mono text-[8px] tracking-[0.16em] text-silver/45 uppercase">
                              {q.product} · {q.quantity} {q.unit} · {q.durationMonths} mo ·{" "}
                              {formatDate(q.createdAt)}
                            </div>
                          </div>
                          <StatusPill status={q.status} size="xs" pulse={false} />
                        </li>
                      ))}
                    </ul>
                  </HudPanel>
                )}
              </div>

              <div className="space-y-5">
                <StorageCalculator />
                <HudPanel title="What happens next" code="PROC">
                  <ol className="space-y-px">
                    {[
                      ["01", "Received", "Your request is logged and referenced."],
                      ["02", "Contacted", "We confirm category, volume and dates."],
                      ["03", "Quoted", "A written quote is issued — no automated pricing."],
                      ["04", "Approved", "Zone, handling profile and gate pass are assigned."],
                    ].map(([n, title, body]) => (
                      <li key={n} className="flex gap-4 bg-midnight/40 px-5 py-4">
                        <span className="font-mono text-[9px] tracking-[0.16em] text-cyan-core/70 tabular">{n}</span>
                        <span>
                          <span className="block font-display text-[0.88rem] font-bold tracking-[-0.01em] text-frost uppercase">
                            {title}
                          </span>
                          <span className="mt-1 block text-[0.8rem] leading-relaxed text-silver/70">{body}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <div className="border-t border-ice/10 px-5 py-4">
                    <MagneticLink href="/contact" variant="ghost" size="sm" magnetic={false}>
                      Speak to the operations desk
                    </MagneticLink>
                  </div>
                </HudPanel>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MetaCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "cool";
}) {
  return (
    <div className="min-w-[9.5rem] bg-midnight px-4 py-3">
      <dt className="font-mono text-[8px] tracking-[0.22em] text-silver/45 uppercase">{label}</dt>
      <dd
        className={cn(
          "mt-1.5 truncate font-mono text-[10px] tracking-[0.1em] uppercase",
          tone === "amber" ? "text-amber-tj" : tone === "cool" ? "text-cool" : "text-frost",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function BatchCard({ item }: { item: InventoryView }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: EASE.frost as never }}
      className="panel group/batch relative overflow-hidden rounded-xl p-4 transition-colors duration-500 hover:border-cyan-core/35"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[8px] tracking-[0.2em] text-cyan-core/80 uppercase">{item.zone}</div>
          <h3 className="mt-1.5 truncate font-display text-[0.95rem] font-bold tracking-[-0.015em] text-frost">
            {item.productName}
          </h3>
        </div>
        <StatusPill status={item.status} size="xs" pulse={false} />
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <Gauge className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
        <span className="font-display text-[1.4rem] font-bold text-frost tabular">{item.temperature}</span>
      </div>

      <div className="mt-3 space-y-1.5 font-mono text-[8px] tracking-[0.14em] text-silver/50 uppercase">
        <div className="flex justify-between gap-2">
          <span>Batch</span>
          <span className="text-frost/80">{item.batch}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Location</span>
          <span className="text-frost/80">{item.location}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Quantity</span>
          <span className="text-frost/80 tabular">
            {item.quantity} {item.unit}
          </span>
        </div>
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-cyan-core to-transparent transition-transform duration-700 group-hover/batch:scale-x-100"
      />
    </motion.article>
  );
}

function EmptyPanel({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof FileText;
  title: string;
  body: string;
}) {
  return (
    <HudPanel>
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-ice/15 bg-navy text-ice/70">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="font-display text-[1.1rem] font-bold tracking-[-0.02em] text-frost">{title}</h3>
        <p className="max-w-md text-[0.85rem] leading-relaxed text-silver/70">{body}</p>
        <span className="mt-1 flex items-center gap-2 font-mono text-[8px] tracking-[0.18em] text-silver/40 uppercase">
          <ShieldCheck className="h-3 w-3" aria-hidden />
          Nothing is shown until a record exists
        </span>
      </div>
    </HudPanel>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
