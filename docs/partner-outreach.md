# Partnering with local businesses

Selling appointment-setting to contractors, and calling homeowners in their name.

## The thing worth knowing first

**Calling businesses is far less regulated than calling homeowners.** The
National Do Not Call Registry covers residential subscribers — it does not
apply to a business line called for a business purpose, and most business-to-
business calls are exempt from the FTC's Telemarketing Sales Rule outright.

So the prospecting you need to do *right now* — ringing roofers and asking if
they want appointments — sits outside almost all of the machinery that has been
slowing you down. No state registration for it. No list to buy. You can start
this afternoon.

Two limits that still apply:

- **The TCPA has no B2B exemption for mobiles.** Manual dial only. Never an
  autodialer to a cell, and a lot of contractors' "office" number is a cell.
- **It has to actually be B2B.** Calling a business line to sell an employee
  something for themselves is not a B2B call and loses the exemption.

---

## Who to call

Target shops with crews and no marketing function. Two to fifteen employees is
the sweet spot: big enough to have capacity sitting idle, small enough that
nobody in the building is doing lead generation.

**Best fit, in order:**

1. **Roofing** — high ticket, brutally seasonal, everybody wants leads
2. **Siding and windows** — high ticket, long sales cycle, they need appointments
3. **Fencing** — low competition for leads, fast decisions
4. **Gutters** — cheap to install, good add-on, easy yes
5. **Concrete and driveways** — high ticket, almost nobody markets them
6. **Tree service** — seasonal spikes, very little competition for the phone

**Handle carefully:** HVAC and plumbing are licensed trades. They often have
their own exemptions and their own compliance people, which cuts both ways.

**Where to find them:**
- Supply houses. ABC Supply, SRS, Beacon, Sherwin-Williams commercial desks.
  The counter staff know who is busy and who pays their bills.
- Permit records. Whoever pulled a permit last month is actively working.
- Google Maps for your metro, filtered to businesses with under ~30 reviews —
  that is usually a real shop without a marketing budget.
- Yard signs. Drive the neighbourhood you want to sell in and photograph them.

---

## What to charge

Do not open with "make thousands a month." It is the line every lead vendor
uses and contractors have heard it from people who then sold them shared Angi
leads. Open with risk reversal instead — it is a stronger pitch and it is true.

| Model | What it means | Verdict |
|---|---|---|
| **Per qualified appointment** | $75–250 depending on trade and ticket | **Start here.** Aligned, simple, easy to explain |
| Monthly retainer | $1,500–4,000/month | Predictable for you, all risk on them — hard first sale |
| % of closed contract | 10–15% | Best alignment, worst cash flow for you, hardest to verify |
| Hybrid | Small setup fee + per appointment | What to move to once you have a track record |

**Define "qualified" before you take a dollar.** It is the clause every one of
these deals argues about. The definition already lives in
`src/lib/regions/referralAgreement.ts` as `QUALIFIED_APPOINTMENT`: homeowner,
in the service area, wants a trade they do, everyone who has to agree is
present, specific confirmed time, told it is a sales appointment. A 48-hour
window to challenge, and silence means qualified.

---

## The B2B script

Short. Contractors are on a roof or in a truck.

> "Hi, is this [Name]? — [Name], this is [You] with LoveMeAfter. I'll be quick.
> Do you guys have room for more work this month, or are you booked out?"

Let them answer. *Booked out* is fine — ask when that changes and call back.

> "Here's why I'm calling. We book in-home appointments for exterior
> contractors — homeowner confirmed, time set, both decision-makers there. You
> only pay for the ones that meet a written standard, and you pay after they
> happen, not before.
>
> No lead fees, no shared leads, nobody else getting the same name."

**The question they will ask:** *"What's it cost?"*

> "[$X] per appointment that meets the standard. If it doesn't meet it, you
> flag it inside two days and you don't pay for it. Nothing up front."

**The second question:** *"How do you get them?"*

Answer honestly — paid ads, our own website, and outbound calling. If you
intend to call in their name, say so **on this call**, not later. It changes
their legal position and they are entitled to know before they agree.

> "Some of it is our own advertising. Some is us calling homeowners. If we're
> calling in your name I need that in writing from you, because it makes you
> the seller on those calls — that's just how the rules work, and I'd rather
> tell you now than surprise you."

That sentence wins more deals than it loses. It is what somebody who knows the
rules sounds like, and this industry is full of people who don't.

**Close for a small test:**

> "Let's not do a contract for the year. Give me two weeks and five
> appointments. If they're rubbish you've lost nothing, and if they're good
> we'll talk about volume."

---

## Before you say a partner's name on a call

Calling in someone else's name makes them the **seller**. Under the TCPA they
are liable for calls made on their behalf whether or not they directed the
particular call. That is settled, and a partner who understands it will ask.

Get all of this in writing first — the agreement at
`/admin/network/paperwork?doc=referral` carries the clauses when
`callsInContractorName` is set:

- [ ] Written approval of the exact script
- [ ] Their internal do-not-call list, and a way to keep it updated
- [ ] Their licence and registration numbers, verified — never say a name you
      cannot evidence
- [ ] Agreement that any opt-out goes onto **both** lists within one business day
- [ ] **Wyoming: file the supplement naming them before dialling.** The Notice
      of Intent asks expressly who you call on behalf of, and yours currently
      says "own behalf only"
- [ ] **Indiana: register with the Attorney General first.** Calling for others
      squarely triggers it

---

## Solar

Leave it until last.

Solar is the most litigated corner of telemarketing in the country. Statutory
damages are **$500 per call**, and **$1,500** where a violation is wilful — a
week of ordinary dialling becomes a company-ending number without anybody
intending harm. The FTC has permanently banned operators for running consent
farms, and state regulators have hit solar lead generators with emergency
cease-and-desists and six-figure fines.

It is also electrical work, which is licensed in every state on your list. Your
partner needs that licence, not you — but you are the one saying their name.

None of that makes it impossible. It makes it the thing you add once the
calling operation has a clean record, not the thing you learn on.

One federal note, current as of 2026: the FCC's "one-to-one consent" rule —
which would have required consent naming each seller individually — was vacated
by the Eleventh Circuit in January 2025 and the FCC reinstated the prior rules.
Multi-partner consent language is workable again federally. Several states run
their own stricter mini-TCPAs, and the rule could return in narrower form, so
naming sellers in your consent text is still the safer build.

---

## Order of operations

1. Call contractors this week. B2B, lightly regulated, needs nothing you do not
   already have.
2. Sign two or three on a five-appointment test.
3. Feed them from **your own** advertising and website first — those homeowners
   consented to you directly and carry no partner-name complication.
4. Only then, and only with signed approval plus the filings, start calling
   homeowners in a partner's name.
5. Solar last, or never.
