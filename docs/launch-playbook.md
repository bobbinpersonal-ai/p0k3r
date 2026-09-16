# Texas launch playbook

Operating from California, selling in Texas, remotely. Five parts: the landing
page, the CRM and calling pipeline, the rep recruiting funnel, the setter
script, and the build order.

Read `docs/trades-and-licensing.md` first — it covers what we sell and the three construction
laws that bind it. This file covers getting in front of people.

---

## Before anything: five filings

None of these are code and all of them gate the business. Do them in week one.

| What | Where | Why |
| --- | --- | --- |
| Foreign qualification | Texas SOS | A California entity doing business in Texas registers or its contracts are hard to enforce and it can't sue to collect. |
| Texas franchise tax account | Texas Comptroller | Follows the registration. |
| City contractor registration | Each metro you sell in | Dallas, Houston, Austin, San Antonio, Fort Worth each permit re-roofs; several require registration before you can pull one. |
| Telephone solicitation registration | Texas SOS | Bus. & Com. Code Ch. 302 requires a certificate and a $10,000 bond for telephone solicitors unless an exemption applies. **Ask the attorney whether you're exempt — don't assume.** |
| National DNC subscription | telemarketing.donotcall.gov | You cannot legally scrub without an account. Budget for it per area code. |

Also: general liability insurance naming you as the contractor, and a W-9
collected from every rep and crew member **before** their first payment.

---

## 1. Landing page — LoveMeAfter.com

### The strategic problem this page solves

A cold-called homeowner is not shopping. They Google you during or right after
the call to decide whether you're real. So this page has one job at the top —
**look like a company that has done this two hundred times** — and one job at
the bottom: **capture consent to contact them**, which is what converts a
stranger into a lead you may legally call and text forever.

### Section breakdown (mobile-first, in order)

**1. Sticky header** — logo left, tap-to-call right. The phone number is the
CTA on mobile; 60%+ of this traffic is a homeowner on a phone mid-conversation.

**2. Hero** — one screen, above the fold, no scroll needed to reach the form.
- Headline, sub-headline, short form (4 fields max), trust strip beneath.
- Background: a real crew on a real Texas roof. Not stock. Not a rendering.

**3. Trust strip** — four items, one line, immediately under the fold line:
years in business, jobs completed, insurance-claim experience, warranty length.

**4. "What we do"** — six cards, one per trade. Roof, siding, windows, gutters,
fence, paint. Each with a one-line benefit, not a feature list.

**5. Storm / insurance block** — the highest-intent segment in Texas. Explains
you work with their carrier, that they pay their deductible and nothing more,
and that you meet the adjuster on site. This section earns its place: it is the
difference between a $600 repair and a $22,000 job.

**6. How it works** — three steps, numbered. Free inspection → written scope and
price → we build it. The word "free" does more work here than anything else
on the page.

**7. Proof** — three reviews with first name, city, and trade. City matters more
than the star rating: "Plano" converts a Plano homeowner.

**8. Financing** — a single line and a logo. Half of residential construction
closes on monthly payment, not price.

**9. Warranty and guarantee** — workmanship warranty in years, manufacturer
warranty named, and what happens if they're not happy.

**10. FAQ** — six questions, accordion. Do I need to be home? What if insurance
denies it? How long does a roof take? Are you licensed? (answer honestly: Texas
doesn't license roofers, here's our insurance and our references.) Do you pull
permits? How soon can you start?

**11. Final CTA** — repeat the form. Same fields, different headline.

**12. Footer** — address, phone, hours, service areas by city name (SEO), and the
consent/privacy links.

### Copy

**Hero headline:**
> Your roof is older than your last three cars.

**Sub-headline:**
> Free inspection, a written price the same day, and a crew that shows up when
> we say. Roofing, siding, windows and fence across North Texas.

*Why this works: it is specific, slightly funny, and it states a fact the
homeowner already suspects. "Quality roofing solutions" says nothing.*

**Alternate hero for storm/insurance traffic** (use on `?utm_campaign=storm`):
> Hail came through. Your neighbours are already filing.

> Free inspection, we document the damage, and we meet your adjuster on the
> roof. You pay your deductible — that's it.

**Form headline:** Get your free inspection
**Fields:** Name · Phone · Address · What needs work (dropdown)
**Button:** Book my free inspection

**Consent line, under the button — this is the most important text on the page:**

> By submitting, I agree that LoveMeAfter and its representatives may call and
> text me at the number provided, including by automated means, about my
> project. Consent is not a condition of purchase. Message and data rates may
> apply. Reply STOP to opt out.

*Keep it a visible sentence, not a pre-ticked box, and store the exact wording,
timestamp, IP and page URL with the lead. That record is the entire defence if
a TCPA claim ever arrives, and it is worthless if you can't produce the version
of the text they actually saw.*

**Trust strip:** Family-run · 1,400+ Texas roofs · We handle the insurance
paperwork · 10-year workmanship warranty

**Trade cards:**
- **Roofing** — Tear-off to final nail in a day, most houses.
- **Siding** — Hardie board that ignores hail and holds paint for fifteen years.
- **Windows** — The reason your August bill is what it is.
- **Gutters** — Seamless, run on site, colour-matched.
- **Fence** — Cedar with steel posts. Outlives the house.
- **Paint** — Wash, scrape, caulk, prime, two coats. Not one.

**Storm block:**
> **Hail or wind damage? Start with the inspection, not the claim.**
>
> We climb the roof, photograph what we find, and give you a written scope. If
> there's a claim worth filing, we'll meet your adjuster up there and show them
> the same damage we showed you.
>
> You pay your deductible. We bill your carrier for the rest. We're roofing
> contractors, not public adjusters — we can't negotiate your claim for you,
> and anyone who offers to is telling you something Texas law doesn't allow.

*That last paragraph converts better than the alternative and is also the only
legal version. It reads as honesty because it is.*

**How it works:**
1. **We inspect, free.** Forty minutes on your roof and around the house.
2. **You get a number, in writing, that day.** Not a range. Not a callback.
3. **We build it.** Material on site, crew on time, site clean every evening.

**Final CTA headline:** Find out what it actually costs.

---

## 2. CRM and pipeline architecture

### The spine

```
 broker list (CSV)
   → import + dedupe + time-zone stamp      LeadList, Lead
   → DNC scrub (national + Texas + internal) DncEntry, Lead.scrubbedAt
   → setter queue, screened per dial         src/lib/texas/calling.ts
   → manual click-to-call                    CallAttempt
   → appointment booked into rep's calendar  Appointment
   → owner assigns / confirms                Lead.repId
   → rep runs it, builds estimate            Estimate, EstimateLine
   → signed + deposit                        Estimate.signedAt
   → crew paid                               Worker, WorkerPayout
```

Every one of those nouns is already a table in `prisma/schema.prisma`.

### Step by step

**1. Buy the list.** Filter on: owner-occupied, single family, roof age 12+
years or year-built 1995–2012, home value $250k–$700k, and the ZIP codes you can
actually reach a crew to. Record vendor and price on the `LeadList` — after
three lists you'll know which broker is worth buying from, and that is worth
more than any script.

**2. Import.** CSV in, one `Lead` per row. Three things happen at import and
each one matters:
- **Normalise the phone to E.164** and write it to `Lead.phoneKey`, which is
  unique. The same homeowner in two lists becomes one lead with one call
  history, not two people ringing them on the same day.
- **Stamp the time zone.** Texas is almost all `America/Chicago`, but El Paso
  is Mountain. The curfew is checked where the phone is.
- **Flag line type** if the broker provides it — and treat it as a guess.

**3. Scrub — before anyone dials.** National DNC, Texas no-call, and your own
internal list. Write `scrubbedAt` on the list and the leads. `screenLead()`
refuses to release a lead that was never scrubbed or whose scrub is over 30 days
old, so this is not a step anyone can skip by being busy.

Budget for losing 20–40% of a purchased list to the scrub. A list that loses
almost nothing was pre-scrubbed, or it wasn't scrubbed at all — find out which.

**4. Work the queue.** The setter opens the queue and sees only leads that pass
every check right now: not on a list, freshly scrubbed, inside Texas calling
hours *in the lead's time zone*, not called today, under six attempts. Blocked
leads show why, with the time the window reopens.

**5. Dial — manually.** Click to call. No predictive dialer, no power dialer,
no ringless voicemail, no prerecorded drops, ever. A purchased list carries no
consent, most households are mobile-only, and the TCPA prices that mistake at
$500–$1,500 per call. `isAutodialable()` exists only to return false.

**6. Log every attempt.** Outcome, notes, and the lead's local time at the
moment of the call. The curfew defence is "it was 2pm where they were", and it
has to be answerable two years later.

**7. Book the appointment.** Set it into the rep's calendar with both the
absolute time and the wall-clock words the customer was told. Two time zones are
in play and only one of them is the customer's.

**8. Confirm twice.** Text at booking, call the morning of. In-home sales lives
and dies on sit rate, and an unconfirmed appointment sits about half as often.

**9. Assign.** You assign leads and appointments to reps by hand — that's the
design. `Lead.repId` and `Appointment.repId`.

**10. Rep runs it.** Measure, price from the book, sell at or above base, keep
60% of the overage. Contract, cancellation notice, deposit.

### Cadence for a worked lead

| Attempt | When | Notes |
| --- | --- | --- |
| 1 | Day 0, late morning | Best answer rate is 10am–11:30am local |
| 2 | Day 1, early evening | 5:30–7pm, different half of the day |
| 3 | Day 3, midday | |
| 4 | Day 7, Saturday morning | Saturdays are legal in Texas from 9am and answer well |
| 5 | Day 14 | |
| 6 | Day 30 | Last one. Then stop. |

One attempt per day, maximum six, enforced in code. "Not interested" is a
callback in 90 days, not a do-not-call. "Take me off your list" **is** a
do-not-call, is permanent, and attaches to the phone number rather than the row.

### Metrics that decide whether this works

Track five numbers per setter per week. Everything else is decoration.

- **Dials per hour** — healthy manual dialling is 18–25.
- **Contact rate** — dials that reached a human. 8–15% on a cold purchased list.
- **Set rate** — contacts that booked. 8–12% is working; under 5% is the script.
- **Sit rate** — booked appointments the rep actually sat. Under 70% is a
  confirmation problem, not a lead problem.
- **Cost per sat appointment** — list cost + setter cost ÷ appointments sat.
  This is the only number that tells you whether to buy the next list.

---

## 3. 1099 sales rep job posting

Post to: Indeed, Craigslist (Dallas / Houston / Austin / San Antonio gigs),
Facebook groups for Texas roofing sales, and r/sales. Repost weekly — this
audience churns and the same ad works again in fourteen days.

> ### In-Home Sales Closer — Roofing & Exteriors (DFW) — Commission Only, Paid Weekly
>
> **We set the appointments. You close them. You keep 60% of everything you sell above our base price.**
>
> We're a Texas home improvement company running roofing, siding, windows,
> gutters, fence and exterior paint. Our setters book the appointments. You show
> up, measure, price it on the spot with our app, and close.
>
> **What you'll actually make**
>
> Our price book gives you a base for every job. You see our cost and our base —
> we don't hide it from you. Sell above the base and **60% of that difference is
> yours.** A 28-square architectural roof bases around $14,700. Sell it at
> $18,000 and you've made $1,980 on one appointment.
>
> Reps who sit 10 appointments a week and close 3 are making real money. Reps who
> sit 4 are not. We'll tell you which one you are inside three weeks.
>
> **What we give you**
> - Pre-set, confirmed appointments with homeowners who agreed to see you
> - A pricing app that does the math at the kitchen table — no callbacks to quote
> - Contracts, financing options and insurance-claim support
> - Paid weekly, by Zelle or Apple Pay, on collected deposits
>
> **What you bring**
> - Your own vehicle, phone and insurance
> - A ladder you're willing to climb, or the sense to know when not to
> - In-home or commission sales experience preferred; the ability to sit at a
>   kitchen table for ninety minutes without checking your phone, required
> - 1099 independent contractor status. You set your own hours and work your own
>   appointments. This is not a salaried job and there is no draw.
>
> **What this is not**
>
> Not a base salary. Not a desk. Not 40 leads a day you have to generate
> yourself. If you need a guaranteed cheque on the 1st, this isn't it, and we'd
> rather tell you now than in week three.
>
> **Apply:** lovemeafter.com/sell — three questions, two minutes. We call the
> same day.

### Why the ad is written this way

- **Comp in the headline.** Commission-only reps filter on comp structure first.
  Burying it wastes both sides' time.
- **A real worked example with real numbers.** Every roofing ad claims "$200k+
  potential". Almost none show the arithmetic. Showing it is the single biggest
  differentiator available in this ad.
- **The disqualifier paragraph.** "What this is not" raises application quality
  sharply. You want fewer applicants and better ones.
- **1099 language that doesn't create a misclassification problem.** Say they set
  their own hours and work their own appointments — because they must, for the
  classification to hold. Don't advertise mandatory morning meetings, a required
  schedule, or a dress code, and then don't impose them. The Texas Workforce
  Commission applies its own test and does not care what the contract is titled.

### Screening, in order

1. **Two-minute application** at `/sell` — name, phone, city, vehicle, sales
   experience, 1099 before yes/no.
2. **Same-day phone screen, 10 minutes.** One question decides most of it: *"Walk
   me through the last thing you sold in someone's house."* Fluency here can't
   be faked.
3. **Video interview, 30 minutes.** You're remote in California; they need to be
   comfortable being managed by phone.
4. **Ride-along** on two appointments before they run one alone.
5. **W-9 and the 1099 agreement before the first appointment**, not before the
   first payment. No W-9, no payout — the software enforces it.

---

## 4. Cold calling script — appointment setters

### Non-negotiables, before the words

- **Manual dial only.**
- **Texas hours, in the homeowner's time zone**: 9am–9pm Monday to Saturday,
  noon–9pm Sunday. The queue enforces it.
- **Identify yourself and the purpose in the first sentence.** The FTC's
  Telemarketing Sales Rule requires your name, the company name, and that this is
  a sales call. This is not optional and it is not a tone choice.
- **"Take me off your list" ends the call immediately.** Confirm it, log it as
  DO_NOT_CALL, thank them, hang up. Permanent, attached to the number.
- **If the call is recorded, ask first and get a yes on the recording.** You're
  calling from California, which is an all-party consent state.

### The script

**Open (TSR-compliant, and short):**
> "Hi, is this [Name]? — [Name], this is **Marcus with LoveMeAfter**, and I'll be
> straight with you, this *is* a sales call about your roof. Can I have thirty
> seconds and then you can tell me to get lost?"

*Naming it as a sales call disarms rather than repels. The homeowner's first
thought is already "this is a sales call"; agreeing with them costs nothing and
buys the next twenty seconds. The permission ask makes the rest feel chosen.*

**Reason for the call (pick the one that's true):**

*Storm:*
> "We've had crews on [Street/neighbourhood] this month — there was hail through
> here in [month] and we're finding damage on about half the roofs we look at,
> including ones that look fine from the driveway. We're doing free inspections
> while we're in the area."

*Age:*
> "Records show your roof is around [X] years old. In Texas that's right about
> when the shingles start giving up — and more to the point, it's right about
> when carriers start looking for a reason to deny a claim on it."

**Qualify — three questions, conversational:**
> "Can I ask — have you had anybody up on the roof in the last couple of years?"
> "Any leaks, any staining on a ceiling, any grit in the gutters?"
> "And you own the home, right? Is it you and your [spouse/partner] making a call
> like this, or just you?"

*That third question is the one setters skip and it is the one that decides the
appointment. An in-home close with one of two decision-makers present is a
one-legged appointment and it will not close. Both, or reschedule.*

**Set the appointment — alternative choice, never "would you like to":**
> "Here's what I'd do. Let me get one of our guys out to look at it — it's free,
> it's about forty minutes, and you'll get a written scope whether there's damage
> or not. I've got **Thursday at 5:30** or **Saturday at 10** — which is easier?"

**Confirm, hard:**
> "Perfect. Thursday the [date] at 5:30, at [full address]. That's [Rep], he'll
> call when he's fifteen minutes out. Two things — I need both you and [spouse]
> there, because he'll have a price for you that night and I don't want you
> having to make a second appointment. And if something comes up, call me on this
> number, don't just leave him standing out there. Fair?"
>
> "I'll text you the confirmation now. What's the best email for the inspection
> report?"

### Objection handlers

**"I'm not interested."**
> "Fair enough — most people aren't until they're standing in the kitchen with a
> bucket. Can I ask, is it that you've already had it looked at, or just that
> you've got seventeen other things going on today?"

*Splits a reflex into a real answer. If they've had it looked at, ask when and
by whom. If it's the seventeen things — "That's exactly why the inspection is
free and takes forty minutes."*

**"How did you get my number?"**
> "Public property records — we work off ownership and build-year data for the
> neighbourhoods we're already in. If you'd rather I take you off our list right
> now, I'll do it and you won't hear from us again."

*Answer honestly and immediately offer the opt-out. Evasion here is what turns
an annoyed homeowner into a complaint — and volunteering it converts better than
you'd expect, because almost nobody does.*

**"Is this a sales call?"**
> "It is. I said so up front — I'm not going to pretend I'm doing a survey."

**"Just mail me some information."**
> "I could, and I'd be lying about it being useful — I can't price a roof I
> haven't seen, so anything I send you is a brochure. The inspection is the
> information. Forty minutes, free, and you get the written scope either way."

**"I need to talk to my wife/husband."**
> "Of course — that's exactly why I want to book a time you're both there rather
> than have you relay it. What evening are you both home?"

*Never let this become "I'll call you back". Convert it into a two-person
appointment on the spot.*

**"I already have a roofer."**
> "Good — most people we end up working for did. Is he the one who's been up
> there since the last storm? … Then keep him. All I'd say is a free second set
> of eyes before you file anything costs you forty minutes, and carriers don't
> pay twice."

**"How much does a roof cost?"**
> "Depends entirely on size and what's under the current one — I've seen this
> neighbourhood run anywhere from twelve to thirty thousand. I'm not going to
> make a number up on the phone; that's what the inspection is for."

*Never quote on the phone. A phone number becomes the ceiling and the rep spends
the appointment defending it.*

**"I don't want to file a claim, my premium will go up."**
> "Worth asking your agent — in Texas, hail is usually an act-of-nature claim and
> it's rated differently to an at-fault one. And either way, knowing whether you
> have damage is free. What you do about it is your call."

*Do not give insurance advice. Point at their agent and move on — Chapter 4102
is a line you don't want to be near.*

**"Take me off your list."**
> "Done — you won't hear from us again. Sorry to have bothered you, have a good
> one."

*Log it. Permanent. No rebuttal. Ever.*

### Voicemail (leave one on attempts 2 and 4 only)

> "Hi [Name], Marcus with LoveMeAfter, 214-555-0148. We're doing free roof
> inspections in [neighbourhood] after the [month] hail. No cost, no obligation.
> 214-555-0148. Thanks."

*Under 15 seconds. Number twice. No pitch.*

---

## 5. Technical execution plan

### What's already built in this repo

| Piece | Where |
| --- | --- |
| Price book, cost and base per measure | `src/lib/texas/trades.ts` |
| 60%-of-overage commission, floor enforced | `src/lib/texas/commission.ts` |
| Deductible ban, adjuster line, RCLA, 3-day cancel | `src/lib/texas/compliance.ts` |
| DNC / curfew / attempt screening, manual-dial rule | `src/lib/texas/calling.ts` |
| Leads, reps, estimates, appointments, payouts | `prisma/schema.prisma` |
| Admin auth, notifications, QR, deposits, contracts | inherited from the California build |

### Stack

Keep what's here. It is already Next.js 14 + Prisma + Postgres on Vercel with
admin auth, transactional email, deposit capture by Zelle/Apple Cash, and PDF
contracts with statutory cancellation notices. That last one took real work and
is directly reusable.

**Add four services, in this order:**

1. **Twilio** — Programmable Voice for click-to-call, a local Texas number per
   market for caller ID, and Programmable Messaging for confirmations. Use
   `<Dial>` with `callerId` set to the local number. Do **not** enable any
   autodial feature.
2. **A DNC scrub provider** — PossibleNOW, Contact Center Compliance, or Gryphon.
   Nightly batch, plus a real-time check before a number is released to the
   queue. The FTC's own registry access is required regardless.
3. **Cal.com** (self-hostable, API-first) or Google Calendar API for rep
   availability and booking. Cal.com is the faster path: per-rep schedules, buffer
   time, and a webhook you can write an `Appointment` from.
4. **Financing** — GreenSky, Hearth or Acorn. This is a link and a phone number
   in v1, not an integration. It still lifts close rate materially.

Optional later: Stripe (card deposits with actual chargeback protection, unlike
Zelle), and Twilio Lookup for line-type checks.

### Build order

**Week 1 — ingest and screen.**
- `POST /api/texas/lists` — CSV upload → `LeadList` + `Lead` rows, E.164
  normalisation, time-zone stamping, dedupe on `phoneKey`.
- `POST /api/texas/scrub` — batch to the scrub vendor, write `DncEntry` rows,
  stamp `scrubbedAt`.
- `/admin/tx/lists` — upload, see scrub results, see loss rate by vendor.

**Week 2 — the dialer.**
- `GET /api/texas/queue` — next callable lead for a setter, running
  `screenLead()`. Blocked leads never leave the server.
- `/admin/tx/dial` — one lead on screen, the script beside it, outcome buttons,
  and a click-to-call button that hits Twilio.
- `POST /api/texas/attempts` — log outcome, notes, and the lead's local time.
- Objection handlers on screen, collapsed, one tap to open.

**Week 3 — appointments.**
- Booking against rep availability, writing `Appointment`.
- Confirmation SMS at booking and 9am on the day.
- `/admin/tx/board` — the owner's view: leads by status, assign to reps, today's
  appointments, sit rate by setter.

**Week 4 — the rep's tool.**
- `/tx/appointment/[id]` — measure, pick options, see cost/base/commission move
  live as the price changes, refuse below base.
- Contract generation reusing the California agreement machinery, with the Texas
  notices from `compliance.ts`.
- Deposit at the table — Venmo/Zelle/Apple Cash QR, already built.

**Week 5 — the money.**
- `/admin/tx/payouts` — commission owed by rep, crew payouts by job, W-9 gate,
  running annual totals for 1099-NEC.

**Week 6 — the landing page and the rep funnel.**
- `/` (or `tx.lovemeafter.com`) with the copy above.
- `/sell` — the rep application.
- Consent capture stored with wording, timestamp, IP and URL.

### The one architectural rule

**Every dial goes through `screenLead()` server-side.** Not in the UI, not as a
warning, not as a checkbox a tired setter can tick at 8:55pm. The queue endpoint
never returns a lead that fails screening, so the only way to dial someone
you shouldn't is to look them up by hand — which is a decision somebody makes,
rather than an accident the software allowed.

### Environment variables to add

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_CALLER_ID_DFW=
TWILIO_MESSAGING_SERVICE_SID=
DNC_SCRUB_API_KEY=
DNC_SCRUB_ACCOUNT=
CALCOM_API_KEY=
NEXT_PUBLIC_TX_PHONE=
NEXT_PUBLIC_TX_COMPANY_NAME=
```

### Two risks worth naming

**`scripts/db-push.mjs` runs `prisma db push --accept-data-loss` on every
deploy.** That was the right call when a stuck migration took production down
for two days, and it means a future schema change that drops a column will drop
it silently in production. Before this database holds signed contracts and
payout history, move to real migrations (`prisma migrate deploy`).

**Zelle and Apple Cash have no chargeback protection and no processor
receipts.** Fine for deposits at this size, and worth revisiting before you're
taking five-figure deposits at kitchen tables.

---

## Open questions for counsel

Beyond the construction items in `docs/trades-and-licensing.md`:

1. **Ch. 302 telephone solicitation registration** — required, or exempt?
   $10,000 bond if required.
2. **1099 classification of setters and closers**, under the TWC's test rather
   than the contract's title.
3. **Call recording from California into Texas.** This codebase assumes
   all-party consent. Confirm that's the right reading for your setup.
4. **The consent language on the landing page**, which is what makes an inbound
   lead legally callable.
