# The contracts, and what an attorney needs to look at

Three documents come out of `src/lib/texas/`:

| Document | Built by | Print it |
|---|---|---|
| Residential construction agreement (retail / insurance) | `contracts.ts` | `/admin/tx/paperwork?doc=homeowner` |
| Independent sales representative agreement (1099) | `repAgreement.ts` | `/admin/tx/paperwork?doc=rep` |
| Subcontractor agreement + four lien waivers | `crewAgreement.ts` | `/admin/tx/paperwork?doc=crew` |

Payment structure is `payments.ts`, printable at `?doc=payments`.

**These are working templates, not legal advice, and nobody who wrote them is
your lawyer.** They are built around the Texas statutes that actually bite, and
they are close enough to be useful — but several paragraphs are marked COUNSEL
below because getting them wrong is expensive in a specific, known way.

---

## The statutes these are built on

| Statute | What it does | Where it shows up |
|---|---|---|
| Bus. & Com. Code Ch. 601 | 3 business days to cancel a sale agreed at the buyer's home; written notice + 2 copies of a cancellation form | `residentialContract()`, notice printed twice |
| Bus. & Com. Code § 27.02 | Criminal offence to pay, rebate or absorb an insurance deductible | `checkDeductibleLanguage()`, `checkInsurancePricing()` |
| Insurance Code Ch. 4102 | Contractor may not act as public adjuster on a property it is repairing | `ADJUSTER_LINE` |
| Property Code Ch. 27 (RCLA) | Notice + chance to cure before suit over a defect | `RCLA_NOTICE` |
| Property Code Ch. 53 | Homestead lien: written, **both spouses**, **before work starts**, filed with county clerk | `HOMESTEAD_DISCLOSURE`, lien waivers |
| Property Code Ch. 162 | Customer money is a construction trust fund; misapplication is criminal | `TRUST_FUND_NOTICE`, `TRUST_RULE` |

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
attorney read both, and read `docs/texas-recruiting.md`, which explains why the
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
unless exempt. Open since `docs/texas-launch.md`. Blocks cold calling, not
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
