import type { Metadata } from "next";

import { InquiryForm } from "@/components/forms/InquiryForm";
import { StorageCalculator } from "@/components/forms/StorageCalculator";
import { PageHero } from "@/components/layout/PageHero";
import { DemoNotice, HudPanel } from "@/components/ui/Hud";
import { LOCATION } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request storage",
  description: `Request temperature-controlled cold storage at ${LOCATION.area}, ${LOCATION.city}. Configure product, volume and duration and receive a custom quote — no published rate card.`,
  alternates: { canonical: "/request-storage" },
};

/**
 * /request-storage — the conversion page.
 *
 * Two ways in: the full request form, and the step-by-step calculator for
 * people who would rather click than type. Neither one shows a price, because
 * no rate card has been supplied; both end in REQUEST A CUSTOM QUOTE.
 */
export default function RequestStoragePage() {
  return (
    <>
      <PageHero
        index="10"
        eyebrow="Request storage"
        lines={["Reserve cold space."]}
        lead="Tell us the product, the volume and the duration. We confirm the zone, the handling profile and the dates, then issue a written quote."
        image="/assets/cold-room-aisle.jpg"
        imageAlt="Cold room aisle with pallet racking prepared for incoming stock"
        imageCode="REQ-01"
        meta={[
          { label: "Facility", value: LOCATION.area },
          { label: "Categories", value: "5" },
          { label: "Durations", value: "Days → seasons", tone: "cyan" },
          { label: "Pricing", value: "CUSTOM QUOTE", tone: "amber" },
        ]}
      />

      <section className="relative mx-auto w-full max-w-[1500px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-core" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">Full request</span>
            </div>
            <h2 className="font-display text-[clamp(1.7rem,3.8vw,2.6rem)] leading-[1] font-bold tracking-[-0.04em] text-frost">
              Tell us everything at once.
            </h2>
            <InquiryForm source="request-storage" />
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-cyan-core" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">Step by step</span>
            </div>
            <h2 className="font-display text-[clamp(1.7rem,3.8vw,2.6rem)] leading-[1] font-bold tracking-[-0.04em] text-frost">
              Or configure it in four steps.
            </h2>
            <StorageCalculator />

            <HudPanel title="What happens next" code="PROC">
              <ol className="space-y-px">
                {[
                  ["01", "Received", "Your request is logged and given a reference immediately."],
                  ["02", "Contacted", "We confirm category, volume, dates and any handling needs."],
                  ["03", "Quoted", "A written quote is issued. We do not publish an automated rate."],
                  ["04", "Approved", "Zone, profile and gate pass are assigned and your portal record opens."],
                ].map(([n, title, body]) => (
                  <li key={n} className="flex gap-4 bg-midnight/40 px-5 py-4">
                    <span className="font-mono text-[9px] tracking-[0.16em] text-cyan-core/70 tabular">{n}</span>
                    <span>
                      <span className="block font-display text-[0.9rem] font-bold tracking-[-0.01em] text-frost uppercase">
                        {title}
                      </span>
                      <span className="mt-1 block text-[0.82rem] leading-relaxed text-silver/70">{body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </HudPanel>

            <DemoNotice>
              No price is displayed anywhere on this site. Storage cost depends on category, volume,
              duration, handling and movement — quoting it automatically would mean inventing a rate
              card that does not exist.
            </DemoNotice>
          </div>
        </div>
      </section>
    </>
  );
}
