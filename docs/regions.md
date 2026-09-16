# The five states, the contracts, and what an attorney needs to look at

## The network

| State | Markets | State contractor licence | Roofing registration | Contract statute | Deductible rule |
|---|---|---|---|---|---|
| Colorado | Denver Metro, Colorado Springs & Pueblo, Northern CO, Eastern Plains | None | None | Roofing: written contract on insurance work | Prohibited |
| Missouri | KC Metro, St. Louis, Springfield/Ozarks, Mid-Missouri | None | None | None statewide | Restricted |
| Kansas | Wichita, KC/Johnson County, Topeka/Lawrence, Central & Western | None | **Attorney General registration required** | None statewide | Restricted |
| Indiana | Indianapolis, Fort Wayne, South Bend/Elkhart, Southern IN | None | None | **Home Improvement Contracts Act** | Prohibited |
| Wyoming | Cheyenne/Laramie, Casper, Gillette, Western WY | None | None | None | No statute found |

Everything above is encoded in `src/lib/regions/states.ts` and read from there
by the contracts, the intake forms and the footer.

### On "relaxed regulatory regions"

The premise needs correcting before anyone relies on it. Three of the five
target states impose something Texas does not:

- **Kansas** requires roofing contractors to register with the Attorney
  General. A partner roofing in Kansas without it is operating against a
  registration statute, and the number is verifiable — so we verify it.
- **Colorado** has a roofing statute covering insurance work, and most Front
  Range municipalities license locally on top of it.
- **Indiana** regulates the *contract* rather than the contractor. The Home
  Improvement Contracts Act dictates what a residential contract must contain.

Only **Wyoming** is broadly as relaxed as the premise assumes.

The referral model helps, and this is the real argument for it: most of that
burden binds whoever holds the customer contract, which is the partner. It
moves rather than disappears — and it is why vetting is the product.

### What did not get deleted, and why

The brief said to strip local Texas compliance text. The branding went. The
rules mostly did not, because they were never Texas's:

- The three-day right to cancel a sale agreed at a home is the **FTC
  Cooling-Off Rule** — federal, all five states, whether or not anyone writes
  it down. `coolingOffDays()` takes the greater of the federal floor and the
  state's own rule.
- The deductible prohibition exists in **four of the five**. It is enforced in
  all five anyway, Wyoming included, because absorbing a deductible is in
  substance a misrepresentation to the carrier about what the work cost.

---

# The contracts, and what an attorney needs to look at

Three documents come out of `src/lib/texas/`:

| Document | Built by | Print it |
|---|---|---|
| Residential construction agreement (retail / insurance) | `contracts.ts` | `/admin/tx/paperwork?doc=homeowner` |
| Independent sales representative agreement (1099) | `repAgreement.ts` | `/admin/tx/paperwork?doc=rep` |
| Subcontractor agreement + four lien waivers | `crewAgreement.ts` | `/admin/tx/paperwork?doc=crew` |

Payment structure is `payments.ts`, printable at `?doc=payments`.

**These are working templates, not legal advice, and nobody who wrote them is
your lawyer.** They are close enough to be useful — but several paragraphs are
marked COUNSEL below because getting them wrong is expensive in a specific,
known way. **Counsel is now needed per state, not once.**

---

## The rules these are built on

| Rule | Scope | Where it shows up |
|---|---|---|
| FTC Cooling-Off Rule | All 5 states — 3 business days to cancel a sale agreed at the buyer's home, written notice, 2 copies of the form | `coolingOffDays()`, `cancellationDeadline()`, notice printed twice |
| State deductible prohibitions | CO, KS, MO, IN — enforced in WY too | `checkDeductibleLanguage()`, `checkInsurancePricing()` |
| Public adjuster licensing | All 5 — a contractor may not negotiate the claim | `ADJUSTER_LINE` |
| Kansas Roofing Registration Act | KS only, roofing only | `registrationRequired()`, partner form, `vettingRequirements()` |
| Indiana Home Improvement Contracts Act | IN only — contract contents | `requiredNotices()`, `vettingRequirements()` |
| Colorado roofing statute | CO only — written contract, 72-hour rescission on denial, payments held | `requiredNotices()` |
| Mechanic's lien / trust fund rules | Vary by state | `HOMESTEAD_DISCLOSURE`, `TRUST_FUND_NOTICE`, lien waivers |

---

## COUNSEL — the paragraphs to check first

**1. The Ch. 601 Notice of Cancellation wording.**
`noticeOfCancellation()` in `contracts.ts`. The statute prescribes this notice
in substantially a set form. Ours is written from the standard shape and the
deadline arithmetic is ours (`cancellationDeadline()` excludes Sundays and
Texas holidays, counts Saturdays). If the notice is defective the three-day
clock arguably never starts — meaning a customer could cancel a finished job
months later. This is the single highest-value paragraph in the stack.

**2. The insurance contingency and its citation.**
`INSURANCE_CONTINGENCY` in `contracts.ts` gives the homeowner five business
days to cancel after a carrier denies the claim. Texas has a provision to this
effect; **I could not verify its exact citation** and so the contract grants
the right in its own words rather than quoting a statute. Granting more than
the statute requires is safe. Confirm the citation and the correct window.

**3. The conditional lien waiver wording.**
`CONDITIONAL_NOTICE` in `crewAgreement.ts`. Property Code § 53.284 prescribes
four waiver forms and **a waiver that does not substantially comply is
unenforceable** — so an almost-right form buys nothing at all. The
*unconditional* notice is reproduced as the prescribed all-caps text. The
*conditional* one is **drafted, not quoted**, because I could not reproduce the
statutory conditional wording with confidence. Replace it with the statutory
text.

**4. Independent contractor classification.**
`repAgreement.ts` and `crewAgreement.ts`. The TWC applies a direction-and-control
test and looks at conduct, not labels. The agreements are deliberately narrow —
no set hours, no mandatory meetings, no exclusive territory — but a
misclassification finding is retroactive across every rep. Have an employment
attorney read both, and read `docs/partner-recruiting.md`, which explains why the
job ads avoid certain words.

**5. Homestead lien procedure.**
`HOMESTEAD_DISCLOSURE` tells the homeowner what Ch. 53 requires. It does not
make it happen. For lien rights to actually attach, the contract must be signed
by both spouses **before any material is delivered or labour performed** and
**filed with the county clerk**. Nothing in the software files anything. Decide
whether you want lien rights at all — plenty of residential contractors work
without them deliberately — and if you do, build the filing step.

**6. Property Code § 53.255 / § 53.256 disclosures.**
Texas requires a contractor to give a residential owner a disclosure statement
and a list of subcontractors and suppliers. **Neither is implemented.** Confirm
whether they apply to your jobs and, if so, what has to be handed over and when.

**7. Bus. & Com. Code Ch. 302 — telephone solicitation.**
Not a contract issue, but the same attorney should answer it: registration
certificate plus a $10,000 bond before soliciting Texas consumers by phone,
unless exempt. Open since `docs/launch-playbook.md`. Blocks cold calling, not
door knocking.

---

## Things the software enforces so a human doesn't have to

- A contract will not generate with deductible-absorbing language anywhere in
  the scope notes or line labels (`checkDeductibleLanguage`).
- An insurance job priced below carrier scope + deductible is refused as
  absorbing the deductible by arithmetic (`checkInsurancePricing`).
- Missing `NEXT_PUBLIC_BUSINESS_ADDRESS` is a **blocking error**, not a blank
  line, because the cancellation notice needs somewhere to post to.
- Per-trade exclusions come from the price book, so a garage-door contract
  carries the garage-door boundary without anyone remembering it.
- Crew agreements warn loudly when there is no W-9, no general liability
  certificate, or no workers' comp.

## Things it does not do yet

- No signature capture. These print; nothing counter-signs or stores a signed
  copy against the `Estimate`.
- No county clerk filing for homestead liens.
- No § 53.255 / § 53.256 disclosures.
- No delivery to the customer — the California side emails an agreement link
  on booking; the Texas side has no equivalent because there is no estimator
  UI yet to produce an `Estimate` to hang one off.


---

## COUNSEL — added by the multi-state move

**8. Referral-network status in each state.**
The biggest open question and it is new. Several states regulate home
improvement **lead generation and referral services** separately from
contractors, and some treat a party that books appointments and takes a cut of
a construction contract as needing its own registration. `NETWORK_DISCLOSURE`
positions LoveMeAfter as marketing and referral only — confirm that holds in
CO, MO, KS, IN and WY, and specifically whether taking a percentage of contract
value changes the answer versus a flat per-appointment fee.

**9. Who performs the "free inspection".**
If a LoveMeAfter person climbs the roof, we may be doing contracting-adjacent
work in our own name — which would undo much of the point of the model. If the
partner contractor does it, it is cleanly theirs. Decide this deliberately; the
site currently implies the contractor does it.

**10. Telephone solicitation registration, per state.**
Was one open question for Texas. It is now five. Several states require a
seller registration and some require a bond before soliciting consumers by
phone. Gates cold calling, not door knocking.

**11. Kansas roofing registration — whose?**
The partner's, clearly. Confirm that a network introducing homeowners to a
Kansas roofer does not itself need to register, and that our checking of the
partner's number does not create a duty we would rather not have.

**12. Statements about vetting.**
The site says contractors are "vetted", "checked" and "insured". Each of those
is a factual representation to a consumer. Confirm the wording matches exactly
what is verified in `vettingRequirements()` — and keep them in sync, because
the copy is now the promise.

**13. Consent scope.**
`CONSENT_VERSION` was bumped to `2026-11-01-network` because the wording now
covers contact from network contractors as well as from us. Leads captured
under the old wording consented only to contact from us — confirm they must
not be passed to partners for contact without fresh consent.
