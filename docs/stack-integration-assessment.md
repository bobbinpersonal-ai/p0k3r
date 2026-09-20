# Stack integration: assessment against what exists

A proposed architecture (GoHighLevel + Twilio power dialer, offshore intake,
Jobber/Housecall Pro, WiseTack/Hearth, Stripe Connect escrow, PandaDoc) was
put to this codebase on 2026-09-20. This is the audit of that proposal against
what is actually built and what the compliance rules actually allow.

**Headline: about 70% of the proposal already exists here, three parts of it
would break rules this business has deliberately written down, and one part is
genuinely missing and worth building immediately.**

Read `CLAUDE.md` first. This file only covers the delta.

---

## 1. The proposal was written against stale documentation

Two tells, both traceable:

- *"Audit existing code repository to remove legacy single-state
  configurations."* There is no single-state configuration. `REGIONS` in
  `src/lib/regions/states.ts` has carried five states — CO, MO, KS, IN, WY —
  for some time. `grep` for `TX_ONLY|SINGLE_STATE|onlyState` returns nothing.
- *"Auto-qualify based on location (TX, FL, CO, MO, IN, OH, CA)."* That list
  adds Texas, Florida, Ohio and California and **drops Kansas and Wyoming**,
  which are live markets with licensing rules already encoded (Kansas roofers
  must be registered with the Attorney General; that is in `states.ts`).

Both match the Texas era that `docs/` still describes. `CLAUDE.md` §7 warns
about exactly this: **treat `docs/` as history, not instructions.** Anything
generated from those files will describe a business that no longer exists.

**Action: none, unless a human actually wants to enter TX/FL/OH/CA and exit
KS/WY.** That is a market decision, not a refactor.

---

## 2. Already built — do not rebuild

| Proposal | Already exists |
|---|---|
| CRM pipeline, lead stages | `Lead` → `Estimate` → `Payment`; `/admin/network/pipeline` |
| Estimates, on-site quoting | Field estimator at `/crew/jobs/[id]` — measure, price off the book, sell, sign, collect |
| Crew tracking / portal | `Worker` + `WorkerSession`, crew portal with logins |
| Job scheduling / dispatch board | `/admin/network/crews`, `/admin/dashboard` |
| Call tracking, dispositions | `CallAttempt`, `PartnerCall`, `dispositions.ts` |
| Power-dialer-style call queue | `/admin/desk` (homeowners), `/admin/network/recruit` (B2B, next-call flow, 8-touch cadence) |
| Subcontractor + HIS agreements | `crewAgreement.ts`, `channelPartnerAgreement.ts`, `repAgreement.ts` — generated per party, versioned |
| Recruiting funnels | `/partners` (crews), `/channel-partners` (list partners), `/apply` |
| Payout ledgers with gating | `WorkerPayout`, `ChannelPartnerPayout`, `/api/admin/crew-payouts` |
| Financing payment rail | `FINANCING` in `payments.ts`; `FINANCING_PARTNER` in `brand.ts` |

Adopting GHL + Jobber does not add these. It **replaces** them, and in doing
so moves the price book, the margin floor, the payout gates and the published
partner working out of code we control and into two SaaS products that do not
know about any of it. That is a strategy decision with a real cost, not an
integration task. See §5.

---

## 3. Three parts conflict with non-negotiables

### 3.1 The power dialer — refused

> *"Auto-add leads that don't opt-out to the 24/7 Philippines Intake Power
> Dialer Queue."*

`CLAUDE.md` §3.1 and `isAutodialable()` in `calling.ts`, which returns `false`
by construction:

> Manual dial only. No predictive or power dialer, no prerecorded messages, no
> ringless voicemail. Purchased lists carry no consent, and the TCPA prices a
> mistake at $500 to $1,500 per call.

A power dialer calling consumer mobiles from an aged list is the single
highest-liability thing in this document. Per-call statutory damages, trebled
for wilfulness, with no cap and an active plaintiffs' bar. **Not built.**

**What to do instead:** the offshore team works `/admin/desk`, which is a
manual click-to-dial queue that already exists, already logs every attempt
with the lead's local time (the curfew defence), and already enforces attempt
caps and DNC screening. Same throughput benefit, none of the exposure.

### 3.2 Bulk SMS drip to an aged list — refused as specified

> *"Trigger: bulk CSV upload. Trigger two-step SMS/Email drip."*

Marketing texts need prior express written consent from the person being
texted. A CSV of aged leads does not carry it, and "they were a lead once" is
not consent for a text campaign two years later. Separately this bypasses
`mayDial()` in `warmup.ts`, the gate whose entire job is stopping cold contact
with people who came off a partner's list.

**What to do instead:** email is a different regime (CAN-SPAM — no prior
consent needed, just honest headers and a working unsubscribe). Run the
re-engagement by email, and let a reply promote the lead into the manual dial
queue. That is lawful, it is most of the value, and the warm-up machinery for
it already exists.

### 3.3 "Escrow" on Stripe Connect — refused as described

> *"Funds are locked in a Holding/Escrow Account until milestone completion."*

Two problems. Stripe Connect is not an escrow service and Stripe's own terms
prohibit describing it as one; holding third-party money pending a condition
is what money-transmitter licensing regulates, state by state. And it
contradicts the actual legal posture: **LoveMeAfter is the general contractor**
— it holds the homeowner contract, carries the warranty and the insurance, and
pays subcontractors out of its own funds. There is no third party's money to
escrow. Calling it escrow invites a homeowner to argue the money was never
ours to spend.

**What to do instead:** Stripe Connect with **delayed payouts and separate
charges and transfers** does everything wanted here — collect the deposit,
hold the balance, transfer to the contractor on completion, retain the margin
— without the word "escrow" or the licensing question. That is a labelling
fix, not an architecture change.

### 3.4 Milestone split payouts — conflicts with the recruiting promise

> *"50% upon material delivery / 50% upon final customer sign-off."*

The subcontractor agreement says the opposite, deliberately: **paid in full,
no retainage, within 3 days** of completion, sign-off and lien waiver. That
three-day term is the strongest thing on the crew recruiting page and it is
the answer to the defining grievance of the trade. Splitting it into two
conditional halves is a pay cut in everything but name, and the crews will
read it that way.

Keep 3-day-full-payment as the standard. If a large job needs a material
draw, make it an exception with its own clause, not the default.

---

## 4. Genuinely missing — one is now built

### 4.1 Point-of-sale financing — BUILT

The `FINANCING` rail and `FINANCING_PARTNER` already existed; the arithmetic
and the disclosure did not, so nothing could show a homeowner a payment.

- `src/lib/regions/financing.ts` — plans, amortisation, quoting, disclosure.
- `src/components/FinancingCalculator.tsx` — payment, APR and term together,
  with a down-payment slider and the lender handoff.

**The brief asked for a button reading "As low as $89/mo". That exact pattern
is the Regulation Z violation the rule exists for.** Under 12 CFR 1026.24 the
amount of a payment is a *triggering term*: state one and you must also state
the down payment, the repayment terms and the APR, in the same advert, with
equal prominence. It is the most common violation in home improvement
advertising. So the component renders payment, APR and term in one row at one
type scale, with the disclosure directly under it.

It also will not invent an APR. `FINANCING_PLANS` comes from
`NEXT_PUBLIC_FINANCING_PLANS` and is empty until somebody puts the lender's
real rate sheet in it; `quote()` returns `null` rather than falling back, and
the component shows a lawful no-numbers line instead. **To switch it on: get
the terms from WiseTack or Hearth and set that env var.**

Amortisation verified against known values ($10k @ 9.99%/60mo → $212.42;
$25k @ 12.99%/120mo → $373.13; 0% promotional handled separately because the
general formula divides by zero on it).

### 4.2 Still missing, in priority order

1. **Crew dispatch offer.** *"New $4,500 fencing job in Denver. Tap to
   accept."* There is a crew portal and a `Worker` model but no offer-and-
   accept flow — jobs are assigned by an admin. This is the highest-value
   remaining piece and it needs no new vendor.
2. **Remote e-signature.** Agreements are generated and versioned but signed
   in person. PandaDoc/HelloSign would close this. Note the agreements are
   **not lawyer-reviewed** (`CLAUDE.md` §3.6) — do not automate sending an
   unreviewed contract to strangers at volume.
3. **Stripe Connect payouts.** Payout *records* exist; money still moves by
   hand (Zelle/Apple Cash). Automating this is real work and worth doing.
4. **Automated tests.** Still the highest-value item overall. Everything above
   touches money.

---

## 5. The decision that has to be made by a human

**Integrate or replace?**

- **Replace** (GHL + Jobber as the system of record): buys mature dialler,
  calendar, mobile app and reporting. Costs the price book, the 15% margin
  floor, the payout gates, the published partner working, and the warm-up
  gate — none of which exist in those products. Expect to rebuild or abandon
  each one, and expect the four-sided comp model to be the thing that does not
  survive the move.
- **Integrate** (keep this as the system of record, add vendors at the edges):
  Stripe Connect for payouts, WiseTack/Hearth for financing, PandaDoc for
  signature, CallRail for attribution. Each is a contained piece of work
  against an interface that already exists.

**Recommendation: integrate.** The parts of the proposal with real value —
financing, automated payouts, e-signature, call attribution — are all edge
integrations. The parts that require replacing the core are the parts that
already exist here and that encode rules the vendors cannot enforce.

A configuration file mapping every vendor's keys was requested
(`config/stack-environment.json`). **Deliberately not created as a committed
JSON file** — that is a secrets-in-the-repo pattern and `CLAUDE.md` forbids
it. When vendors are chosen, the right shape is a typed module reading
`process.env`, in the style of `brand.ts`, with the names in `.env.example`
and the values only in Vercel.
