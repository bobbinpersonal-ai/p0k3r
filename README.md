# p0k3r Moving

A booking + dispatch web app for an on-demand moving marketplace (think Dolly / Lugg):
customers request a move on the website, a dispatcher assigns it to an independent
mover/driver, and the driver handles the move with their own vehicle. No native app yet —
this is the fastest path to taking real bookings today; a driver-facing app is a natural
next step (see Roadmap).

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + SQLite.

## What's here

- **`/`** — marketing landing page (hero, how it works, pricing tiers, CTA)
- **`/movers/[city]`** — one landing page per launch market, meant as Google Ads
  landing pages (see below): `/movers/davis`, `/movers/sacramento`, `/movers/bay-area`.
  Add a city by adding one entry to `src/lib/cities.ts` — the page, sitemap entry, and
  homepage link all follow automatically.
- **`/book`** — customer booking form with an instant price range; accepts `?city=` and
  `?size=` query params to prefill from a city page or pricing card
- **`/book/confirmation`** — confirmation screen after a booking is submitted
- **`/admin`** — password-protected sign-in for dispatch
- **`/admin/dashboard`** — dispatch board: see incoming bookings (tagged by city when
  known), assign a driver, update status (Pending → Assigned → In Progress →
  Completed/Canceled), manage the driver roster

Bookings and drivers are stored in SQLite via Prisma (`prisma/schema.prisma`) — good
enough to launch on a single server today; swap to Postgres later if you outgrow it
(change `provider` and `DATABASE_URL` in `prisma/schema.prisma` / `.env`).

## Run it locally

```bash
npm install
cp .env.example .env      # then edit ADMIN_PASSWORD, NEXT_PUBLIC_SITE_NAME, etc.
npm run db:push           # creates prisma/dev.db and applies the schema
npm run dev                # http://localhost:3000
```

Sign in to `/admin` with the `ADMIN_PASSWORD` you set in `.env`.

## Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file path, e.g. `file:./dev.db` |
| `ADMIN_PASSWORD` | Password for `/admin`. **Change this before going live.** |
| `SESSION_SECRET` | Optional; used to sign the admin session cookie. Falls back to `ADMIN_PASSWORD` if unset — set a separate long random value in production. |
| `NEXT_PUBLIC_SITE_NAME` | Brand name shown in the header, footer, and page titles |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Phone number shown in the header/footer |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads account ID (`AW-XXXXXXXXX`). Leave blank until you have one — nothing loads without it. |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | The conversion action's label (`AbC-D_efG-h123`) from Google Ads > Goals > Conversions. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional GA4 measurement ID (`G-XXXXXXXXXX`), independent of the two Ads vars above. |

## Dropping in your KLING-generated content

The hero section on the landing page (`src/app/page.tsx`) is marked with a comment
(`HERO ASSET SLOT`) around a gradient placeholder — that's where a KLING-generated
hero video or image goes. To use a video:

1. Export your KLING video and put it at `public/hero.mp4` (plus a poster frame at
   `public/hero-poster.jpg`).
2. In `src/app/page.tsx`, replace the placeholder `<section>`'s background with a
   `<video autoPlay muted loop playsInline poster="/hero-poster.jpg">` pointing at
   `/hero.mp4`, keeping the gradient as a fallback behind it.

Any other AI-generated stills (how-it-works icons, background textures, etc.) can go
straight in `public/` and be referenced the same way.

## Deploying today

1. **Domain**: buy it, then point DNS at wherever you host (an `A`/`ALIAS` record for
   the apex, or a `CNAME` for a subdomain like `book.yourdomain.com`).
2. **Hosting** — two easy options:
   - **Vercel** (fastest): connect the repo, set the env vars above in the project
     settings, and it builds/deploys on every push. Swap `DATABASE_URL` to a hosted
     Postgres (Vercel Postgres, Neon, Supabase, etc.) — Vercel's filesystem is
     read-only, so SQLite won't persist there.
   - **Your own server**: `npm install && npm run build && npm start` behind nginx as
     a reverse proxy (with TLS via Let's Encrypt/certbot), process-managed with `pm2`
     or a systemd unit. SQLite is fine here since the file lives on disk with the app.
3. Set real values for `ADMIN_PASSWORD` and `SESSION_SECRET` wherever you deploy —
   don't reuse the ones in `.env.example`.

## How dispatch works today

There's no driver app yet, so dispatch is manual: a booking comes in as `PENDING` on
the dashboard, the dispatcher calls/texts an available driver from the roster (each
driver's phone number is a tap-to-call link), then marks the booking `ASSIGNED` and
picks that driver from the dropdown. Status moves to `IN_PROGRESS` when the crew is
on the job and `COMPLETED` when it's done.

## Setting up Google Ads tonight

The site is built so each launch city has its own landing page — better ad relevance
(headline/page match) than sending every click to the homepage, and each one tracks
which city a lead came from on the dispatch dashboard.

**Final URLs to use as ad destinations**, one per city (swap in your real domain):

- `https://yourdomain.com/movers/davis`
- `https://yourdomain.com/movers/sacramento`
- `https://yourdomain.com/movers/bay-area`

A sensible starting structure: one campaign (or one ad group per city inside a single
campaign) with keywords like "movers in davis", "davis moving company", "same day
movers sacramento", "bay area moving help" — pointed at the matching city page above,
not the homepage.

**Conversion tracking is already wired up** (`src/lib/analytics.ts`,
`src/app/layout.tsx`) — it fires a Google Ads conversion event the moment a booking is
submitted. Nothing loads until you fill in two env vars:

1. In Google Ads: Goals → Conversions → new conversion action → "Website" → get the
   "Tag setup" values. You want the Conversion ID (`AW-XXXXXXXXX`) and the conversion
   label (`AbC-D_efG-h123`).
2. Set `NEXT_PUBLIC_GOOGLE_ADS_ID` and `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` in
   `.env` (or your host's env var settings) and redeploy. No code changes needed.

This repo can't create the Ads account, campaigns, or billing for you — that part's on
the Google Ads side. This just makes sure the site is ready to receive that traffic and
report conversions back the moment the campaign goes live.

## Roadmap / next steps

- **Real pricing**: the estimate tiers in `src/lib/moveSizes.ts` are placeholders —
  once real jobs come in, tune them or add distance-based pricing (Google Maps
  Distance Matrix / Mapbox).
- **Automated dispatch**: SMS the next available driver directly (Twilio) instead of
  manual calls, with accept/decline.
- **Payments**: take a card on booking or on completion (Stripe).
- **Driver app**: a lightweight mobile view for drivers to see and accept jobs
  without going through the dispatcher.
- **Before you scale up volume or drivers**: many states regulate household-goods
  moving *brokers* (a platform that arranges moves performed by others) separately
  from movers themselves — registration, insurance, and contractor-agreement
  requirements vary by state. Worth a quick pass with a lawyer alongside the
  domain/hosting setup, before this is taking real payments at volume.
