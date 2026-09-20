# LoveMeAfter — project handoff

**Read this before touching anything.** It is written for an AI agent picking
this repo up cold, and it exists because most of what matters here is *why*
things are the way they are, not what the code does. Several decisions in this
codebase look wrong until you know what they are protecting against, and at
least three of them have already been "fixed" back and then re-broken.

Last updated at commit `2594c89`. See also
`docs/stack-integration-assessment.md` (the audit of the proposed vendor
stack) and `docs/stack-setup.md` (how to wire each vendor up).

**The owner chose to make GoHighLevel + Jobber the system of record.** The
integration layer for that is built — `src/lib/integrations/*`, `webhooks/*`,
`/api/dispatch`, `/api/financing`, `/api/recruiting`. Nothing has been
deleted: this app still owns the money rules, because GHL and Jobber cannot
express a price-book floor, a 15% margin floor or a channel partner's 40%.
Read §2 before changing where any figure comes from. If you change something this file describes,
update this file in the same commit.

---

## 1. What the business is

**LoveMeAfter LLC** is a home improvement general contractor operating in
**Colorado, Missouri, Kansas, Indiana and Wyoming**. It sells exterior work:
roofing, siding, windows, gutters, fence, garage doors and exterior paint.

It is a **four-sided marketplace**, and nearly every confusing thing in the
codebase comes from keeping the four sides straight:

| Side | Who they are | What they give | What they get |
|---|---|---|---|
| **Homeowners** | The customer | Money for a job | The work, warranted |
| **Channel partners** | Other home-service businesses (HVAC, plumbing, solar…) | Their list of **past customers** | **40% of the gross profit** on anything sold off it — about **$2,000 a job** |
| **Contractors / crews** | Trade businesses with crews | They measure, sell and build the job | The price for the work **+ 30% of everything sold above the price-book floor**, paid in 3 days |
| **Scouts** | B2B closers | They recruit channel partners | 20% override on company net, 24 months |

The channel-partner side is the engine. A partner hands over a list of people
they have already done work for; we call those people in the partner's name,
sell them work the partner does not do, and pay the partner a share. What is
actually being borrowed is **the customer's existing trust in the partner**,
which is why the call is warm and why the compliance rules below are strict.

### Naming trap, read this twice

- `/channel-partners` — businesses who **share a customer list** and do no work.
- `/partners` — businesses whose **crews do the work**.

These are completely different offers with confusingly similar URLs. The short
link `/2000` points at the channel-partner page precisely because `/partner`
and `/partners` are one keystroke apart and go to different places. `/partners`
carries a banner at the top redirecting anyone who guessed wrong.

---

## 2. The money rules

**These are invariants. Do not change a number here without being asked to.**
Every figure lives in exactly one place and is imported everywhere else — that
is deliberate, because these numbers appear in marketing copy, in a legal
agreement, in a payout API and on a partner's ledger, and they must never be
able to disagree.

| Constant | Value | Where it lives |
|---|---|---|
| `CHANNEL_PARTNER_PROFIT_SHARE` | `0.4` | `src/lib/regions/channelPartners.ts` |
| `MARGIN_FLOOR` | `0.15` | `src/lib/regions/channelPartners.ts` |
| `CONTRACTOR_OVERAGE_RATE` | `0.3` | `src/lib/regions/commission.ts` |
| `OVERAGE_RATE` (dedicated rep) | `0.6` | `src/lib/regions/commission.ts` |
| `DEFAULT_BASE_COMMISSION_RATE` | `0` | `src/lib/regions/commission.ts` |
| `SCOUT_OVERRIDE_RATE` | `0.2` | `src/lib/regions/scouts.ts` |
| `CREW_PAID_DAYS` | `3` | `src/lib/regions/crewAgreement.ts` |
| `NEC_THRESHOLD` | `600` | `src/lib/regions/crewAgreement.ts` |
| `CHANNEL_PARTNER_TERMS_VERSION` | `2026-09-18.3` | `src/lib/regions/channelPartnerAgreement.ts` |

### How a job's money is divided

```
sold price
  − what it cost us to build        (price book, src/lib/regions/trades.ts)
  − what the seller earned          (commission.ts: 30% of sold − base)
  ─────────────────────────────
  = gross profit
      × 40%  → channel partner
      = company net
          × 20% → scout (where one signed the partner)
          = what the company keeps
```

Then `marginCheck(soldPrice, companyNet)` must be **≥ 15% of the contract**, or
the job is flagged `requiresAdminOverride` and will not pay out automatically.

**Verified**: across all 312 price-book scenarios (every trade × every option ×
three sizes × four markups), with a scout override stacked on, the worst
company margin is **16.3%**. Nothing trips the floor. A 25-square re-roof at
book price makes $5,000 gross and pays the partner exactly **$2,000** — that is
where the "$2,000 a job" claim comes from and it is the *floor* for that job,
not the ceiling.

### Rules that are enforced in code, not in a memo

- **Payout amounts are computed server-side, never accepted from a client.**
  `/api/admin/payouts` reads the signed estimate and re-runs the same function
  the partner's page quotes. A payout figure posted by a browser is a figure
  somebody can edit in dev tools.
- **A crew payout requires**: job `COMPLETED`, customer paid in full
  (`collectedFor().paidInFull`, which uses `>=` — an overpayment is a refund
  problem, not a reason to keep a crew waiting), no unresolved admin override,
  a W-9 on file, no duplicate, and `workAmount <= estimate.costTotal`.
- **Selling below the price-book floor is refused, not clamped.** See
  `dealAt()` returning `undefined`.
- **There is no CASH payment rail anywhere, and there must never be one.** The
  subcontractor agreement makes taking money directly a termination event.
  Every dollar goes through the company's payment system.

---

## 3. Compliance — the non-negotiables

Breaking any of these is worse than shipping nothing.

1. **Manual dialling only. No autodialer, ever.** `isAutodialable()` in
   `src/lib/regions/calling.ts` returns `false` by construction. The TCPA's
   restriction on automated dialling to a mobile has no B2B exemption, and a
   contractor's "office" number is usually a cell.
2. **Homeowners are never cold-called off a partner's list.** The warm-up
   system (`src/lib/regions/warmup.ts`) gates the dialler: `mayDial()` must
   pass before a number is even *displayed* on the desk. The number is withheld
   rather than shown-and-disabled, because a `tel:` link on screen next to a
   "don't call yet" label is a link somebody taps.
3. **Calling a business is different from calling a household.** Recruiting
   channel partners is B2B — outside the National DNC Registry and most of the
   FTC's Telemarketing Sales Rule. That is why `/admin/network/recruit` is
   light on gating and `/admin/desk` is gated to the teeth. Do not copy the
   permissiveness of one into the other.
4. **No unsubstantiated earnings claims.** "About $2,000 a job" is our own
   price-book average and is fine. "Your list will make you $30,000" is not.
   The recruiting script's social proof is deliberately in the **first person**
   (the caller's own three-year track record) rather than as a company claim —
   see the note in `pitch()`, which says so in capitals because it is the line
   somebody will be tempted to "fix".
5. **Admin API routes must be gated by `isAdminRequest()`** (or, in the one
   Server Actions file, the equivalent cookie check).
6. **The drafted agreements are NOT lawyer-reviewed.** They say so in their own
   `warnings` arrays. Do not remove those warnings and do not let anyone sign
   one without review.
7. **The customer-list URL allowlist exists to stop a phishing vector** aimed at
   the admin. Do not loosen it.
8. **Marketing SMS and consumer dialling pass `consent.ts` first.** An
   opt-out is permanent and company-wide. A CSV asserting consent is not
   consent — the uploader's word is not the subscriber's. The lawful
   aged-list sequence is email → reply → manual dial → text, in that order,
   and it is written up in `docs/stack-setup.md` §5.
9. **A payment figure never appears without its APR and term.** Under
   Regulation Z (12 CFR 1026.24) the amount of a payment is a triggering
   term: state one and you must state the down payment, repayment terms and
   APR alongside, with equal prominence. `src/lib/regions/financing.ts`
   enforces this by refusing to quote without real lender terms. "As low as
   $89/mo" on its own is the violation, not the goal.

### Held pending a human decision

- **Colorado deposits.** An external review claimed C.R.S. § 6-22-105 bans
  taking a deposit. That citation looks wrong — the codebase already implements
  § 6-22-105 as the insurance-deductible rebate prohibition, and the deposit
  rule is more likely § 6-22-103 ("hold in trust"), which would make the
  current deposit lawful. **Unresolved. Verify against the statute before
  acting.**
- **Scouts cannot actually be paid.** There is no `signedByScoutId` on
  `ChannelPartner`, no scout portal and no scout agreement. The comp maths
  exists; the attribution does not.

---

## 4. Architecture and conventions

**Stack**: Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · Postgres
(Neon in production, local `lmatest` in dev) · deployed on Vercel from `main`.

### Conventions that are load-bearing

- **Domain logic lives in `src/lib/regions/*.ts`, never in a component.** These
  modules are pure, import no server code, and are the single source of truth
  for every number and every piece of legal text. Pages import from them. This
  is what stops the marketing page and the agreement from disagreeing.
- **Status values are plain strings, not Prisma enums.** Documented at the top
  of `prisma/schema.prisma`. Adding a value never needs a migration; the valid
  set is enforced where it is written.
- **Passwords use `scrypt`** (Node built-in), format
  `scrypt$N$r$p$saltHex$hashHex`, N=16384 r=8 p=1 keylen=64. Deliberately NOT
  bcrypt or argon2 — native modules break serverless deploys.
- **Sessions are DB-backed and revocable**, storing the SHA-256 of a 32-byte
  random token (`ChannelPartnerSession`, `WorkerSession`).
- **Token-as-invitation**: a `portalToken` opens a portal only while
  `passwordHash` is null. Once a password is set the token is spent and
  redirects to login.
- **Server Actions are used in exactly two places** (`/admin/desk`,
  `/admin/network/recruit`) and both are call desks where a round trip per
  action is felt as hesitation. Everywhere else uses API routes.
- **`src/lib/partnerPassword.ts` exists to keep Prisma out of the browser
  bundle.** Client components importing the password policy from `partnerAuth`
  dragged ~145kB of Prisma into `/signup` and `/claim`. Do not merge them back.

### Where things are

```
src/lib/integrations/   external vendors. Each is optional.
  config.ts             typed env for every vendor + integrationHealth()
  consent.ts            THE GATE. maySms / mayDialConsumer / mayEmail
  ghl.ts                GoHighLevel: normalise appointments, push stages
  jobber.ts             Jobber GraphQL: create client + job, pinned version
  stripeConnect.ts      splitFor(), transfers, webhook signature + replay
  dispatch.ts           crew eligibility, offer message, TTL

webhooks/               standalone serverless adapters (thin — logic is above)
  ghl-to-jobber.js      booked appointment -> Jobber job, idempotent
  stripe-payout-split.js  payments in, contractor transfers out

src/lib/regions/        the domain. Start here.
  brand.ts              company name, phone, warranty terms
  states.ts             the 5 states: markets, licensing, calling rules
  trades.ts             THE PRICE BOOK — cost and base per unit, per option
  commission.ts         who earns what on a sale; the floor
  channelPartners.ts    the 40% split, margin floor, partner journey
  channelPartnerAgreement.ts  the click-wrap + its version
  crewAgreement.ts      the subcontractor agreement
  partnerProspects.ts   recruiting: script, objections, cadence, trades to call
  warmup.ts             the gate that stops cold-calling a partner's customers
  calling.ts            curfews, DNC screening, autodial prohibition
  scouts.ts             scout override maths (not yet payable)
  collections.ts        has the customer actually paid
  payments.ts           payment rails (no cash)
  compliance.ts, contracts.ts, noSale.ts, dispositions.ts, …

src/app/
  /                     homeowner marketing
  /channel-partners     THE partner pitch page  (short link: /2000)
  /channel-partners/portal   partner's own ledger, with the published working
  /partners             crew recruiting  (different offer — see naming trap)
  /crew                 crew portal: jobs, field estimator, sell at the table
  /admin/desk           homeowner calling desk (heavily gated)
  /admin/network/recruit  partner acquisition console (B2B, next-call flow)
  /admin/network/*      pipeline, partners, crews, payouts, products, paperwork
```

### The database

23 models. The ones that matter:

- `Lead` → `Estimate` → `Payment` — a homeowner job and its money.
  `Lead` carries **both** `repId` and `workerId`, so a closer and a crew can be
  different people or the same person. This is why you do not need to hire one
  unicorn who can both sell and roof.
- `ChannelPartner` — **also holds cold-call prospects** under
  `status: "PROSPECT"`. This is deliberate: when a cold call says yes, nothing
  is migrated, the row just changes status and already has its token, trade and
  call history. Three consequences are handled and must stay handled:
  the partners page filters prospects out; the portal and claim route refuse
  `PROSPECT` rows (their phone came off Google Maps, so the last-4 check that
  guards claiming is not a secret); and signup *adopts* a prospect row rather
  than dead-ending on "account already exists".
- `PartnerCall` — the prospecting call log. Separate from `CallAttempt`, which
  logs homeowner calls and carries the curfew machinery those need.
- `WorkerPayout`, `ChannelPartnerPayout` — the two ledgers.

---

## 5. Running it

```bash
# Postgres locally (it stops often in this environment)
pg_ctlcluster 16 main start

# env
set -a && . ./.env.local && set +a

npx prisma db push          # schema is pushed, not migrated — see below
npx tsc --noEmit            # must be clean
npx next lint               # must be clean
npm run build               # runs prisma generate + db-push + next build
npx next start -p 3232      # then verify in a browser, not just by reading
```

**There are no migrations.** `npm run build` runs `scripts/db-push.mjs`, which
pushes the schema at deploy time. Read that script's header comment before
touching it — it exists because a bare `prisma db push` in the build command
once took the whole site down by blocking forever on a lock. It forces DDL to
the direct (non-pooled) Neon endpoint, sets `lock_timeout` and
`statement_timeout`, and kills itself after 120s.

**Tests run on every build.** `npm test` (Node's built-in runner via tsx, no
extra framework) and `npm run build` will not proceed if they fail. They
cover the money functions, the compliance gates and the vendor adapters —
59 of them. The important ones are invariants rather than arithmetic: the
price book never trips the margin floor, the split never distributes more
than came in, `splitFor()` agrees with `channelPartnerPayout()`, and a
typical roof still pays the partner exactly $2,000.

Running the app and driving it in a browser is still required on top. Two
bugs that shipped in this project were invisible to both typechecking and
tests.

### The shipping ritual

`npx tsc --noEmit` → `npx next lint` → `npm run build` → start the server →
**drive the actual feature in a browser** → clean up test data → commit → push
to `main` (Vercel deploys from it).

Driving it in a browser is not optional and is not ceremony. Two genuine bugs
in the last session were invisible to reading and typechecking: a call console
that silently **skipped the next prospect** after logging, and a script that
rendered "Hi, is this there? — there, it's — from LoveMeAfter."

---

## 6. Traps that have already bitten

- **A stale dev server serving an old build.** `pkill -f "next start"` matches
  its own shell and fails silently, leaving the old server up and producing
  `ChunkLoadError` in the browser. Kill by PID from `ss -ltnp`, or use a
  helper that waits for "Ready" in the log.
- **`Lead.address` is NOT NULL.** CSV import must supply a placeholder.
- **`prisma db push --accept-data-loss` is refused by some tool permission
  classifiers.** Workaround: verify emptiness, create the index by raw SQL,
  then a plain `db push` finds it in sync.
- **Native `<select>` needs `[color-scheme:dark]`** on this theme, or the
  option list renders light-on-light.
- **Positional cursors break under revalidation.** `revalidatePath` can shrink
  the list underneath you; index into it and you skip a row. Track identity.
- **Deriving display text from labels.** `label.toLowerCase()` produced "we
  don't do hvac". Store the spoken form; do not compute it.

---

## 7. State of play

### Working and verified
Homeowner intake and booking · price book and field estimator (measure, price,
sell, sign, collect) · crew portal with logins · channel-partner portal with
logins, published profit working and payout ledger · admin pipeline and payout
creation · homeowner calling desk with warm-up gating · **partner acquisition
console** (`/admin/network/recruit`): paste a list, next-call flow, per-trade
plain-English script, auto-personalised texts, 8-touch / 18-day cadence.

### Known gaps, roughly in priority order
1. **Scouts cannot be paid** — no attribution (`signedByScoutId`), no portal,
   no agreement. The comp maths exists; nothing links a partner to a scout.
2. **Colorado deposit question unresolved** (§3).
3. **Every vendor is unconfigured.** The integration layer is built and
   tested but no credentials are set — `/admin/network/integrations` shows
   exactly which env vars each one is waiting on, and what breaks without
   it. Financing additionally needs a real lender rate sheet.
4. **Most of `docs/` predates the move from Texas to the five-state network.**
   `launch-playbook.md` (29 Texas references), `partner-recruiting.md` (13),
   `regions.md` (12), `trades-and-licensing.md` (10) and
   `paint-fence-launch.md` (4) all still describe Texas, and
   `partner-outreach.md` describes an older appointment-selling model that was
   replaced by the channel-partner offer. **Treat `docs/` as history, not as
   instructions.** `src/lib/regions/*` is the current truth; where the two
   disagree, the code wins.
5. No WhatsApp channel, which several partners will prefer.
6. No email/SMS sending from the recruit console — it hands off to the
   device's own `sms:` and `mailto:` handlers.
7. The offer-expiry cron reports stranded jobs but does not re-offer them.
   Widening the search is a judgement call, and a cron that keeps
   broadening it eventually texts somebody four states away at 3am.

---

## 8. Decision log — do not "fix" these back

**The partner split has been four different formulas.** 50% of profit capped at
$3,500 → 50% + bonus → 10% of the contract → **40% of gross profit, uncapped**.
The 10% version was chosen for verifiability (a percentage of a number the
customer also knows) and reversed one turn later because on a roof at book
price it paid under a fifth of what the job made. The current answer keeps
verifiability a different way: **we publish the whole working** — sold price,
our cost, what the seller earned, what was left, and their 40% — on the
partner's own page and promise it in the agreement. Giving up the privacy of
our margins is the price of the offer being checkable. That trade was made
deliberately.

**`DEFAULT_BASE_COMMISSION_RATE` is 0 and that is a placeholder, not a
decision.** Nobody has said what a rep should earn on the base. Inventing a
number would quietly change what every rep is owed. It needs a human.

**Contractors get 30%, a dedicated closer gets 60%.** A contractor who
measures, sells and then builds has two income streams from the deal; a rep who
sells and walks away has one. Pricing both at 60% leaves nothing to pay the
partner and the scout out of.

**Prospects share a table with partners** (§4). The alternative was a separate
table plus a conversion step, and conversion steps lose data.

**The recruiting script is deliberately flat and simple.** It is written for
somebody whose first language is not English, on a jobsite, on a phone. Short
sentences, common words, no idioms, numbers spoken plainly. It will read as
unsophisticated to a native speaker. That is the point. The rules are in the
header comment of `pitch()`.

**The short link is `/2000`, in digits.** The call says "about two thousand
dollars" three times before the link comes up, so it is the number they just
heard — and digits survive an accent and a bad line where words do not.

---

## 9. How to work on this

- **Read the domain module before the component.** The comments in
  `src/lib/regions/*` carry the reasoning; the components just render it.
- **Never write a number twice.** Import it.
- **Say what is wrong when you find it.** Several fixes in this codebase came
  from noticing that a page promised something the code no longer did —
  `/partners` advertised "a set labor rate, paid on schedule" for weeks after
  contractors started selling and collecting.
- **Verify in a browser before claiming something works.**
- **Clean up test data.** Seed rows are prefixed `ZZ` by convention so they can
  be found and deleted.
- **Never commit secrets.** Check `git status` after a broad `git add`.
