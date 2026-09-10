# LoveMeAfter

A booking + dispatch web app for a local services business running **three lines off one
crew and one dispatch board**:

| Line | Front door | Booking flow | Priced by |
| --- | --- | --- | --- |
| **Landscaping** (the main business) | `/` | `/yard` | flat, per service x yard size |
| Moving | `/moving` | `/book` | hours + miles |
| Junk removal | `/junk-removal` | `/book?job=JUNK_REMOVAL` | hours + miles |

Customers book on the website, a dispatcher assigns the job to a crew member, and the
crew does it with their own vehicle. No native app yet — this is the fastest path to
taking real bookings today; a crew-facing app is a natural next step (see Roadmap).

Every booking carries a `serviceLine` (`src/lib/serviceLines.ts`) that decides which of
its columns mean anything, which flow created it, and how dispatch and the automated
messages talk about it. Rows written before the landscaping pivot read back as `MOVING`,
which is what they were.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Prisma + Postgres.

**The site is night mode throughout** — customer pages, recruiting, booking and
admin. The page colour is a warm near-black (`paper: #14120F`), deliberately
*not* `#000`: a non-OLED phone can't switch pixels off, so pure black renders
as backlight grey and the page looks washed out, and white-on-pure-black also
haloes. Text runs the ramp the other way from a light theme — `ink` brightest,
then `neutral-300` for body, `neutral-400` for muted — and every surface tint
is a white overlay (`bg-white/[0.04]`) rather than the black one a light page
uses. `brand.cyan` was lifted from `#C2760C` to `#E9A83F`; the old amber was
mixed against a near-white page and only managed ~5:1 here, which is thin for
the small mono prices it carries.

Contrast is checked rather than eyeballed — see the note in "Testing" about
compositing translucent layers before measuring.

## What's here

- **`/`** — the home-services page: an address box above the fold, four
  categories, and **"from" prices only**. No exact price is quoted anywhere
  outside the flow — see below for why. Three of the four categories are work
  this company performs; the fourth is a referral (see below).
- **`/contractors`** — the referral path for work requiring a licensed
  contractor. No price, no schedule, no checkout: a request becomes a
  `ContractorLead` and goes out to independent CSLB-licensed contractors.
  **The flow runs inline on this page** (see `src/components/HeroBooking.tsx`):
  the hero *is* the booking form, and the section updates in place as the
  customer advances rather than sending them to another page one answer in.
  Past step one the marketing column steps aside and the form takes the full
  width — someone who has started answering has stopped reading the pitch.
- **`/yard`** — the same flow as its own page, for deep links from city pages,
  ad landing URLs and the service cards. Identical component in both places, so
  the two can't drift:

  1. **Address** — first, so the parcel lookup can take a run at the yard size
     and so the first price anyone sees is already theirs
  2. **Yard size** — pre-selected from the lot lookup when it worked, always
     correctable, no prices on this step
  3. **What it needs** — all four services priced *for that yard*, side by side;
     the recurring one expands to show its cadences and their prices
  4. **Arrival time**
  5. **Contact** → *Request this booking*

  Accepts `?service=`, `?size=`, `?frequency=`, `?address=`, `?lat=`/`?lng=`,
  `?city=` and `?source=`. A service arriving on the query string is remembered
  for step 3 rather than skipping anything — nothing can be priced before the
  yard is known. An **address** does skip step 1: the hero already asked, and
  re-presenting it reads as though the first answer didn't count.

  **The address is asked for as little as possible.** Step 1 needs only a city
  or a ZIP (`isLocatableAddress`) — that's enough to find the county, size the
  yard and price the job. The house number and unit matter to the person
  knocking, not to the price, so they're collected once at the end, on the
  contact step, where the customer has seen a price and decided they want it.
  Demanding them earlier turns a 30-second quote into a form argument with
  someone who hasn't been told a number yet.

  `?lat`/`?lng` carry a real GPS fix from the hero's "use my location". When
  present the flow uses it directly instead of geocoding the address text —
  re-geocoding words we just wrote into a form is how building precision gets
  lost, and the parcel lookup needs the building.

  The customer is told, before submitting and again on the confirmation page and
  in their email: **we call within 30 minutes to confirm and take a deposit**, the
  rest due on completion. So the last step is a request, not a booking.
- **`/landscaping/[city]`** — one landscaping landing page per market, with that
  city's own yard copy and the full price table.
- **`/moving`** — the moving landing page (what used to be the home page).
- **`/junk-removal`** — the junk-removal landing page: load sizes priced off the
  same model `/book` uses, plus what we will and won't take.
- **`/movers/[city]`** — one moving landing page per launch market, meant as Google Ads
  landing pages (see below): `/movers/davis`, `/movers/sacramento`, `/movers/bay-area`.
  Add a city by adding one entry to `src/lib/cities.ts` (with both a `blurb` and a
  `yardBlurb`) — the moving page, the landscaping page and the homepage link all
  follow automatically.
- **`/book`** — the moving/junk booking form with an instant price range; accepts
  `?city=`, `?size=` and `?job=` query params to prefill from a landing page or card
- **`/book/confirmation`** — confirmation screen after a booking is submitted
- **`/manage/[token]`** — the link every booking confirmation/reminder includes; lets a
  customer cancel or request a reschedule without calling in (see "Notifications" below)
- **`/drive`** — recruiting for the **yard crew**: weekly routes, tools
  provided, no vehicle needed. Keeps the `/drive` URL because it's on the
  printed QR cards, `/apply` redirects here, and yard work is the main
  business. Accepts `?city=`, `?role=`, `?source=`.
- **`/drive/moving`** — recruiting for the **moving and hauling crew**:
  bring-your-own-truck at $25–$32/hour, plus the helper path. Junk recruits
  here too — same trucks, same people, same day rate as moving, so a third
  pool would be a distinction the dispatcher never makes.

  The two are separate pages because the pitch genuinely differs. One page
  doing both led with a truck to people who don't own one, and buried the
  thing that actually sells yard work: a recurring route is the same yards on
  the same day every week, which no other gig in this market offers. Each
  application records which page it came through (`DriverApplication.line`),
  so the dispatch board and the lead alerts can tell the two pools apart.
  Shared sections (mission, perks, what-to-expect) live in
  `src/app/drive/RecruitingSections.tsx` so the two can't drift into
  describing different employers.
- **`/admin`** — password-protected sign-in for dispatch
- **`/admin/dashboard`** — dispatch board: see incoming bookings (tagged by service
  line and by city when known — a yard job shows its service, size and cadence; a
  move shows its addresses and size), assign a driver, update status (Pending → Assigned → In Progress →
  Completed/Canceled), review pending driver applicants (Approve turns one into a
  Driver automatically), manage the driver roster

Bookings, drivers, and applications are stored in Postgres via Prisma
(`prisma/schema.prisma`). The `build` script syncs the schema to the database
before `next build`, so there's no separate migration step to run by hand.

That sync goes through `scripts/db-push.mjs` rather than calling `prisma db
push` directly, because the raw command can hang a deploy indefinitely. A
deploy that only changes frontend code finds the schema already in sync and
exits in milliseconds; the first one that actually alters a table runs real
DDL, and an `ALTER TABLE` blocked on a lock held by another connection waits
with **no timeout and no output**. The build log stops after Prisma prints the
datasource line and the deploy dies of old age with nothing saying why. (This
took the site down once — production sat two days stale while every new deploy
timed out silently.) The script closes off all three ways that happens: DDL
always goes to the direct host rather than a pooled one, `lock_timeout` and
`statement_timeout` turn a blocked statement into a real error in seconds, and
a wall-clock kill catches anything that stalls before Postgres is reached.

Set `ALLOW_PARTIAL_DEPLOY=1` to let a failed push through. The site deploys
with a stale schema — every static page works, anything touching a new column
500s — which beats no deploy at all when you need the marketing pages live.

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
| `RESEND_API_KEY`, `NOTIFY_EMAIL`, `NOTIFY_FROM_EMAIL` | Powers every automated email — your lead alerts, and (once `NOTIFY_FROM_EMAIL` is on a verified domain) customer/driver messages too. See "Notifications" below. Leave blank to skip email entirely. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `NOTIFY_PHONE` | Same, for text messages — this is the one that reaches customers and drivers with no extra setup. Leave blank to skip texting entirely. |
| `REVIEW_URL` | Optional review link included in the post-job "thanks for booking" message. |
| `CRON_SECRET` | Required for the day-before reminder cron to run — see "Notifications" below. |
| `NEXT_PUBLIC_SITE_URL` | Optional override for the domain used in links the reminder cron builds. Everything else derives this from the real request and needs no configuration. |

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

Two models, on purpose, because the two businesses sell differently.

### Landscaping — flat, quoted once we know the yard

`src/lib/landscaping.ts` holds one flat price per (service x yard size). A yard-work
customer wants **one number before they'll call anyone**, and the job repeats every
week, so a range would be re-negotiated every visit. Recurring plans discount the
per-visit price: weekly -20%, every-other-week -10%, monthly 0% — monthly is
deliberately *not* discounted, because by week four the grass is as long as a one-off's
and the visit costs the same. Discounting it anyway would be pricing a favour the crew
pays for.

The prices themselves are **business decisions**, not derived numbers. But `COST_MODEL`
in the same file records what each job actually takes (person-hours low/high, crew size,
and the supplies/dump fees that come out before anyone is paid), and the invariant check
asserts that **every** service x size x cadence still clears the crew wage floor at the
*slow* end of its hours estimate:

```
crew payout      = price x (1 - platform rate)
per person-hour  = (crew payout - supplies) / hours.high   >=  $19
```

All 64 combinations pass with room to spare — the tightest is a weekly medium mow at
about $28/person-hour, against a $19 floor. Change a price and that check tells you
whether you just priced a job below what it costs to do. The floor is $19 because that
is the lowest wage `/drive` advertises.

**Where prices are allowed to appear.** Marketing pages say `from $X` and nothing
more; the exact number only shows inside the flow, on the services step, once the
address and yard size are known. The homepage used to publish the whole
size x service grid, which meant the customer picked their own size from a dropdown
and we honoured whatever they guessed — a quote we might have to correct on the
doorstep, which is the one thing a flat-price promise exists to prevent.

### California licensing — what may and may not be sold here

California licenses construction work. Under **B&P 7048** an unlicensed person
may take on minor work below a dollar threshold; past it — and for anything
needing a building permit, or touching electrical, plumbing or structure — the
job belongs to a licensed contractor. **This company is not one.** **B&P 7027.2**
additionally requires that advertising for exempt work say so, which is why the
disclaimer is in the footer of every page and repeated next to the prices.

That boundary is encoded, not just written down:

- `EXEMPTION_LIMIT` in `src/lib/landscaping.ts` is the ceiling. `quoteLandscaping`
  marks any quote reaching it `exceedsExemption`, `bookableServices()` filters on
  that, and the invariant test fails the build if any service × size × cadence
  reaches it. A future price rise therefore takes a service *off* the bookable
  surfaces by itself rather than waiting for someone to notice.
- Referrals live in their own table (`ContractorLead`), not as a flagged
  `Booking`. A Booking is work we perform and take money for; a lead is an
  introduction with no price, crew, schedule or payment. Sharing a table would
  mean every "our jobs" query had to remember to exclude them, and the first one
  that forgot would put unlicensed work on the dispatch board.

**Two things to confirm with a California construction attorney or the CSLB
before relying on the $1,000 figure**, both of which are business facts this
codebase can't check:

1. The $1,000 minor-work exemption (raised from $500 by AB 2622) applies only
   where the work **requires no building permit** *and* the person doing it
   **employs no workers on that project**. This company pays a crew hourly, so
   the employment condition is the one to get advice on — it may put the
   applicable threshold back at $500, which would mean re-pricing.
2. Whether pressure washing, fence/gate repair and sprinkler work as described
   fall inside the exemption in your county, and which of them trigger permits.

Change `EXEMPTION_LIMIT` and the invariant test re-checks every price against
the new number.

### Guessing the yard size — `src/lib/parcel.ts`

County assessors publish parcel polygons (including lot area) as free public ArcGIS
services, so the flow tries to look up the lot behind an address and pre-select a
size. Three things to know before trusting it:

- **A lot is not a yard.** House, driveway and patio come off the top; the module
  deducts a hardscape fraction (or the county's building area where published).
- **It needs the geocode to hit the right building.** Ours often returns
  city-centroid precision, which matches no parcel or somebody else's.
- **Apartments and condos** resolve to one parcel for the whole complex.

So it is an *estimate that pre-fills a question*, never a silent input to a price.
The customer sees the suggestion, sees the lot size it came from, and can change
it — they are standing in the yard and they win. A null result (uncovered county,
slow service, bad geocode) leaves the flow exactly as it was. `toYardSize` returns
null for anything implausible, which is what stops a broken county endpoint from
producing a confident wrong answer rather than no answer.

Covered counties are listed in `COUNTY_SOURCES`; endpoints are public and do change.
**This is the one piece that could not be verified from the dev sandbox** (no
outbound access to the county services), so the failure paths are unit-tested
exhaustively and the happy path needs a real address in production to confirm.

### Moving and junk — built up from cost

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

**"Use my location"** (`UseMyLocationButton`) is offered on *both* ends, on the
homepage hero and on the booking form. Which end is "here" depends on the job —
a Marketplace pickup is at the seller's place and the drop-off is home, a house
move is the other way round — so the customer picks rather than us guessing.

How much it fills is decided per request from the accuracy the phone reports,
not assumed:

| Reported accuracy | Filled | Typical source |
| --- | --- | --- |
| ≤ 60m | house number, street, city, ZIP | outdoor GPS |
| ≤ 150m | street, city, ZIP — no house number | indoors, wifi-assisted |
| worse, or not reported | city and ZIP | desktop wifi, IP geolocation |

A wrong house number presented as a fact is worse than a blank field, so the
button says which of the three happened ("check it's right" vs "add your house
number" vs "add your street") and everything lands in editable fields before
anything is priced.

Neither free source answers the whole question — the Census geocoder knows the
authoritative ZIP but has no street-level reverse endpoint, Photon knows house
numbers from OSM but its US postcodes are patchy — so `/api/reverse-geocode`
asks both and takes the best of each. Coordinates are rounded to the precision
the answer needs: ~1m when chasing a house number, ~110m when the answer is only
a town, so a town-level question never forwards a doorstep to a third party.

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

Last resort is `src/lib/serviceAreaPlaces.ts`, a table of ~150 town centres
covering the full Bay Area ↔ Sacramento ↔ Modesto ↔ Salinas corridor: every
incorporated city in that quadrilateral, plus the unincorporated Greater
Sacramento towns and Delta/foothill communities a geocoder's own database is
thinnest on — Wilton, Rio Vista, Rancho Murieta, Placerville — and the towns
that actually connect the anchors, like Watsonville and Hollister on the
Bay-to-Salinas stretch, and Escalon/Oakdale/Patterson/Los Banos filling in
Modesto ↔ Merced. A Woodland → Sacramento move is about twenty miles whichever
house it starts at, so this still maps the trip and prices the mileage; the UI
labels those results approximate.

## Who shows up

`src/lib/crew.ts` matches a real name and vehicle to the booking before the
customer hands over a phone number — the roster, not the `Driver` table.
Matching is a straight-line radius from each person's home base, currently
**150 miles**: nobody on the roster is city-bound, and the point of a home
base is where someone starts the day, not a fence around where they'll work.
SF to Sacramento is about 70 miles on its own, so at 150 most of the service
area is "nearby" to more than one person — that overlap is deliberate, since
it's what keeps a rural address outside any single town from falling through
to no match at all. Ties within 15 miles of the closest person are broken by a
hash of the job's own coordinates, stable per booking (so the card doesn't
change identity as the page hydrates) and different between bookings (so the
roster actually shares the work instead of one name winning every tie).

Everyone on the roster works both ways: driving their own vehicle when the
booked tier matches what they drive, riding as the second pair of hands
otherwise. Nobody is ruled off a job for owning the wrong truck — the card
says which role it is (`Likely your mover` vs. `Likely on your crew`) rather
than implying they own a vehicle they don't.

**Distance always wins over giving up on it.** We're running ads into a lot of
different places, which means bookings from towns nobody on the roster lives
anywhere near. `matchCrew()` ranks the *entire* roster by real distance and
never drops location, even when nobody is within `CREW_RADIUS_MILES` — there
is no cutoff below which it silently falls back to "any available driver" the
way an earlier version did. That version could show "Bobbin D., based in
Davis" for a Los Angeles booking with a straight face; this one still finds
the closest real person (whoever that is) and is honest about it: the card's
`confident` flag flips the eyebrow from `Likely your mover` to `Closest
available crew`, and softens the closing line to a plain "a dispatcher will
confirm who's covering your move" rather than the normal "a dispatcher
confirms your actual crew when they call." Nothing is ever blocked — the
booking still goes through — but nothing pretends a four-hour drive is a
normal local match either.

**Past `REVEAL_DISTANCE_MILES` (80), the card also stops putting a number on
it.** Knowing a match is real is one thing; being told it's 300 miles away is
another — "confident vs. closest-available" was the honest answer to the
first question, but the specific mileage and home base are still numbers a
customer has no way to interpret, and the wrong read of "308 mi away" is "is
anyone actually coming?" rather than "great, they found someone." So the
distance, the `based in {town}` line, and the roster note (which usually
names a territory, e.g. "Manteca and Stockton" — the same information in a
different field) all disappear once the match is far enough that showing them
would work against the point of showing a name at all. What's still true
stays visible — the vehicle, the role, whether this is a confident match —
just without the specific number that would read as alarming rather than
reassuring.

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

## Knocking doors

Selling on the doorstep needs different tools from selling on a website, so it has
its own two pages behind the dispatch login:

- **`/admin/knock`** — the intake form we fill in *for* the customer while standing
  on their step. One screen instead of the customer flow's five, priced live as you
  tap, with a **Fill from GPS** button that takes the address off the phone's own fix
  — which also gives the parcel lookup the building itself rather than a geocode of
  typed words. It writes an ordinary `Booking` through the ordinary endpoint, tagged
  `source=door-knock`.
- **`/admin/knock/sheet`** — two printable pages: the price grid to quote from, and
  four cut-out leave-behind cards carrying a QR to `/yard?source=door-knock`, the
  phone number, and the licensing disclaimer. Both render from `src/lib/landscaping.ts`,
  so reprinting *is* the update process.

The QR codes are drawn by `src/lib/qr.ts`, a ~200-line byte-mode encoder written
rather than installed — a dependency to draw one glyph isn't worth the supply-chain
surface. It renders to inline SVG at request time (`src/components/QrCode.tsx`),
which it has to: a deposit code carries the amount for the job in front of you, so
it can't be a file committed in advance.

Deposits are taken on the step, before the booking is submitted.
`src/lib/deposit.ts` sizes them — 20% of the first visit, rounded to $5,
floored at $25 and capped at $150 — and `src/lib/payments.ts` builds the link
the customer scans: a Venmo deep link with the amount in it, or an `sms:` link
that opens Messages to us so they can send Apple Cash with the Apple Pay
button. Set `NEXT_PUBLIC_VENMO_HANDLE` and `NEXT_PUBLIC_APPLE_CASH_PHONE`, or
those methods show no code.

Only a signed-in request may record a deposit. The bookings route ignores the
field on a public payload rather than rejecting the booking, and recomputes the
amount from the price it just quoted, so neither a stranger nor a stale form
can write a figure the customer's confirmation would then present as a receipt.
Which it is: these are person-to-person transfers with no processor behind
them, so the confirmation message, the `/manage/<token>` page and the dispatch
chip are the only records that the money moved. Taking real cards (and merchant
Apple Pay) means adding Stripe.

The script, the objection answers, and the permit/disclaimer rules are in
[`docs/door-knock.md`](docs/door-knock.md).

## How recruiting works today

`/drive` collects applications (name, phone, vehicle, city, availability, notes) into
the `DriverApplication` table — separate from the `Driver` table so an unvetted
applicant never shows up in the dispatch driver dropdown. On the dashboard, clicking
**Approve** on a pending applicant creates a matching `Driver` record automatically
(so they immediately show up as assignable) and marks the application `APPROVED`;
**Reject** just marks it `REJECTED`. There's no automated background check or
onboarding step yet — that's still a manual conversation with whoever you approve.

**Tracking which channel works**: add `?source=<value>` to the link you use for
each channel — `/drive?source=...` for a recruiting post, `/book?source=...` for a
customer-facing one — and it shows up as a badge next to that applicant or booking
on the dashboard. Same source list both ways (`src/lib/sources.ts`, add a row for
any new channel), since a channel like Craigslist runs both kinds of posts. For
today's channels:

- QR business card → `https://lovemeafter.com/apply` (redirects to `/drive?source=qr-card#apply` — this is the URL printed on the physical cards/flyers)
- Craigslist recruiting post → `https://lovemeafter.com/drive?source=craigslist`
- Craigslist customer post (labor/moving gigs) → `https://lovemeafter.com/book?source=craigslist`
- Someone refers a friend → `https://lovemeafter.com/drive?source=referral` or `/book?source=referral`

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

## Notifications

**All wired up** (`src/lib/notify.ts`) — not just an alert to you anymore. Every message
below fires automatically off something that already happens in the app; nothing here
needs a separate trigger or a person to remember to send it.

| Who | When | What |
| --- | --- | --- |
| You | A booking or application comes in | Enough detail to call back — name, phone, price, address |
| Customer | Right after they submit `/book` | A receipt (price, date, addresses) with a link to manage their booking |
| Customer | You assign a driver in `/admin` | "Your crew is confirmed," with who's coming |
| Customer | The day before their move (cron) | A reminder, with the same manage link |
| Customer | You mark the booking `Completed` | A thank-you, plus a review link if `REVIEW_URL` is set |
| Driver | You assign them a job in `/admin` | The job's details — text only, the roster has phone numbers, not emails |
| You | Customer cancels or requests a reschedule from their manage link | What they asked for |

Every recipient's channels are independent — a customer with no email on file just gets
texted, a driver only ever gets texted (see the table). With no `RESEND_API_KEY` and no
`TWILIO_ACCOUNT_SID` set, all of it still saves and works exactly as it does today —
nothing gets sent, and you check `/admin` the old way.

**Email**, via [Resend](https://resend.com) — free, no credit card, and no domain setup
needed to start:

1. Sign up, then Dashboard → API Keys → create one with **Sending access** (not
   *Full access* — this key only ever needs to send).
2. Set `RESEND_API_KEY` to that key, and `NOTIFY_EMAIL` to the address you want your own
   alerts sent to. Resend's shared sender (`onboarding@resend.dev`) works with no further
   setup as long as `NOTIFY_EMAIL` is the same address you signed up to Resend with — but
   it *only* delivers to that one address. Customer- and driver-facing email goes nowhere
   until you verify your own domain in Resend and set `NOTIFY_FROM_EMAIL` to an address on
   it. Until then, texting is the channel that actually reaches them.

**Text message**, via [Twilio](https://twilio.com) — a few dollars a month for the
phone number, worth it if you want a phone to actually buzz:

1. Sign up, buy a number, and grab the Account SID and Auth Token from the console home
   page.
2. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (the number you
   bought), and `NOTIFY_PHONE` (your cell, for your own alerts) — all in `.env` or your
   host's env var settings. Numbers need the `+1XXXXXXXXXX` format Twilio uses; customers
   and drivers get texted at whatever number is already on their booking/application/
   driver record, no extra config.

Either way: set the env vars and redeploy, no code changes needed. This repo can't
create the Resend or Twilio account for you — that part's a couple minutes on their
sites — but the moment the keys are in place, everything in the table above starts
firing automatically.

**The reminder cron** (`/api/cron/reminders`, scheduled once daily in `vercel.json`)
needs one more thing: set `CRON_SECRET` to any long random string, so the route can tell
Vercel's actual cron trigger apart from a random request hitting the same URL — without
it, the route refuses to run rather than risk texting customers on an unauthenticated
request. It runs once a day by design: Vercel's Hobby plan caps cron jobs at once a day
each, which is exactly what a day-before reminder wants. A tighter-interval job (say,
"nag me if a lead sits unanswered 30 minutes") wouldn't fit that cap, which is why that
one's handled differently — see the ⚠ age badge on stale `PENDING` items in `/admin`
instead of a push notification for it.

**Manage link**: every booking gets an unguessable `/manage/[token]` page (linked from
the confirmation and reminder messages) where the customer can cancel outright or ask for
a different day/time. A cancellation applies immediately; a reschedule request is logged
and sent to you rather than silently moving the booking — the matched crew's availability
for the new date hasn't been checked, so a dispatcher confirms it the same way the
original booking gets confirmed.

## Roadmap / next steps

- **Real pricing**: the estimate tiers in `src/lib/moveSizes.ts` are placeholders —
  once real jobs come in, tune them or add distance-based pricing (Google Maps
  Distance Matrix / Mapbox).
- **Automated dispatch, the next step**: assigning a driver in `/admin` already texts
  them the job (see "Notifications") — matching who to assign is still a human picking
  from a dropdown. Auto-suggesting the closest active driver (the same radius logic
  `src/lib/crew.ts` uses for the customer-facing match card), or an accept/decline flow
  the driver replies to instead of dispatch assuming they'll show, are the natural next
  steps once volume makes the manual pick tedious.
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
