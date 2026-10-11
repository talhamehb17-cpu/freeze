import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { LogoStacked } from "@/components/brand/Logo";
import { Marquee } from "@/components/ui/Hud";
import { CONTACT, LOCATION, NAV, PRODUCTS } from "@/lib/site";

/**
 * Footer (spec §46).
 *
 * Contact channels render only when the client has actually supplied them —
 * an unsupplied phone number shows as an explicit "pending confirmation"
 * line rather than an invented one (spec §45).
 */

const YEAR = new Date().getFullYear();

export function Footer() {
  const hasContact = Boolean(CONTACT.phone || CONTACT.email || CONTACT.whatsapp);

  return (
    <footer className="relative isolate mt-24 border-t border-ice/12 bg-abyss">
      {/* cold bleed from above */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 0%, rgba(34,211,238,0.12), transparent 68%)",
        }}
        aria-hidden
      />
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />

      <Marquee
        className="relative border-b border-ice/10 py-3.5"
        items={[
          "Temperature-controlled storage",
          "Cold-chain logistics",
          "Batch traceability",
          "Zoned separation",
          "Controlled access",
          "Continuous monitoring",
          LOCATION.line2,
        ]}
      />

      <div className="relative mx-auto w-full max-w-[1500px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr_1fr_1.1fr]">
          {/* brand */}
          <div>
            <LogoStacked size={52} />
            <p className="mt-7 max-w-sm text-sm leading-relaxed text-silver/75">
              Precision temperature-controlled storage and cold-chain logistics, operated from{" "}
              {LOCATION.area} in {LOCATION.city}.
            </p>

            <Link
              href={LOCATION.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/loc mt-7 inline-flex items-start gap-3"
              data-cursor="view"
              data-cursor-label="MAP"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ice/20 bg-industrial/50 transition-colors group-hover/loc:border-cyan-core/60">
                <MapPin className="h-3.5 w-3.5 text-cyan-core" aria-hidden />
              </span>
              <span className="font-mono text-[10px] leading-relaxed tracking-[0.16em] text-silver/75 uppercase transition-colors group-hover/loc:text-frost">
                {LOCATION.line1}
                <br />
                {LOCATION.city}, {LOCATION.country}
                <span className="mt-1.5 flex items-center gap-1 text-cyan-core/70">
                  Open in maps
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </span>
              </span>
            </Link>
          </div>

          {/* navigate */}
          <nav aria-label="Footer navigation">
            <FooterHeading>Navigate</FooterHeading>
            <ul className="mt-5 space-y-2.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group/f relative inline-flex items-center gap-2 text-sm text-silver/75 transition-colors hover:text-frost"
                  >
                    <span className="h-px w-0 bg-cyan-core transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/f:w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/portal"
                  className="group/f relative inline-flex items-center gap-2 text-sm text-silver/75 transition-colors hover:text-frost"
                >
                  <span className="h-px w-0 bg-cyan-core transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/f:w-4" />
                  Client Portal
                </Link>
              </li>
            </ul>
          </nav>

          {/* storage */}
          <div>
            <FooterHeading>Storage</FooterHeading>
            <ul className="mt-5 space-y-2.5">
              {PRODUCTS.map((p) => (
                <li key={p.key}>
                  <Link
                    href={`/products?category=${p.key}`}
                    className="group/f relative inline-flex items-center gap-2 text-sm text-silver/75 transition-colors hover:text-frost"
                  >
                    <span className="h-px w-0 bg-cyan-core transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/f:w-4" />
                    {p.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/request-storage"
                  className="group/f relative inline-flex items-center gap-2 text-sm text-silver/75 transition-colors hover:text-frost"
                >
                  <span className="h-px w-0 bg-cyan-core transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/f:w-4" />
                  Storage calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* contact */}
          <div>
            <FooterHeading>Contact</FooterHeading>

            {hasContact ? (
              <ul className="mt-5 space-y-3 font-mono text-[11px] tracking-[0.1em] text-silver/80">
                {CONTACT.phone && (
                  <li>
                    <a href={`tel:${CONTACT.phone}`} className="transition-colors hover:text-frost">
                      {CONTACT.phoneDisplay ?? CONTACT.phone}
                    </a>
                  </li>
                )}
                {CONTACT.email && (
                  <li>
                    <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-frost">
                      {CONTACT.email}
                    </a>
                  </li>
                )}
                {CONTACT.whatsapp && (
                  <li>
                    <a
                      href={`https://wa.me/${CONTACT.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-frost"
                    >
                      WhatsApp · {CONTACT.whatsapp}
                    </a>
                  </li>
                )}
                {CONTACT.hours && <li className="text-silver/55">{CONTACT.hours}</li>}
              </ul>
            ) : (
              <div className="mt-5 space-y-3">
                <PendingLine label="Phone" />
                <PendingLine label="Email" />
                <PendingLine label="WhatsApp" />
                <p className="pt-2 font-mono text-[9px] leading-relaxed tracking-[0.14em] text-amber-tj/70 uppercase">
                  Contact channels are published only once the business confirms them. Use the
                  request form until then.
                </p>
              </div>
            )}

            <div className="mt-7">
              <Link
                href="/request-storage"
                className="cta-primary sweep-host group/f inline-flex h-11 items-center gap-2.5 rounded-lg bg-[linear-gradient(135deg,#b8ecff,#7DD3FC_30%,#22D3EE)] px-5 font-mono text-[10px] font-bold tracking-[0.22em] text-midnight uppercase shadow-[0_0_0_1px_rgba(125,211,252,0.5),0_16px_40px_-18px_rgba(34,211,238,0.9)] transition-shadow hover:shadow-[0_0_0_1px_rgba(244,250,255,0.8),0_22px_54px_-16px_rgba(34,211,238,1)]"
                data-cta="true"
              >
                Request Storage
                <ArrowUpRight
                  className="h-3.5 w-3.5 transition-transform duration-400 group-hover/f:translate-x-0.5 group-hover/f:-translate-y-0.5"
                  aria-hidden
                />
              </Link>
            </div>

            {CONTACT.social.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {CONTACT.social.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-ice/18 px-3 py-1.5 font-mono text-[9px] tracking-[0.2em] text-silver/70 uppercase transition-colors hover:border-cyan-core/60 hover:text-frost"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-16 flex flex-col gap-4 border-t border-ice/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[9px] tracking-[0.2em] text-silver/45 uppercase">
            © {YEAR} {LOCATION.line2} · All rights reserved
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[9px] tracking-[0.2em] text-silver/45 uppercase">
            <Link href="/solutions" className="transition-colors hover:text-ice">
              Solutions
            </Link>
            <Link href="/facility" className="transition-colors hover:text-ice">
              Facility
            </Link>
            <Link href="/contact" className="transition-colors hover:text-ice">
              Contact
            </Link>
            <span className="flex items-center gap-2 text-amber-tj/70">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-tj opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-tj" />
              </span>
              Telemetry shown on this site is illustrative
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2.5 font-mono text-[9px] tracking-[0.3em] text-ice/70 uppercase">
      <span className="h-1 w-1 rotate-45 bg-cyan-core" aria-hidden />
      {children}
    </h3>
  );
}

function PendingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.16em] text-silver/40 uppercase">
      <span className="w-20 shrink-0">{label}</span>
      <span className="h-px flex-1 bg-[repeating-linear-gradient(90deg,rgba(167,180,197,0.28)_0_4px,transparent_4px_8px)]" />
      <span className="text-amber-tj/60">Pending</span>
    </div>
  );
}
