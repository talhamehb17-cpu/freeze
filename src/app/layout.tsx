import type { Metadata, Viewport } from "next";

import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { AppShell } from "@/components/layout/AppShell";
import { BRAND, LOCATION, SITE_URL } from "@/lib/site";

/* -------------------------------------------------------------------------- */
/* Metadata (spec §36)                                                         */
/* -------------------------------------------------------------------------- */

const title = `${BRAND.name} ${BRAND.suffix}`;
const description = `${BRAND.full} — ${BRAND.promise} Temperature-controlled storage, zoned cold rooms and cold-chain logistics from ${LOCATION.area}, ${LOCATION.city}, ${LOCATION.country}.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${title} | ${LOCATION.city}, ${LOCATION.country}`,
    template: `%s · ${title}`,
  },
  description,
  applicationName: title,
  keywords: [
    "cold storage",
    "cold storage Baghdad",
    "temperature controlled warehouse",
    "cold chain logistics",
    "frozen storage Iraq",
    "refrigerated warehouse",
    "produce cold storage",
    "seafood cold storage",
    "pharmaceutical cold storage",
    "Uuayrij industrial area",
    BRAND.name,
  ],
  authors: [{ name: title }],
  creator: title,
  publisher: title,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IQ",
    url: SITE_URL,
    siteName: title,
    title: `${title} — ${LOCATION.city}, ${LOCATION.country}`,
    description,
    images: [
      {
        url: "/assets/facility-hero.jpg",
        width: 1600,
        height: 900,
        alt: `${title} facility at night`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} — ${LOCATION.city}, ${LOCATION.country}`,
    description,
    images: ["/assets/facility-hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
  category: "industrial logistics",
  icons: {
    // The mark is an original placeholder drawn for this build — see the header
    // comment in public/assets/logo.svg before shipping the real artwork.
    icon: [{ url: "/assets/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/assets/logo.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050914" },
    { media: "(prefers-color-scheme: light)", color: "#050914" },
  ],
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/* -------------------------------------------------------------------------- */
/* Structured data — only facts we actually hold (spec §36 / §45)             */
/* -------------------------------------------------------------------------- */

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "LocalBusiness"],
      "@id": `${SITE_URL}/#organization`,
      name: BRAND.full,
      alternateName: BRAND.short,
      description,
      url: SITE_URL,
      address: {
        "@type": "PostalAddress",
        streetAddress: LOCATION.line1,
        addressLocality: LOCATION.city,
        addressCountry: LOCATION.countryCode,
      },
      areaServed: {
        "@type": "Place",
        name: `${LOCATION.city}, ${LOCATION.country}`,
      },
      // phone / email / openingHours are intentionally omitted until the
      // client supplies verified values. We never invent contact details.
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND.full,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service`,
      serviceType: "Temperature-controlled cold storage and cold-chain logistics",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@id": `${SITE_URL}/#organization` },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Cold storage services",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Chilled produce storage" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Frozen meat & poultry storage" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Frozen seafood storage" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Pharmaceutical cold storage" } },
          { "@type": "Offer", itemOffered: { "@type": "Service", name: "Cold-chain logistics & dispatch" } },
        ],
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="relative min-h-dvh bg-midnight font-sans text-frost antialiased">
        <script
          type="application/ld+json"
          // Structured data is built from our own constants, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        <AppShell>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-md focus:border focus:border-cyan-core focus:bg-navy focus:px-4 focus:py-2 focus:font-mono focus:text-[11px] focus:tracking-[0.2em] focus:text-frost focus:uppercase"
          >
            Skip to content
          </a>

          {/*
            Chrome (navbar / main landmark / footer / inquiry hatch) is supplied
            by each route group's layout — `(site)`, `(auth)`, `(portal)` — so
            the public site and the signed-in experiences can differ without the
            root layout having to guess from the pathname.
          */}
          {children}
        </AppShell>
      </body>
    </html>
  );
}
