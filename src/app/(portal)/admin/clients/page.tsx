import type { Metadata } from "next";
import { Building2, Mail, Phone, ScrollText } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DemoNotice, HudPanel, StatusPill } from "@/components/ui/Hud";
import { requireStaff } from "@/lib/auth/guards";
import { ensureReady, listClients, listContracts } from "@/lib/db/repositories";
import { dataSourceLabel } from "@/lib/telemetry/provider";

export const metadata: Metadata = { title: "Command centre · Clients" };

export default async function AdminClientsPage() {
  await requireStaff();
  await ensureReady();

  const [clients, contracts] = await Promise.all([listClients(), listContracts()]);
  const simulated = dataSourceLabel().simulated;

  return (
    <>
      <AdminPageHeader
        index="06"
        eyebrow="Accounts"
        title="Clients"
        lead="Registered storage accounts with their pallet position, batch count and agreements. Portal sign-ups appear here the moment they are created."
        simulated={simulated}
        aside={
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/12 bg-ice/10">
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Accounts</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-frost tabular">{clients.length}</dd>
            </div>
            <div className="bg-midnight px-4 py-3">
              <dt className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Agreements</dt>
              <dd className="mt-1 font-display text-[1.5rem] font-bold text-cyan-core tabular">{contracts.length}</dd>
            </div>
          </dl>
        }
      />

      {clients.length === 0 ? (
        <HudPanel>
          <p className="px-6 py-16 text-center font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
            No client accounts yet. Sign-ups from /signup are recorded here.
          </p>
        </HudPanel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {clients.map((c) => {
            const agreements = contracts.filter(
              (k) => k.clientName.toLowerCase() === c.name.toLowerCase(),
            );
            return (
              <HudPanel key={c.id} code={c.code} badge={<StatusPill status={c.status} size="xs" pulse={false} />}>
                <div className="px-5 py-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-core/28 bg-cyan-core/8 text-cyan-core">
                      <Building2 className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-[1.05rem] leading-tight font-bold tracking-[-0.02em] text-frost">
                        {c.name}
                      </h2>
                      {c.contactName && (
                        <p className="mt-1 font-mono text-[8px] tracking-[0.18em] text-silver/45 uppercase">
                          Contact · {c.contactName}
                        </p>
                      )}
                    </div>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ice/10 bg-ice/8">
                    <Cell label="Pallets held" value={String(c.pallets)} tone="cyan" />
                    <Cell label="Batches" value={String(c.batches)} />
                  </dl>

                  <div className="mt-4 space-y-2">
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-2 font-mono text-[9px] tracking-[0.08em] text-silver/70 transition-colors hover:text-cyan-core"
                      >
                        <Mail className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                    {c.phone && (
                      <a
                        href={`tel:${c.phone.replace(/\s+/g, "")}`}
                        className="flex items-center gap-2 font-mono text-[9px] tracking-[0.08em] text-silver/70 transition-colors hover:text-cyan-core"
                      >
                        <Phone className="h-3 w-3 shrink-0" aria-hidden />
                        {c.phone}
                      </a>
                    )}
                  </div>

                  {agreements.length > 0 && (
                    <div className="mt-4 border-t border-ice/10 pt-4">
                      <div className="mb-2.5 flex items-center gap-2 font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">
                        <ScrollText className="h-3 w-3" aria-hidden />
                        Agreements
                      </div>
                      <ul className="space-y-1.5">
                        {agreements.map((a) => (
                          <li key={a.id} className="flex items-center justify-between gap-3">
                            <span className="min-w-0 truncate font-mono text-[9px] tracking-[0.08em] text-frost/85">
                              {a.reference} · {a.product} · {a.pallets} pallets
                            </span>
                            <StatusPill status={a.status} size="xs" pulse={false} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </HudPanel>
            );
          })}
        </div>
      )}

      <DemoNotice className="mt-5">
        Client names and contact details below are seeded demonstration records. Real accounts created
        through /signup are stored alongside them and are equally scoped — a client can only ever read
        their own rows.
      </DemoNotice>
    </>
  );
}

function Cell({ label, value, tone = "frost" }: { label: string; value: string; tone?: "frost" | "cyan" }) {
  return (
    <div className="bg-midnight px-3 py-2.5">
      <dt className="font-mono text-[7px] tracking-[0.2em] text-silver/45 uppercase">{label}</dt>
      <dd className={`mt-1.5 font-mono text-[11px] tabular ${tone === "cyan" ? "text-cyan-core" : "text-frost"}`}>
        {value}
      </dd>
    </div>
  );
}
