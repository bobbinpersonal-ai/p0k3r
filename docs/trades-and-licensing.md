# Texas — in-home residential construction

A second business on the same platform. The California side sells small jobs
online at a flat price; this one sells roofs at a kitchen table, for five
figures, through 1099 reps working leads the owner assigns by hand.

## What we sell, and why the licensing answer is "yes, but"

Texas has **no statewide general contractor, remodeler or roofing licence**.
That is real and it is the reason this business can be built this way. It is
not the same as "no rules".

**Unlicensed, and what we sell:** roofing, siding, windows, gutters, fence,
garage doors, exterior paint. All seven are in `src/lib/texas/trades.ts`.

**State-licensed, and therefore not ours:** electrical (TDLR), plumbing (Texas
State Board of Plumbing Examiners), HVAC (TDLR), lawn irrigation (TCEQ). A job
needing one of those goes to a licensed contractor who contracts with the
homeowner directly — the same shape as the CSLB referral path on the other
branch.

**Still true even unlicensed:** cities permit and inspect. Houston, Dallas,
Austin, San Antonio and Fort Worth each require permits for a re-roof or a
fence over a certain height, and several require the contractor to be
registered with the city before pulling one. Register in every city you sell
in, before you sell in it.

### Garage doors have their own line, and it is electrical

Hanging a garage door is unlicensed work in Texas like the rest of what we
sell. Wiring for it is not.

- **Plugging an opener into an outlet that is already up there: fine.**
- **Running a new circuit for one: licensed electrical work (TDLR).** It goes
  to a licensed electrician who contracts with the homeowner directly, exactly
  like plumbing or HVAC.

That is the whole distinction and it comes up on a real fraction of garage
door jobs, because plenty of older garages have no outlet on the ceiling. A
rep who says "we'll run you a plug" has just sold licensed work.

Two more things about this trade specifically:

- **Springs.** Torsion springs under tension are the genuinely dangerous part
  of this business. Not a licensing question, a training-and-insurance one.
  Check your GL policy actually covers garage door work before the first job.
- **Coastal windstorm.** In the Texas seacoast counties — and parts of Harris
  County — a garage door has to be windstorm-rated and carry a **WPI-8
  certificate** for the homeowner to stay insurable under TWIA. A garage door
  is the most common way a house fails in a hurricane, which is why it is
  regulated this way. If you sell anywhere near the coast out of the Houston
  market, get the rating right or you can cost a homeowner their coverage.
  `trades.ts` lists it as an exclusion so nobody sells one by accident.

## The three laws that bite an in-home roofing sale

These are enforced in code, not documented and hoped for.

### 1. The deductible is untouchable — Bus. & Com. Code § 27.02

A roofing contractor may not pay, rebate, credit or absorb any part of a
homeowner's insurance deductible, and may not advertise that they will. **This
is a criminal offence in Texas**, graded by the amount involved.

`checkDeductibleLanguage()` refuses anything a rep types that promises it —
"we'll waive it", "covered", "no out of pocket", "on us", "zero deductible",
"deductible credit". `checkInsurancePricing()` catches the same thing done with
arithmetic: quoting $18,000 on an $18,000 carrier scope with a $2,500
deductible absorbs $2,500 of it, whatever the paperwork says. An insurance job
prices at **carrier scope + deductible or above**, or it goes retail.

Say this instead, and say it plainly: *"You pay your deductible, we invoice
your carrier for the rest."*

### 2. We are not the adjuster — Insurance Code Ch. 4102

A contractor may not act as a public insurance adjuster on a property they are
contracting to repair, may not advertise as one, and may not negotiate the
claim on the homeowner's behalf. A rep may meet the adjuster on the roof, point
at damage, and hand over our scope in writing. That is the line. `ADJUSTER_LINE`
is printed on the contract and on the rep's own screen.

### 3. Three days to cancel — Bus. & Com. Code Ch. 601

A sale of $25 or more agreed at the buyer's home gives them three business days
to cancel, with written notice of that right and a form they can send back.
Saturdays count; Sundays and Texas state holidays do not. `cancellationDeadline()`
computes it; the contract carries the notice.

Practical consequence: **do not order material or put a crew on a roof inside
those three days** unless you are willing to eat it. They can cancel for any
reason or none, and the refund is owed.

### 4. RCLA — Property Code Ch. 27

A homeowner must give written notice and an opportunity to repair before suing
over a construction defect, and the contract has to say so. `RCLA_NOTICE` is
the paragraph.

## How a deal works

1. **Owner assigns the lead.** Leads land as `NEW`, the owner assigns one to a
   rep, and it becomes `ASSIGNED` with an appointment time.
2. **Rep runs the appointment at the house.** They measure, pick options, and
   the price book gives a **cost** and a **base**.
3. **Rep prices it.** They can see cost and base. They sell at or above base —
   below is refused, the same way the California crew wage floor is — and
   **keep 60% of everything above base**.
4. **Customer signs.** Contract carries the cancellation notice, the RCLA
   notice, the adjuster line, and the deductible handled correctly if it is an
   insurance job.
5. **Deposit at the table**, Zelle or Apple Cash, same rails as the crews.
6. **Crew gets paid** per job, by Zelle or Apple Cash, tracked against a W-9
   and a running annual total for the 1099-NEC.

## Money out: 1099s

Reps and crews are both 1099. Two things the software tracks because nobody
remembers them in January:

- **W-9 before the first payout.** `Rep.w9OnFile` and `Worker.w9OnFile` gate it.
- **$600 in a calendar year** triggers a 1099-NEC for that person.
  `WorkerPayout.taxYear` is denormalised so the year's totals are one query.

Zelle and Apple Cash are **person-to-person rails with no processor behind
them.** No chargeback protection, no automatic receipt, nothing reconciles
itself — our record is the only record. That is fine at this size and it is
worth knowing it is a choice.

## Open questions for a Texas construction attorney

Before the first appointment, not after:

1. **The contract and its cancellation notice.** Ch. 601 prescribes the notice.
   A defective one is worse than none, because it leaves the buyer's three days
   never having started.
2. **1099 classification of the reps.** In-home sales reps as 1099 is common
   and is also the most commonly challenged classification there is. The Texas
   Workforce Commission applies its own 20-factor test, and it does not care
   what the contract calls them. Get the agreement reviewed.
3. **Homestead and mechanic's liens.** Property Code Ch. 53 has specific rules
   for residential construction on a homestead — the contract must be executed
   *before work begins*, signed by both spouses, and filed with the county
   clerk. If you ever intend to lien, this has to be right from day one.
4. **Contingency agreements on insurance work.** Where the job is contingent on
   the carrier approving the claim, what that agreement may and may not say,
   and how it interacts with the Ch. 601 cancellation right.
5. **City registration** in each metro you sell in.

## The price book is a placeholder

Every rate in `src/lib/texas/trades.ts` is a realistic Texas metro number and
**none of them are yours**. Replace them with your real costs before a rep
quotes off them. The structure is the deliverable; the numbers are a starting
point that is wrong by some margin for your suppliers and your crews.
