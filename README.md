# p0k3r Moving

A booking + dispatch web app for an on-demand moving marketplace (think Dolly / Lugg):
customers request a move on the website, a dispatcher assigns it to an independent
mover/driver, and the driver handles the move with their own vehicle. No native app yet —
this is the fastest path to taking real bookings today; a driver-facing app is a natural
next step (see Roadmap).

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + Postgres.

## What's here

- **`/`** — marketing landing page (hero, how it works, pricing tiers, CTA)
- **`/movers/[city]`** — one landing page per launch market, meant as Google Ads
  landing pages (see below): `/movers/davis`, `/movers/sacramento`, `/movers/bay-area`.
  Add a city by adding one entry to `src/lib/cities.ts` — the page, sitemap entry, and
  homepage link all follow automatically.
- **`/book`** — customer booking form with an instant price range; accepts `?city=` and
  `?size=` query params to prefill from a city page or pricing card
- **`/book/confirmation`** — confirmation screen after a booking is submitted
- **`/drive`** — recruiting page for prospective movers/drivers (flexible-schedule,
  bring-your-own-vehicle pitch) with an application form; accepts `?city=`
- **`/admin`** — password-protected sign-in for dispatch
- **`/admin/dashboard`** — dispatch board: see incoming bookings (tagged by city when
  known), assign a driver, update status (Pending → Assigned → In Progress →
  Completed/Canceled), review pending driver applicants (Approve turns one into a
  Driver automatically), manage the driver roster

Bookings, drivers, and applications are stored in Postgres via Prisma
(`prisma/schema.prisma`). The `build` script runs `prisma db push` before
`next build`, so the schema syncs to the database automatically on every
deploy — no separate migration step to run by hand.

## Run it locally

Local dev needs a real Postgres database (a free one on
[Neon](https://neon.tech) or [Supabase](https://supabase.com) works fine, or
Postgres running in Docker) — there's no zero-config file-based option now
that this runs on Postgres instead of SQLite.

```bash
npm install
cp .env.example .env      # then edit DATABASE_URL, ADMIN_PASSWORD, etc.
npm run db:push           # applies the schema to your database
npm run dev                # http://localhost:3000
```

Sign in to `/admin` with the `ADMIN_PASSWORD` you set in `.env`.

## Environment variables (`.env`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled Postgres connection string. On Vercel with Neon connected via Storage, this is added for you automatically. |
| `DATABASE_URL_UNPOOLED` | Direct (non-pooled) Postgres connection string, used only for `prisma db push`. Also auto-added by the Neon integration. |
| `ADMIN_PASSWORD` | Password for `/admin`. **Change this before going live.** |
| `SESSION_SECRET` | Optional; used to sign the admin session cookie. Falls back to `ADMIN_PASSWORD` if unset — set a separate long random value in production. |
| `NEXT_PUBLIC_SITE_NAME` | Brand name shown in the header, footer, and page titles |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Phone number shown in the header/footer |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Support email shown in the footer. Defaults to `hello@lovemeafter.com`. |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Google Ads account ID (`AW-XXXXXXXXX`). Leave blank until you have one — nothing loads without it. |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | The conversion action's label (`AbC-D_efG-h123`) from Google Ads > Goals > Conversions. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional GA4 measurement ID (`G-XXXXXXXXXX`), independent of the two Ads vars above. |

## Visuals

Real photos are in place today, in `public/images/`:

- `box-truck-road.jpg` — homepage hero (`src/app/page.tsx`)
- `mover-cart.jpg` — `/drive` recruiting hero (`src/app/drive/page.tsx`)
- `van-loaded.jpg` — city-page community section (`src/app/movers/[city]/page.tsx`,
  currently only shown on the Davis page)

To swap any of these for a different photo, replace the file in `public/images/` (keep
the same filename) or update the `src` on that page's `<Image>`. To upgrade the
homepage hero to a looping video instead: export it to `public/hero.mp4` (plus a
poster frame at `public/hero-poster.jpg`), then swap that section's `<Image>` for a
`<video autoPlay muted loop playsInline poster="/hero-poster.jpg">` pointing at
`/hero.mp4`.

### Generating visuals with KLING

There's also a lightweight hand-built placeholder already live: `src/components/FleetIcons.tsx`
renders three animated flat-icon vehicles (box truck, van, pickup) on the homepage and
`/drive` page. It works fine as-is, but the prompt below will get you a more polished,
on-brand animated version to swap in.

**Prompt — animated fleet (box truck, van, pickup):**

> A short seamless-looping animation of a box truck, a cargo van, and a pickup truck,
> each driving left to right across a plain background, shown as three separate clips
> (one per vehicle). Flat 2D vector illustration style — cartoonish but professional
> and modern, like friendly startup branding rather than a kids' show. Bold rounded
> shapes, soft cel shading, clean thin outlines, no text or logos on the vehicles.
> Color palette: indigo/violet (#6366f1) and cyan (#22d3ee) as the vehicle body colors,
> dark charcoal (#0d0f18) for wheels and shadows, transparent or solid near-black
> (#05060a) background. Wheels rotate, gentle suspension bounce as it drives, smooth
> easing, no camera shake or camera movement. 4–6 second loop, 16:9, no watermark.

**Prompt — people moving, no faces:**

> A short video of a person carrying a cardboard moving box down porch steps toward a
> parked moving truck, shot from behind or cropped at the shoulders so no face is ever
> visible — this is a hard requirement, not a suggestion. Casual moving-day clothing
> (t-shirt, work gloves), warm natural daylight, a real-feeling residential street or
> apartment stairwell in the background, softly out of focus. Tone: professional and
> energetic, not a stiff corporate stock photo. Slight handheld camera movement or a
> slow tracking shot following the box. Cool color grade with a hint of indigo/cyan in
> the background truck or signage to match the site's palette. No legible text or
> logos on clothing, boxes, or the truck.

Regenerate per city if you want local flavor (e.g. add "UC Davis dorm move-out,
cardboard boxes and a mini-fridge on a hand truck" to the people-moving prompt for the
Davis page) — just keep the "no faces" constraint in every variant.

## Deploying today

1. **Domain**: `lovemeafter.com` is currently pointed at Shopify. Repointing its DNS
   (an `A`/`ALIAS` record at the apex, or a `CNAME` on a subdomain) to wherever this
   app is hosted takes the domain **away** from that Shopify store — the two can't
   both live at the bare domain at once. If you want to keep that Shopify store
   reachable too, put it on a subdomain (e.g. `shop.lovemeafter.com`) and point the
   apex at this app instead, or vice versa.
2. **Hosting** — already set up on Vercel (repo connected, Neon Postgres attached via
   Storage, deploys on every push to `main`). To self-host elsewhere instead:
   `npm install && npm run build && npm start` behind nginx as a reverse proxy (with
   TLS via Let's Encrypt/certbot), process-managed with `pm2` or a systemd unit —
   `DATABASE_URL`/`DATABASE_URL_UNPOOLED` still need to point at a real Postgres
   instance either way.
3. Set real values for `ADMIN_PASSWORD` and `SESSION_SECRET` wherever you deploy —
   don't reuse the ones in `.env.example`.

## How the booking flow works

`/book` is a six-step wizard, one step on screen at a time with a progress bar:

1. **What do you need** — one tap from a short list of the jobs we do
2. **Addresses** — street, city and ZIP for the pickup, then where it goes
3. **Pick your truck** — the route on a map, plus a priced card per vehicle tier
4. **Arrival time** — day chips and one-hour arrival windows
5. **Anything we should know** — free-text description, helper yes/no
6. **Personal info** — name, phone, optional email, then submit

**Step 1 leads because of where the traffic comes from.** Most paid traffic is
Facebook Marketplace ads, so the first thing on screen has to be the customer's
own errand — "Marketplace pickup", "Need a hand" — not a form asking where they
live. It also earns its slot rather than just adding one: each job in
`src/lib/serviceTypes.ts` carries a `defaultDropoffMode` and sometimes a
`defaultMoveSize`, so answering it means "Need a hand" is never asked for a
drop-off address and a single-item pickup is never asked how many bedrooms.

Six jobs show by default and the rest sit behind "More options" — a first screen
people scan in two seconds beats a complete one they read none of. The homepage
hero shows the same six as chips linking to `/book?job=…`, which lands on step 2
with step 1 already answered.

The whole draft lives in `BookingFlow.tsx`, so stepping backwards never loses what
was already entered. Each step validates before it lets you advance.

**Going back** works three ways, and all of them keep the draft: the labelled
Back button, tapping any completed segment of the progress bar, and the
browser's own back button or a phone's back gesture. That last one matters most
— the wizard lives at a single URL, so without history entries a back swipe used
to leave the site and discard everything typed. Each step pushes an entry
carrying `bookingStep` (spread onto Next's own history state, not replacing it).
One step back calls `history.back()` so the button and the gesture stay
interchangeable; jumping several steps pushes instead, because the step delta
and the history depth drift apart once someone has used the browser's own back
and forward, and guessing wrong navigates them off the page.

**Prices are withheld until they're final.** The vehicle cards can render before
the route has been measured, and a price without mileage isn't a smaller price —
it's the wrong one. Showing it and then revising it upward is the most alarming
thing this screen can do, so while the route is loading the cards show a
placeholder and can't be selected.

Arrival windows come from `src/lib/arrivalWindows.ts`, which drops today's slots as
they pass (plus a two-hour lead-time buffer) and rolls the picker to tomorrow once
the day is used up. Date keys are local `YYYY-MM-DD` and the API pins them to local
noon — parsing a bare date string as UTC would land a Sunday booking on Saturday in
dispatch and send a crew a day early.

**Two things Lugg's version does that this doesn't yet**, both because they need a
service that isn't wired up: photo upload of the items (needs a blob store) and
phone verification by one-time code (needs an SMS provider). The description field
covers the first well enough for dispatch, and a dispatcher calling to confirm is
the real verification today.

## Jobs that aren't moves

Not every booking has two addresses. A dump run, a donation drop, or two people
helping load a container already in the driveway has one — and demanding a
second was the fastest way to lose those customers.

`src/lib/dropoffModes.ts` splits them by what the *crew vehicle* does, since
that is what the price hangs on:

| Mode | Second address | Priced as |
| --- | --- | --- |
| `ADDRESS` | required | the measured route |
| `SAME_PLACE` | none | crew time only, zero miles |
| `WE_CHOOSE` | none | a typical local run (`LOCAL_RUN_MILES`) |

Collapsing the last two would mean either charging on-site jobs for a drive
that never happens, or paying a driver nothing for the run to the dump. Dump
and donation fees are explicitly *not* included — a dispatcher confirms those.

`Booking.dropoffAddress` is nullable as a result; `Booking.dropoffMode` records
which kind of job it was, and the client writes a readable label
("Same address — on-site job") so dispatch never reads a blank field.

## Pricing

`src/lib/pricing.ts` prices a job from what it costs to do it, rather than from a
flat table:

```
crew payout   = (labor hours + drive time) x crew hourly + vehicle allowance x miles
customer pays = crew payout / (1 - platform rate)
```

The crew rates in that file are **not free parameters** — they are the wages
`/drive` advertises to applicants ($25/$28/$32 an hour driving a pickup/van/box
truck, $19 an hour helping). Change one and you must change the other, or the
site is promising a wage the price can't cover. The platform take is 25%, out of
which come insurance, card processing, support and marketing; the job minimum is
$79; prices round **up** to the next $5, because rounding to the nearest one can
shave the crew's share below the wage it was derived from.

Drive time is paid crew time, so it goes into the hours and not just the mileage.
The vehicle allowance is paid on 1.6x the route distance, since a driver has to
reach the pickup and get home again — their *time* for that deadhead isn't paid
yet, which is the first thing to revisit once real long-distance jobs come in.

Job durations in `LABOR_HOURS` are still estimates. Calibrate them against real
completed jobs before spending much on ads pointed at this page — they drive
every number the customer sees.

## Addresses and the map

The form asks for street, city and ZIP as **separate fields** rather than one
free-text line, and that is a deliberate accuracy decision: the US Census
geocoder has a structured endpoint that matches the parts against TIGER/Line
address ranges, and it lands on the building far more often than any parser
guessing where the street name ends. It is free, keyless and needs no signup, so
this works on a fresh deploy with nothing configured.

There is no autocomplete dropdown. Good suggestions need a paid Google Places
key; the keyless ones were confidently wrong often enough to be worse than
typing, and a customer who picks the wrong "Lee Ct" gets priced for the wrong
trip without ever knowing.

The homepage hero still takes one box per address — eight inputs above the fold
would cost more bookings than a tidy address is worth. `parseAddress()` in
`src/lib/address.ts` splits what they typed into the booking form's fields,
where they can correct it before anything is priced.

Three API routes do the lookups, each trying providers in order of accuracy and
falling through on failure, not just on missing config:

| | `GOOGLE_MAPS_API_KEY` | `MAPBOX_TOKEN` | No key |
| --- | --- | --- | --- |
| `/api/geocode` (address → coordinates) | Google Geocoding | Mapbox | **US Census** (structured, then one-line), then Photon, then town centre |
| `/api/reverse-geocode` (coordinates → city + ZIP) | Google | Mapbox | **US Census** geographies, then Photon, then nearest town |
| `/api/directions` (distance + route line) | Google Directions | Mapbox | OSRM, then straight-line estimate |

**"Use my location"** (`UseMyLocationButton`) fills the city and ZIP and never
the street, on the homepage hero and on the booking form's pickup. That is a
deliberate limit, not a missing feature. A GPS fix indoors is routinely off by a
building, so a reverse-geocoded street line is a guess presented as a fact —
and someone tapping a convenience button hasn't asked us to record where they
are standing. Coordinates are rounded to three decimals (~110m) on the device
*and* again on the server before any third party sees them, and
`/api/reverse-geocode` returns nothing but a city and a ZIP.

Location is never requested on page load, only on a tap: an unprompted
permission dialog gets denied reflexively, and a denial is sticky. Every failure
path — denied, unsupported, geocoder down — ends with a short line of text and a
form the customer can still type into.

A Google key is an upgrade, not a dependency, and it needs a Cloud account with
billing **active** — a key created while payment is pending answers
`REQUEST_DENIED`. That case is handled: a configured-but-failing provider is
skipped and the free tiers still run, with the reason logged
(`[geocode] ...`/`[places] ...`) so it's diagnosable from the deploy logs.

**Do not put an HTTP-referrer restriction on the key.** It is read only inside
the API routes (no `NEXT_PUBLIC_` prefix), so it never reaches the browser and
server-side calls send no referrer — a domain restriction would deny every
request. Restrict it by **API** instead (Geocoding and Directions only) and cap
spend with a billing budget plus per-API daily quotas.

Last resort is `src/lib/serviceAreaPlaces.ts`, a table of ~55 town centres from
the Bay Area through the Sacramento Valley and down the 99. A Woodland →
Sacramento move is about twenty miles whichever house it starts at, so this
still maps the trip and prices the mileage; the UI labels those results
approximate.

Nothing here is allowed to block a booking. If every geocoder misses, the trip is
measured town to town and the UI says so; if routing fails the quote drops the
mileage component and the map draws a dashed line instead of the real route. A booking made that way
just lands in dispatch without coordinates — `Booking.pickupLat` and friends are
nullable exactly so you can tell a mapped job from a hand-typed one.

Map tiles are OpenStreetMap, loaded in the visitor's browser, so they need no key
and no server-side call.

## How dispatch works today

There's no driver app yet, so dispatch is manual: a booking comes in as `PENDING` on
the dashboard, the dispatcher calls/texts an available driver from the roster (each
driver's phone number is a tap-to-call link), then marks the booking `ASSIGNED` and
picks that driver from the dropdown. Status moves to `IN_PROGRESS` when the crew is
on the job and `COMPLETED` when it's done.

## How recruiting works today

`/drive` collects applications (name, phone, vehicle, city, availability, notes) into
the `DriverApplication` table — separate from the `Driver` table so an unvetted
applicant never shows up in the dispatch driver dropdown. On the dashboard, clicking
**Approve** on a pending applicant creates a matching `Driver` record automatically
(so they immediately show up as assignable) and marks the application `APPROVED`;
**Reject** just marks it `REJECTED`. There's no automated background check or
onboarding step yet — that's still a manual conversation with whoever you approve.

**Tracking which recruiting channel works**: add `?source=<value>` to the `/drive`
link you use for each channel and it shows up as a badge next to each applicant on
the dashboard. Recognized values live in `src/lib/sources.ts` — add a row there for
any new channel. For today's channels:

- QR business card → `https://lovemeafter.com/apply` (redirects to `/drive?source=qr-card#apply` — this is the URL printed on the physical cards/flyers)
- Craigslist post → `https://lovemeafter.com/drive?source=craigslist`
- Someone refers a friend → `https://lovemeafter.com/drive?source=referral`

Combine with `city` if you know it going in, e.g. `?source=qr-card&city=davis`.

## Setting up Google Ads tonight

The site is built so each launch city has its own landing page — better ad relevance
(headline/page match) than sending every click to the homepage, and each one tracks
which city a lead came from on the dispatch dashboard.

**Final URLs to use as ad destinations**, one per city (swap in your real domain):

- `https://lovemeafter.com/movers/davis`
- `https://lovemeafter.com/movers/sacramento`
- `https://lovemeafter.com/movers/bay-area`

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
- **Payments (customer-facing)**: take a card on booking or on completion (Stripe).
- **Same-day pay (driver & helper-facing)**: `/drive` now advertises this as live —
  paid out by 5pm (or sooner) every day worked, sent via Zelle, Venmo, or Apple Pay. This is a
  manual process today (the dispatcher sends each payment by hand at the end of the
  day) — there's no in-app payout automation, and none is needed for this to be a
  real, honest promise. If volume grows past what's manageable by hand, a payout
  provider (Stripe Connect or similar) would automate the sending, but that's a scale
  problem to solve later, not a blocker to making the promise now.
- **Driver app**: a lightweight mobile view for drivers to see and accept jobs
  without going through the dispatcher.
- **Before you scale up volume or drivers**: California requires a permit (a "Cal-T"
  number from the CPUC) for household goods carriers — moving people's belongings for
  pay, intrastate. That's on top of the general moving-broker point above. Worth
  confirming exactly what a marketplace connecting customers to independent movers
  needs, registration-wise, before this is taking real payments at volume.
- **Junk removal / disposal services**: this is a *different* regulated activity from
  moving — most CA cities run exclusive or semi-exclusive franchise agreements for
  solid waste collection under their municipal code, so "we'll haul it away and dump
  it" needs a city-by-city check (call each city's public works / solid waste
  division) before advertising it, separate from any moving permit. Certain items
  (e-waste, batteries, appliances with refrigerant, tires, paint) also can't go to a
  normal landfill under CA law regardless of who hauls them. Donation runs (Goodwill,
  Habitat ReStore) are a materially different — and generally lower-friction —
  posture than "we take it to the dump," and a reasonable first version of this
  service before doing the full disposal-license legwork.
