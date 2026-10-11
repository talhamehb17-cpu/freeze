import type { Metadata } from "next";
import { Clock3, ExternalLink, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/forms/ContactForm";
import { PageHero } from "@/components/layout/PageHero";
import { DemoNotice, HudPanel, HudRow } from "@/components/ui/Hud";
import { CONTACT, LOCATION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact Tahseen Jaber Cold Storage & Logistics — ${LOCATION.area}, ${LOCATION.city}, ${LOCATION.country}. Send a storage, logistics, account or partnership message.`,
  alternates: { canonical: "/contact" },
};

/**
 * /contact — the message form plus what we can honestly publish.
 *
 * Phone, email, WhatsApp, opening hours and social channels have NOT been
 * supplied. Rather than inventing them, each one renders as an explicit
 * "awaiting confirmation" row, and the form is the primary channel.
 */
export default function ContactPage() {
  return (
    <>
      <PageHero
        index="11"
        eyebrow="Contact"
        lines={["Talk to the", "operations desk."]}
        lead="Storage availability, logistics scheduling, account questions or a partnership — send it through and it lands directly in the command centre queue with a reference you can quote."
        image="/assets/control-room.jpg"
        imageAlt="Operations control room with a monitoring wall and workstations"
        imageCode="CNT-01"
        meta={[
          { label: "Location", value: LOCATION.area },
          { label: "City", value: `${LOCATION.city}, ${LOCATION.country}` },
          { label: "Response", value: "By message", tone: "cyan" },
          { label: "Phone / email", value: "AWAITING CONFIRMATION", tone: "amber" },
        ]}
      />

      <section className="relative mx-auto w-full max-w-[1500px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* ------------------------------- form ------------------------------- */}
          <ContactForm />

          {/* ------------------------------ details ------------------------------ */}
          <div className="space-y-5">
            <HudPanel title="Facility" code="LOC">
              <div className="space-y-px px-5 py-4">
                <HudRow label="Area" value={LOCATION.area} tone="ice" />
                <HudRow label="City" value={LOCATION.city} />
                <HudRow label="Country" value={LOCATION.country} />
                <HudRow label="Timezone" value={LOCATION.timezone} tone="cyan" />
              </div>
              <div className="border-t border-ice/10 px-5 py-4">
                <a
                  href={LOCATION.mapsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group/map flex items-center gap-3 rounded-lg border border-ice/14 bg-navy/55 px-4 py-3.5 transition-colors duration-300 hover:border-cyan-core/55"
                >
                  <MapPin className="h-4 w-4 shrink-0 text-cyan-core" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[0.9rem] font-bold tracking-[-0.01em] text-frost">
                      Open in maps
                    </span>
                    <span className="mt-1 block truncate font-mono text-[8px] tracking-[0.16em] text-silver/50 uppercase">
                      {LOCATION.area}, {LOCATION.city}
                    </span>
                  </span>
                  <ExternalLink
                    className="h-3.5 w-3.5 shrink-0 text-silver/45 transition-transform duration-500 group-hover/map:-translate-y-0.5 group-hover/map:translate-x-0.5 group-hover/map:text-cyan-core"
                    aria-hidden
                  />
                </a>
                <p className="mt-3 font-mono text-[8px] leading-relaxed tracking-[0.14em] text-silver/40 uppercase">
                  Coordinates {LOCATION.coords.lat.toFixed(4)}, {LOCATION.coords.lng.toFixed(4)} are
                  approximate to the industrial district and pending client confirmation.
                </p>
              </div>
            </HudPanel>

            <HudPanel title="Direct channels" code="CHN" badge={<span className="font-mono text-[8px] tracking-[0.18em] text-amber-tj uppercase">Pending</span>}>
              <ul className="divide-y divide-ice/8">
                <PendingRow icon={<Phone className="h-3.5 w-3.5" aria-hidden />} label="Telephone" />
                <PendingRow icon={<Mail className="h-3.5 w-3.5" aria-hidden />} label="Email" />
                <PendingRow icon={<Phone className="h-3.5 w-3.5" aria-hidden />} label="WhatsApp" />
                <PendingRow icon={<Clock3 className="h-3.5 w-3.5" aria-hidden />} label="Opening hours" />
              </ul>
              <div className="border-t border-ice/10 px-5 py-4">
                <DemoNotice>
                  {CONTACT.phone || CONTACT.email
                    ? "Direct channels are published once confirmed."
                    : "No telephone number, email address, WhatsApp line or opening hours have been supplied for this business. They are shown as pending rather than filled with placeholder numbers that could be dialled by mistake."}
                </DemoNotice>
              </div>
            </HudPanel>

            <HudPanel title="What to include" code="BRIEF">
              <ol className="space-y-px">
                {[
                  ["01", "Product category", "Produce, meat, seafood, pharmaceutical or other."],
                  ["02", "Volume and unit", "Pallets, tonnes, cartons or units."],
                  ["03", "Duration", "Days for a buffer, months or seasons for a contract."],
                  ["04", "Temperature profile", "What your product actually needs held at."],
                  ["05", "Movement", "Whether you need collection or delivery as well as storage."],
                ].map(([n, title, body]) => (
                  <li key={n} className="flex gap-4 bg-midnight/40 px-5 py-3.5">
                    <span className="font-mono text-[9px] tracking-[0.16em] text-cyan-core/70 tabular">{n}</span>
                    <span>
                      <span className="block font-display text-[0.88rem] font-bold tracking-[-0.01em] text-frost">
                        {title}
                      </span>
                      <span className="mt-1 block text-[0.8rem] leading-relaxed text-silver/70">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </HudPanel>
          </div>
        </div>
      </section>
    </>
  );
}

function PendingRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-3 border-l-2 border-dashed border-amber-tj/40 px-5 py-3.5">
      <span className="text-amber-tj/70">{icon}</span>
      <span className="flex-1 font-mono text-[9px] tracking-[0.18em] text-silver/60 uppercase">{label}</span>
      <span className="font-mono text-[8px] tracking-[0.16em] text-amber-tj/80 uppercase">
        Awaiting confirmation
      </span>
    </li>
  );
}
