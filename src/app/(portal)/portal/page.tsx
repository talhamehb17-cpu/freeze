import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ClientPortal, type PortalTelemetryZone } from "@/components/portal/ClientPortal";
import { requireUser } from "@/lib/auth/guards";
import {
  ensureReady,
  listClients,
  listContracts,
  listDocuments,
  listEvents,
  listInquiries,
  listInventory,
  listZones,
} from "@/lib/db/repositories";
import { dataSourceLabel, getTelemetryProvider } from "@/lib/telemetry/provider";

export const metadata: Metadata = {
  title: "Client portal",
  description:
    "Track your cold storage batches, zone conditions, contracts and documents with Tahseen Jaber Cold Storage & Logistics.",
  alternates: { canonical: "/portal" },
};

/**
 * CLIENT PORTAL (spec §32).
 *
 * All data access happens here, on the server, already narrowed to the signed-in
 * caller's `clientId`. The client component receives plain serialisable views —
 * it has no database handle and cannot widen its own scope.
 */
export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; error?: string }>;
}) {
  const params = await searchParams;
  const user = await requireUser("/login?next=/portal");

  // Staff belong in the command centre; the portal surface is the client's.
  if (user.role !== "CLIENT") redirect("/admin");
  if (!user.clientId) redirect("/portal?error=no-client");

  const clientId = user.clientId;
  await ensureReady();

  const source = dataSourceLabel();
  const provider = getTelemetryProvider();

  const [clients, inventory, allZones, events, contracts, documents, myInquiries] = await Promise.all([
    listClients(),
    listInventory({ clientId, limit: 200 }),
    listZones(),
    listEvents(10),
    listContracts(clientId),
    listDocuments(clientId),
    listInquiries({ query: user.email, limit: 50 }),
  ]);

  const client = clients.find((c) => c.id === clientId) ?? null;
  // `query` is a substring match — keep only this account's own requests.
  const inquiries = myInquiries.filter((i) => i.email.toLowerCase() === user.email.toLowerCase());

  /* Zones that actually hold this client's stock get a condition history. */
  const heldZoneNames = Array.from(new Set(inventory.map((i) => i.zone))).filter(Boolean);
  const heldZones = allZones.filter((z) => heldZoneNames.includes(z.name) || heldZoneNames.includes(z.code));

  const telemetry: PortalTelemetryZone[] = await Promise.all(
    heldZones.slice(0, 4).map(async (z) => ({
      zoneCode: z.code,
      zoneLabel: z.name,
      // No target band is drawn: real setpoints have not been supplied, and
      // inventing an "acceptable range" would be a fabricated compliance claim.
      samples: await provider.series({ zoneId: z.id, points: 36 }),
    })),
  );

  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {params.error === "no-client" && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-amber-tj/40 bg-amber-tj/8 px-4 py-3 font-mono text-[9px] tracking-[0.14em] text-amber-tj uppercase"
        >
          Your account is not linked to a client record yet. Contact the operations desk and we will
          attach it.
        </p>
      )}

      <ClientPortal
        user={user}
        client={client ? { code: client.code, name: client.name } : null}
        inventory={inventory}
        zones={heldZones.length ? heldZones : allZones}
        events={events}
        contracts={contracts}
        documents={documents}
        inquiries={inquiries}
        telemetry={telemetry}
        simulated={source.simulated}
        welcome={params.welcome === "1"}
      />
    </div>
  );
}
