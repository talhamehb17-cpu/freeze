# Tahseen Jaber Cold Storage & Logistics

A production-grade Next.js 16 site for a temperature-controlled cold store and
cold-chain logistics operator in **Uuayrij Industrial Area, Baghdad, Iraq**.

The brief was not "a template with a warehouse photo on it". It was: *the cold
chain comes alive*. A visitor arrives in darkness, a refrigerated truck docks,
the cold-room door lifts and spills cyan light and mist, cargo is indexed by
category, a monitoring HUD boots — and only then does the name appear. Everything
downstream of that sequence is built to the same standard.

> **Read this first if you are the client or the deploying developer:** the
> [Honest data](#honest-data) section lists every place this build deliberately
> says *CONFIGURABLE* or *DEMO* instead of publishing a number, and why.

---

## Contents

- [Running it](#running-it)
- [The three experiences](#the-three-experiences)
- [Architecture](#architecture)
- [Demo credentials](#demo-credentials)
- [Environment](#environment)
- [Data layer](#data-layer)
- [Motion system](#motion-system)
- [Honest data](#honest-data)
- [Security](#security)
- [Accessibility and mobile](#accessibility-and-mobile)
- [Replacing the placeholders](#replacing-the-placeholders)
- [Deployment](#deployment)

---

## Running it

```bash
npm install
cp .env.example .env.local   # then edit — see Environment
npm run db:seed              # optional: writes the demo dataset up front
npm run dev                  # http://localhost:3000
```

Without `DATABASE_URL` the app runs against a JSON file store at
`.data/store.json` (git-ignored) and seeds itself on first request, so
`npm install && npm run dev` is enough to see everything working.

```bash
npm run audit      # typecheck + lint + build
npm run typecheck
npm run lint
npm run build && npm start
```

Requires Node 20.9+ (developed on Node 22).

---

## The three experiences

### 1. Public website — `(site)` route group

| Route | What it is |
| --- | --- |
| `/` | The full journey: hero sequence → cold chain → precision cooling → products → facility → inventory → security → logistics → storage options → trust → request |
| `/solutions` | Six services, each photographed, then the chain, the cooling plant and the storage models |
| `/products` | An interactive category vault, then a full dossier per category |
| `/facility` | Interactive SVG floor plan, a dossier per zone, batch verification, access control |
| `/logistics` | A scroll-driven route with the truck positioned along the path, then the five handovers |
| `/about` | How the facility operates, and an explicit list of what has *not* been confirmed |
| `/contact` | Message form plus the facility record; unpublished channels shown as pending |
| `/request-storage` | The conversion page — full request form and a four-step calculator |

### 2. Client portal — `/portal`

Signed-in clients see their own batches, zone conditions, contracts, documents
and request history, and can compose a new storage request. Data is narrowed to
the caller's `clientId` **on the server** before it reaches the component.

### 3. Admin command centre — `/admin`

| Route | What it does |
| --- | --- |
| `/admin` | Occupancy gauge, KPIs, inquiry pipeline funnel, 14-day volume, zone load, event trail |
| `/admin/inquiries` | The working queue — expand a request, set status, write an internal note, save |
| `/admin/inventory` | Batch register with filters and search, plus a put-away composer |
| `/admin/zones` | Every mapped zone with its reported condition and utilisation |
| `/admin/telemetry` | Zone selector and condition history through the provider abstraction |
| `/admin/clients` | Accounts, pallet position, agreements, contact detail |
| `/admin/audit` | Append-only trail of privileged actions |

---

## Architecture

```
src/
├── app/
│   ├── (site)/        # public marketing site + its chrome (navbar/footer/inquiry hatch)
│   ├── (auth)/        # /login, /signup — bare shell, no site chrome
│   ├── (portal)/      # /portal and /admin — signed-in shell + top bar
│   ├── actions/       # server actions: inquiry, admin mutations
│   └── api/           # route handlers: /api/inquiries, /api/session
├── components/
│   ├── hero/          # AnimatedTruck, LoadingBay, HeroSlider, HUD, controller, scene
│   ├── cold-chain/    # timeline, precision cooling
│   ├── products/ facility/ inventory/ security/ logistics/
│   ├── portal/ admin/ # dashboards, telemetry chart, sidebar, consoles
│   ├── forms/         # Field primitives, InquiryForm, ContactForm, StorageCalculator
│   ├── ui/            # Reveal, Button, Typography, Hud, FrostFrame, cursor, atmosphere
│   └── layout/ navigation/ brand/ atmosphere/ auth/
├── lib/
│   ├── db/            # Drizzle schema, client, JSON file store, repositories, seed
│   ├── auth/          # session, guards, constants, actions, demo credentials
│   ├── telemetry/     # provider abstraction (demo ⇄ live)
│   ├── validation/    # Zod schemas — the single source of truth for every input
│   ├── notifications/ # email dispatch, loaded lazily
│   └── site.ts        # all brand copy, zones, products, services, storage models
├── animations/presets.ts   # easing, durations, variants, stagger, page transition
├── hooks/             # motion, interaction, GSAP, view-entry
└── proxy.ts           # edge proxy: CSRF minting, coarse route guard, CSP headers
```

**Route groups, not pathname sniffing.** The root layout owns `<html>`, fonts,
metadata, structured data and the atmosphere/cursor/freeze providers. Each route
group supplies its own chrome, so `/login` never has to hide a navbar by
checking the URL.

**Server components by default.** Pages fetch and narrow data; client components
receive plain serialisable views. No client component holds a database handle,
and none can widen its own scope.

---

## Demo credentials

There is no live customer base, so the seeded accounts are published on the
login screen (behind a **Demo credentials** disclosure) rather than hidden.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@tahseenjaber.iq` | `ColdChain!2026` |
| Operator | `operator@tahseenjaber.iq` | `Operator!2026` |
| Client | `client@shatt-seafood.example` | `Client!2026` |
| Client | `client@aldiyar-food.example` | `Client!2026` |

**Rotate all four before any real deployment.** Override the administrator with
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. The values live in
`src/lib/auth/demo-credentials.ts` — a dependency-free module so the login page
and the server seed cannot drift apart.

---

## Environment

Copy `.env.example` to `.env.local`. **Nothing is hardcoded** and no variable
without the `NEXT_PUBLIC_` prefix can reach the browser — `src/lib/env.ts`
validates everything through Zod at import time and fails the build rather than
leaking.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | no | PostgreSQL connection string. Absent → JSON file store. |
| `AUTH_SECRET` | **yes, in production** | HS256 session signing. Absent → an ephemeral per-process secret, so sessions do not survive a restart. |
| `AUTH_SESSION_TTL` | no | Session lifetime in seconds (default 86400). |
| `TELEMETRY_PROVIDER_URL` / `_TOKEN` | no | Point at a real sensor gateway to switch telemetry from DEMO to LIVE. |
| `EMAIL_SERVER` / `EMAIL_FROM` | no | SMTP for inquiry notifications. Absent → notifications are skipped, never fatal. |
| `NEXT_PUBLIC_SITE_URL` | **yes, in production** | Canonical origin for sitemap, robots, OG tags and structured data. Defaults to `http://localhost:3000`. |
| `RATE_LIMIT_*` | no | Public form throttling. |
| `SEED_ADMIN_*` | no | Override the seeded administrator. |

> If a database credential was ever pasted into a chat, a ticket or a commit,
> **rotate it before deploying**. Check `git log -p -- .env*` and treat anything
> found there as compromised.

---

## Data layer

Drizzle ORM over `pg`, with a JSON file-store fallback behind the same
repository interface — `src/lib/db/repositories.ts` is the only module that
knows which one is active.

Entities: `User`, `Client`, `StorageInquiry`, `InventoryItem`, `StorageZone`,
`StorageContract`, `Lease`, `TelemetryLog`, `FacilityEvent`, `Document`,
`Notification`, `AuditLog`, with enums for role, inquiry status, inventory
status and storage status.

```bash
npm run db:generate   # drizzle-kit generate
npm run db:migrate    # drizzle-kit migrate
npm run db:seed       # writes the demo dataset to whichever store is configured
```

`npm run db:seed` runs under `--conditions=react-server` so the `server-only`
marker package resolves to its empty module outside Next — the script imports the
same repositories the app uses instead of duplicating them.

---

## Motion system

- **GSAP** drives the hero timeline and the SVG loading bay. The bay animates
  **CSS custom properties**, not React state, so a 60fps sequence costs zero
  re-renders.
- **Framer Motion** handles scroll reveals, presence transitions and the
  scroll-linked logistics route (the truck is positioned with
  `getPointAtLength()` against `scrollYProgress`).
- **CSS** does the atmosphere: gradients, drifting mist sheets, scanlines,
  grain, frost surfaces.
- `src/animations/presets.ts` centralises `EASE`, `DURATION`, the named variants
  (`fadeUp`, `revealMask`, `frostReveal`, `temperatureShift`, …) and `stagger()`.

The custom pointer has six states — DEFAULT, EXPLORE, INSPECT, VIEW, DRAG,
ACTIVE — detected from `data-cursor` attributes and disabled entirely below
`lg`, on touch, and under reduced motion.

Every sequence respects `prefers-reduced-motion`: the hero jumps to its final
frame, parallax and Ken Burns stop, particles thin out, transitions shorten.

---

## Honest data

This build refuses to invent facts about a real business. Where a value has not
been supplied, the UI says so.

**Never fabricated:** certifications, licences, client counts, warehouse
capacity, delivery coverage, temperature setpoints, sensor readings,
testimonials, company history, founding date, awards, compliance claims, pricing.

**What you will see instead:**

- `CONFIGURABLE` — pallet capacity, fleet size, delivery coverage, temperature
  profiles. The zone dossiers explain *why* rather than showing a rounded guess.
- `Awaiting client confirmation` — dashed amber slots in the Trust section where
  certifications, history and references belong.
- `DEMO` badges — on every surface rendering synthetic data, per the brief's
  requirement that nothing simulated is ever labelled live, real-time, current
  or operational.
- `REQUEST A CUSTOM QUOTE` — the storage calculator deliberately shows **no
  estimate**, because no rate card exists. Pricing depends on category, volume,
  duration and handling.
- Omitted structured-data fields — `LocalBusiness` carries no `telephone`,
  `email` or `openingHours`, because none were supplied.
- `STYLISED · NOT TO SCALE` — on the logistics map, which diagrams the process
  rather than claiming geographic reach.

**Telemetry sits behind a provider abstraction** (`src/lib/telemetry/provider.ts`).
`DemoTelemetryProvider` returns clearly-marked illustrative samples;
`LiveSensorProvider` is written and waiting. Set `TELEMETRY_PROVIDER_URL` and
`TELEMETRY_PROVIDER_TOKEN` and the badge flips from DEMO to LIVE — **no UI
changes required**, which is the whole point of the abstraction.

**No medical-grade or pharmaceutical-compliance claim is made anywhere.** The
pharma zone is described as a precision environment with a client-configured
profile, nothing more.

---

## Security

- **Passwords** hashed with bcrypt at cost 10. Never stored, logged or returned
  in plain text.
- **Sessions** are HS256 JWTs in an `httpOnly`, `SameSite=Lax`, `Secure`-in-
  production cookie. No session data reaches the browser.
- **CSRF** uses a double-submit token minted by the edge proxy (Next 16 forbids
  writing cookies during render) and forwarded on the request headers so a first
  visit can embed it. Every mutation compares it in constant time.
- **Authorisation is server-side.** `requireStaff()` / `requireClientScope()` run
  in every protected layout and page; `assertStaff()` runs again inside every
  server action and route handler. The proxy redirect is a convenience, never
  the boundary — editing the client bundle reveals nothing.
- **Validation** is Zod, in one module, shared by forms, actions and API routes.
  A consumer cannot reach a rule the form enforces by going around it.
- **Public forms** are rate limited per hashed IP, honeypot-guarded, and reject
  submissions faster than a human could fill them.
- **Errors** are logged server-side with detail and returned to the browser as
  generic copy. No raw database or stack error is ever shown to a user.
- **Queries** are parameterised through the ORM. No string-built SQL.
- **CSP** headers are applied in production by the edge proxy.

Every major operation has all three states: `PROCESSING…`, a success screen with
a real reference (`TJ-XXXXX`), and `WE COULDN'T COMPLETE YOUR REQUEST. PLEASE
TRY AGAIN.`

---

## Accessibility and mobile

- `prefers-reduced-motion` is honoured everywhere, including the hero timeline,
  custom cursor, parallax, Ken Burns and particle density.
- Semantic headings, one `h1` per page, a skip link, visible focus rings, and
  `aria-current` / `aria-pressed` / `aria-expanded` on every custom control.
- Forms use real `<label>`s, `aria-invalid`, `aria-describedby` and live regions
  for success and error announcements.
- The custom cursor is desktop-only; below `lg` and on touch it is never mounted.
- Hover-only affordances have tap equivalents, pinned sections are simplified,
  and CTAs stay visible on small screens.

---

## Replacing the placeholders

Everything below is intentionally swappable without touching application code.

| Asset | Status |
| --- | --- |
| `public/assets/logo.svg` | **Original placeholder.** No brand logo was supplied or could be verified, so a `TJ` ice-crystal monogram was drawn in the brand palette. Replace the file (keep the 48×48 viewBox) and update `src/components/brand/Logo.tsx` to match. |
| `public/assets/team-cold-gear.jpg` | **Temporary duplicate** of `cold-room-aisle.jpg`. Regenerate or supply real photography. |
| `public/assets/aerial-industrial.jpg` | **Temporary duplicate** of `facility-hero.jpg`. Regenerate or supply real photography. |
| Remaining 10 images | Generated brand-palette artwork. Replace with real facility photography when available. |
| `src/lib/site.ts` → `CONTACT` | Phone, email, WhatsApp, hours and socials are `null` and render as pending. Fill them in and they appear automatically. |
| `src/lib/site.ts` → `BRAND.established` | `null` until the client confirms a founding date. |
| `src/lib/site.ts` → `ZONES[].capacity` | `null` until real pallet capacities are confirmed. |

Images are routed through `FrostFrame`, which applies the cold grade, edge frost
and Ken Burns consistently — drop new photography into `public/assets/` with the
same filenames and every section updates.

---

## Deployment

1. Set `AUTH_SECRET` (a long random string) and `NEXT_PUBLIC_SITE_URL`.
2. Set `DATABASE_URL`, then `npm run db:migrate`.
3. **Seed real data, not the demo set** — or seed and then clear the demo rows.
4. Rotate every demo credential in `src/lib/auth/demo-credentials.ts`.
5. Optionally set `TELEMETRY_PROVIDER_URL` / `_TOKEN` to go LIVE, and
   `EMAIL_SERVER` / `EMAIL_FROM` for inquiry notifications.
6. `npm run build && npm start`.

`npm run audit` must pass before you ship.

---

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) ·
Tailwind CSS 4 · GSAP 3 · Framer Motion 14 · Recharts 3 · Drizzle ORM · Zod 4 ·
react-hook-form · jose · bcryptjs · lucide-react
