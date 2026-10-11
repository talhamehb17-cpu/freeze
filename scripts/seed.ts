/**
 * Database / demo-store seeder.
 *
 *   npm run db:seed
 *
 * With DATABASE_URL set this writes the demo dataset into PostgreSQL through the
 * same repositories the application uses. Without it, the JSON file store at
 * `.data/store.json` is rebuilt instead — so `npm run db:seed` is meaningful in
 * both configurations.
 *
 * Idempotent-ish by design: it is destructive on purpose (it clears the tables it
 * seeds) and says so before it runs. Never point it at a production database.
 */

import { buildSeed } from "@/lib/db/seed";
import { isDatabaseConfigured } from "@/lib/env";
import { ensureReady, getOverviewStats } from "@/lib/db/repositories";
import { flushStore, storeFile } from "@/lib/db/file-store";
import { DEMO_CREDENTIALS } from "@/lib/auth/demo-credentials";

async function main() {
  const target = isDatabaseConfigured ? "PostgreSQL (DATABASE_URL)" : "JSON file store (.data/store.json)";

  console.log("────────────────────────────────────────────────────────────");
  console.log(" Tahseen Jaber Cold Storage & Logistics — seeder");
  console.log("────────────────────────────────────────────────────────────");
  console.log(` Target:   ${target}`);
  console.log(` Node:     ${process.version}`);
  console.log("");

  if (isDatabaseConfigured && process.env.NODE_ENV === "production") {
    console.error(" Refusing to seed with NODE_ENV=production against a real database.");
    console.error(" Run this from a non-production environment, or seed through a migration.");
    process.exit(1);
  }

  // `buildSeed` is the single source of truth for the demo dataset; calling it
  // first proves the data is valid before anything is written.
  const seed = await buildSeed();
  console.log(` Built:    ${seed.users.length} users, ${seed.clients.length} clients,`);
  console.log(`           ${seed.zones.length} zones, ${seed.inventory.length} inventory rows,`);
  console.log(`           ${seed.storageInquiries.length} inquiries, ${seed.contracts.length} contracts,`);
  console.log(`           ${seed.documents.length} documents, ${seed.events.length} events,`);
  console.log(`           ${seed.telemetry.length} telemetry samples, ${seed.audit.length} audit rows.`);
  console.log("");

  // `ensureReady()` writes the seed through whichever store is configured.
  await ensureReady();

  // The file store queues its write; a short-lived script would otherwise exit
  // before the snapshot lands on disk.
  await flushStore();
  if (!isDatabaseConfigured) console.log(` Written:  ${storeFile}`);

  const stats = await getOverviewStats();
  console.log(" Seeded and verified:");
  console.log(`           ${stats.batches} batches held · ${stats.palletsStored} pallets`);
  console.log(`           ${stats.zones} zones (${stats.activeZones} active)`);
  console.log(`           ${stats.clients} clients · ${stats.inquiriesTotal} inquiries`);
  console.log("");
  console.log("────────────────────────────────────────────────────────────");
  console.log(" Demo sign-in credentials (rotate before any real deployment)");
  console.log("────────────────────────────────────────────────────────────");
  for (const [role, creds] of Object.entries(DEMO_CREDENTIALS)) {
    console.log(` ${role.padEnd(10)} ${creds.email.padEnd(34)} ${creds.password}`);
  }
  console.log("");
  console.log(" Every temperature and telemetry value written above is ILLUSTRATIVE.");
  console.log(" The UI renders it behind a DEMO badge — it is never presented as a");
  console.log(" live facility reading until a real telemetry provider is connected.");
  console.log("────────────────────────────────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    // Log server-side detail; the summary is enough for the operator.
    console.error("");
    console.error(" Seeding failed.");
    console.error(error instanceof Error ? ` ${error.message}` : error);
    if (error instanceof Error && error.stack) console.error(`\n${error.stack}`);
    process.exit(1);
  });
