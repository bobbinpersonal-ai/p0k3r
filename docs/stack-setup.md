# Stack setup: GoHighLevel, Jobber, Stripe, lender, PandaDoc

Step-by-step wiring for the integration layer. Written to be followed in
order — each section depends on the one above it.

**Nothing here requires a code change.** Every vendor is read from the
environment and an unset vendor is a disabled feature, not a crash. You can
switch them on one at a time and the app keeps working throughout.

The map of what talks to what is `config/stack-environment.json`. The typed
reader is `src/lib/integrations/config.ts`. Secrets go in Vercel, never in
the repo.

---

## 0. Before anything

Set these in **Vercel → Settings → Environment Variables**, Production and
Preview. Names are in `.env.example`.

Generate every `*_WEBHOOK_SECRET` yourself — they are shared secrets you
invent, not values a vendor gives you:

```bash
openssl rand -hex 32
```

A missing webhook secret means the endpoint **rejects everything**. That is
deliberate: an unconfigured webhook that accepted anything would be an open
door for whoever found the URL.

---

## 1. GoHighLevel → booked appointment → Jobber job

### 1.1 Get the credentials
1. GHL → **Settings → Business Profile → API Key**. Copy it to `GHL_API_KEY`.
2. The location id is in the URL when you are inside the sub-account:
   `app.gohighlevel.com/v2/location/**<THIS>**/dashboard` → `GHL_LOCATION_ID`.
3. **Settings → Pipelines**. Open the pipeline, copy its id to
   `GHL_PIPELINE_ID`, and the ids of the "Booked Appointment" and "Sold"
   stages to `GHL_STAGE_BOOKED_APPOINTMENT` and `GHL_STAGE_SOLD`.

### 1.2 Build the workflow
**Automation → Workflows → Create Workflow → Start from scratch.**

| Step | Setting |
|---|---|
| Trigger | **Appointment Status** → *Confirmed* |
| Filter | Calendar *is* your inspection calendar |
| Action | **Webhook** |
| Method | `POST` |
| URL | `https://www.lovemeafter.com/webhooks/ghl-to-jobber` |
| Header | `x-ghl-secret` : *(your `GHL_WEBHOOK_SECRET`)* |
| Body | Custom → include `contactId`, `opportunityId`, `firstName`, `lastName`, `phone`, `email`, `address1`, `city`, `state`, `postalCode`, `calendar.startTime`, and your project-type custom field |

**The `contactId` field is not optional.** It is what makes redelivery safe —
the handler looks the lead up by it and returns the existing job rather than
creating a second one. Without it, every GHL retry creates a duplicate.

### 1.3 What comes back

| Status | Meaning | GHL behaviour |
|---|---|---|
| `200 {ok:true, leadId, jobberJobId}` | Created | Done |
| `200 {ok:true, deduped:true}` | Already had it | Done |
| `400` | Payload unusable — fix the workflow body | Not retried |
| `401` | Wrong or missing `x-ghl-secret` | Not retried |
| `502` | Jobber was down | **Retried** — this is intended |

The 502 is deliberate. Swallowing a Jobber outage as a 200 loses the job
silently and nobody finds out until a homeowner rings asking where the crew
is.

---

## 2. Jobber

1. **Apps → Developer Center → New App**. Scopes: read/write clients, read/write jobs.
2. OAuth once, then store `JOBBER_ACCESS_TOKEN` and `JOBBER_REFRESH_TOKEN`.
3. `JOBBER_CLIENT_ID` and `JOBBER_CLIENT_SECRET` are on the app page.
4. **Leave `JOBBER_API_VERSION` pinned** at the value in `.env.example`.
   Jobber ships breaking schema changes and an unpinned client starts
   failing on a day nobody deployed anything.

### Custom fields to create in Jobber
Settings → Custom Fields → Jobs. Create these exact labels — the integration
writes to them by name:

- `State` · `Lender Application Link` · `Assigned Contractor` · `LMA Estimate ID` · `Needs Margin Review`

`Needs Margin Review` reads `YES` when a job has not cleared the 15% floor.
**Nobody should schedule a crew onto a YES.**

---

## 3. Stripe Connect

### 3.1 Platform
1. **Connect → Get started**, platform profile, `STRIPE_CONNECT_ACCOUNT_TYPE=express`.
2. `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from
   **Developers → API keys**.

### 3.2 Webhook
**Developers → Webhooks → Add endpoint**

- URL `https://www.lovemeafter.com/webhooks/stripe-payout-split`
- Events: `payment_intent.succeeded`, `charge.refunded`
- Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### 3.3 The one thing that will break this

**Every PaymentIntent must carry `metadata.estimateId`.** Without it the
payment cannot be matched to a job, the handler ignores it, and the job
never looks paid — which means the crew payout gate never opens and a crew
does not get paid for work they finished.

### 3.4 Onboarding a crew
Create their Express account, then send the link from
`createConnectOnboardingLink()`. `stripePayoutsEnabled` flips true only once
Stripe is satisfied; until then transfers are refused.

### 3.5 What this is not

It is **not escrow** and must not be described as such to a homeowner, a
crew or in any marketing. Stripe is not an escrow provider, its terms
prohibit presenting it as one, and holding a third party's money pending a
condition is what state money-transmitter licensing regulates. LoveMeAfter
is the general contractor — it holds the contract, carries the warranty, and
pays subcontractors out of its own funds. The mechanism is *separate charges
and transfers*: the charge lands in the platform account, sits there while
the work happens, and a transfer goes to the crew on completion with the
margin simply never leaving. Same cash flow, none of the licensing question.

---

## 4. Financing (WiseTack or Hearth)

1. `LENDER_PROVIDER` = `wisetack` or `hearth`; `LENDER_API_KEY` from their dashboard.
2. `LENDER_APPLY_URL_TEMPLATE` — your merchant link with `{estimateId}` where
   the job reference goes.
3. `NEXT_PUBLIC_FINANCING_PARTNER` — the lender's name, shown to homeowners.
4. **`NEXT_PUBLIC_FINANCING_PLANS`** — their real rate sheet as JSON:

```json
[{"id":"wt60","label":"60 month","apr":0.0999,"termMonths":60,"minAmount":2000,"maxAmount":25000}]
```

### Do not invent an APR to make the screen look finished

Until this is set, the calculator shows *"Monthly payment plans are
available, ask us"* with no numbers. That is lawful and still sells. A wrong
APR next to a signature is a consumer-credit problem, not a styling bug.

### Why the payment never appears on its own

Under **Regulation Z (12 CFR 1026.24)** the amount of a payment is a
*triggering term*: state one and you must also state the down payment, the
repayment terms and the APR, in the same place, with equal prominence. "As
low as $89/mo" alone is the most common violation in this industry. The
component renders payment, APR and term in one row and the disclosure under
it — do not restyle them apart.

---

## 5. Twilio and the consent gate

`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (or
`TWILIO_MESSAGING_SERVICE_SID`).

**Dispatch offers to crews** are B2B and go out immediately.

**Marketing texts to homeowners** pass `maySms()` in
`src/lib/integrations/consent.ts` first, which requires prior express written
consent recorded with its source and date. A CSV upload asserting consent
does not qualify — the uploader's word is not the subscriber's consent, and
the FCC does not treat it as such.

### The aged-list sequence that is actually lawful

1. **Email first.** CAN-SPAM needs no prior consent — honest headers, real
   address, working unsubscribe. `mayEmail()` allows this.
2. **A reply is an enquiry**, which opens a 3-month window under the existing
   business relationship rule. `mayDialConsumer()` then allows a manual dial.
3. **Texting** waits until they give consent themselves.

Set the GHL workflow up in that order and the whole sequence is defensible.
Reversed — text everyone on day one — a 5,000-record list is a $2.5m–$7.5m
exposure at $500–$1,500 per message.

---

## 6. Crew dispatch

No vendor needed beyond Twilio.

```
POST /api/dispatch            { "estimateId": "..." }      (admin cookie)
POST /api/dispatch/accept     { "token": "...", "decline": false }
```

The offer goes to up to 5 eligible crews at once and the first to tap wins.
Eligibility requires ACTIVE status, general liability on file, unexpired
insurance and a matching state; the response lists who was blocked and why,
because "nobody available" and "everyone nearby has lapsed insurance" need
different responses.

A job under the margin floor without sign-off is **refused** — the crew
would be promised money out of a job that cannot pay everyone.

---

## 7. PandaDoc

Templates for the subcontractor agreement, the HIS/rep agreement and the
channel partner agreement; ids into the three `PANDADOC_TEMPLATE_*` vars.

**Get the agreements reviewed by a lawyer before you automate sending them.**
They are generated from `src/lib/regions/*Agreement.ts`, they carry their own
"not reviewed" warnings, and volume-sending an unreviewed contract to
strangers multiplies whatever is wrong with it by the number of signers.

---

## 8. Zapier, if you use it instead of native webhooks

Native GHL webhooks are better here — Zapier adds latency, a failure point
and a per-task cost for something GHL does natively. If you use it anyway:

- **Trigger:** GoHighLevel → Appointment Confirmed
- **Action:** Webhooks by Zapier → POST
- **URL:** `https://www.lovemeafter.com/webhooks/ghl-to-jobber`
- **Headers:** `x-ghl-secret` = your secret
- **Data:** map `contactId` first — see §1.2
- **Turn OFF** "Unflatten" so nested fields arrive as sent

Zapier retries on non-2xx, so the 502-on-Jobber-outage behaviour works there
too.

---

## 9. Checking it works

```bash
curl -s -X POST https://www.lovemeafter.com/webhooks/ghl-to-jobber \
  -H 'content-type: application/json' -H 'x-ghl-secret: WRONG' -d '{}'
# expect 401 — if this returns 200, the secret is not set
```

`integrationHealth()` in `src/lib/integrations/config.ts` returns which
vendors are configured and which env vars each one is missing.
