import type { Metadata } from "next";
import { ScrollText, ShieldCheck } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DemoNotice, HudPanel } from "@/components/ui/Hud";
import { requireStaff } from "@/lib/auth/guards";
import { ensureReady, listAudit } from "@/lib/db/repositories";

export const metadata: Metadata = { title: "Command centre · Audit log" };

/**
 * AUDIT TRAIL (spec §38).
 *
 * Every privileged mutation writes a row here: who, what role, which entity, and
 * a small metadata payload. IPs are stored only as a salted hash, and the log is
 * append-only from the application's point of view.
 */
export default async function AdminAuditPage() {
  await requireStaff();
  await ensureReady();

  const rows = (await listAudit(120)).map((r: any) => ({
    id: String(r.id),
    at: String(r.createdAt),
    actorId: r.actorId ? String(r.actorId) : null,
    actorRole: r.actorRole ? String(r.actorRole) : null,
    action: String(r.action),
    entity: String(r.entity),
    entityId: r.entityId ? String(r.entityId) : null,
    meta: r.meta ? (typeof r.meta === "string" ? safeParse(r.meta) : r.meta) : null,
    ipHash: r.ipAddressHash ? String(r.ipAddressHash).slice(0, 12) : null,
  }));

  return (
    <>
      <AdminPageHeader
        index="07"
        eyebrow="Trail"
        title="Audit log"
        lead="Append-only record of privileged actions. Caller IP addresses are stored as a salted hash — never in plain form."
        simulated
        aside={
          <div className="flex items-center gap-3 rounded-xl border border-ice/12 bg-navy/60 px-4 py-3">
            <ShieldCheck className="h-4 w-4 text-cool" aria-hidden />
            <div>
              <div className="font-mono text-[8px] tracking-[0.2em] text-silver/45 uppercase">Entries</div>
              <div className="mt-1 font-display text-[1.4rem] leading-none font-bold text-frost tabular">
                {rows.length}
              </div>
            </div>
          </div>
        }
      />

      <HudPanel title="Privileged actions" code="AUD">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <ScrollText className="h-6 w-6 text-silver/30" aria-hidden />
            <p className="max-w-sm font-mono text-[9px] leading-relaxed tracking-[0.16em] text-silver/45 uppercase">
              No privileged actions recorded yet. Status changes and batch receipts write here
              immediately.
            </p>
          </div>
        ) : (
          <div className="max-h-[42rem] overflow-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
              <caption className="sr-only">Audit trail of privileged actions</caption>
              <thead className="sticky top-0 z-10 bg-navy/95 backdrop-blur">
                <tr className="border-b border-ice/12">
                  {["Timestamp", "Action", "Entity", "Role", "Actor", "Metadata", "IP hash"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-2.5 font-mono text-[8px] font-medium tracking-[0.2em] text-silver/50 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-ice/8 transition-colors duration-300 last:border-0 hover:bg-industrial/40">
                    <th scope="row" className="px-4 py-3 font-mono text-[9px] font-normal text-silver/65 tabular">
                      <time dateTime={r.at}>
                        {new Date(r.at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </time>
                    </th>
                    <td className="px-4 py-3 font-mono text-[9px] tracking-[0.06em] text-cyan-core">{r.action}</td>
                    <td className="px-4 py-3 font-mono text-[9px] text-frost/85">{r.entity}</td>
                    <td className="px-4 py-3 font-mono text-[8px] tracking-[0.16em] text-silver/55 uppercase">
                      {r.actorRole ?? "SYSTEM"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[8px] text-silver/45">{r.actorId?.slice(0, 14) ?? "—"}</td>
                    <td className="max-w-[16rem] px-4 py-3">
                      <span className="block truncate font-mono text-[8px] text-silver/55">
                        {r.meta ? JSON.stringify(r.meta) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[8px] text-silver/35">{r.ipHash ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>

      <DemoNotice className="mt-5">
        Seed rows below were generated with the demonstration dataset. Entries written by your own
        actions in this session are real and attributed to the signed-in operator account.
      </DemoNotice>
    </>
  );
}

function safeParse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
