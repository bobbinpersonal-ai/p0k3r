// The Texas rules that bite an in-home roofing sale, written as code rather
// than as a page nobody reads.
//
// Texas has no statewide general contractor, remodeler or roofing licence, and
// that is genuinely why this business can exist the way it does. It does not
// mean there are no rules. Four apply to what we sell and how we sell it, and
// three of them are enforceable here rather than merely documented:
//
//   1. Bus. & Com. Code Ch. 601 — Home Solicitation Transactions. A sale of
//      $25 or more agreed at the buyer's home gives them three business days
//      to cancel, and requires written notice of that right with a form they
//      can send back. Same shape as the California work on the other branch,
//      different statute and a different notice.
//
//   2. Bus. & Com. Code § 27.02 — a roofing contractor may not pay, rebate,
//      credit or in any way absorb a homeowner's insurance deductible, and may
//      not advertise that they will. This is a criminal offence in Texas, not
//      a civil one. "We'll cover your deductible" is the single most common
//      thing a roofing rep says that can put their owner in front of a judge,
//      so the estimator refuses to produce a contract that does it.
//
//   3. Insurance Code Ch. 4102 — a contractor may not act as a public
//      insurance adjuster on a property they are contracting to repair, and
//      may not advertise or solicit as one. A rep may be present, may point at
//      damage, and may not negotiate the claim on the homeowner's behalf.
//
//   4. Property Code Ch. 27 — the Residential Construction Liability Act. A
//      homeowner has to give written notice and an opportunity to repair
//      before suing over a defect, and the contract has to say so.
//
// None of this is legal advice, and the wording of a statutory notice is set
// by statute. Have a Texas construction attorney read this file and the
// contract it produces before the first appointment — see docs/texas.md.

/** Business days the buyer has to cancel a sale made at their home. */
export const CANCELLATION_BUSINESS_DAYS = 3;

/** Days we have to refund everything once they cancel. */
export const REFUND_DAYS = 10;

/** Above this, a sale at the buyer's home is a home solicitation transaction. */
export const HOME_SOLICITATION_THRESHOLD = 25;

/**
 * Texas state holidays that land on a fixed date.
 *
 * Business days exclude Sundays and holidays. Where the rule is unclear the
 * later date wins — a notice that overstates the buyer's window costs us
 * nothing, and one that understates it is defective.
 */
const FIXED_HOLIDAYS = [
  [0, 1], // New Year's Day
  [5, 19], // Juneteenth — a Texas state holiday since 1980, and federal since 2021
  [6, 4], // Independence Day
  [10, 11], // Veterans Day
  [11, 25], // Christmas Day
] as const;

function isHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  const weekday = date.getDay();
  const weekOfMonth = Math.floor((day - 1) / 7);

  if (FIXED_HOLIDAYS.some(([m, d]) => m === month && d === day)) return true;
  // Third Monday in January (MLK) and February (Presidents').
  if (weekday === 1 && weekOfMonth === 2 && (month === 0 || month === 1)) return true;
  // Last Monday in May (Memorial).
  if (weekday === 1 && month === 4 && day + 7 > 31) return true;
  // First Monday in September (Labor).
  if (weekday === 1 && month === 8 && weekOfMonth === 0) return true;
  // Fourth Thursday in November (Thanksgiving).
  if (weekday === 4 && month === 10 && weekOfMonth === 3) return true;
  return false;
}

/** Sundays and holidays don't count. Saturdays do. */
export function isBusinessDay(date: Date): boolean {
  return date.getDay() !== 0 && !isHoliday(date);
}

/** The last day the buyer can still cancel — "midnight of" this date. */
export function cancellationDeadline(
  signed: Date,
  businessDays: number = CANCELLATION_BUSINESS_DAYS,
): Date {
  const day = new Date(signed);
  day.setHours(0, 0, 0, 0);
  let counted = 0;
  while (counted < businessDays) {
    day.setDate(day.getDate() + 1);
    if (isBusinessDay(day)) counted++;
  }
  return day;
}

export function formatLegalDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** Whether this sale is a home solicitation transaction at all. */
export function isHomeSolicitation(soldPrice: number, atTheHome: boolean): boolean {
  return atTheHome && soldPrice >= HOME_SOLICITATION_THRESHOLD;
}

// --- The deductible ---------------------------------------------------------

/**
 * Phrases that turn a roofing contract into a criminal one.
 *
 * Checked against anything a rep can type that reaches a customer: the scope
 * of work, the notes, the concession line. The list is deliberately blunt —
 * false positives here cost a rep one rewrite, and a false negative costs the
 * owner a Class A misdemeanour or worse depending on the amount.
 */
const DEDUCTIBLE_RED_FLAGS = [
  /\bwaive\w*\s+(the\s+|your\s+|their\s+)?deductible/i,
  /\b(cover|covering|absorb\w*|eat|eating|pay|paying|credit\w*|rebate\w*)\s+(the\s+|your\s+|their\s+)?deductible/i,
  /\bdeductible\s+(is\s+)?(waived|covered|on us|free|included|forgiven)/i,
  /\bno\s+(out[- ]of[- ]pocket|deductible)\b/i,
  /\bwe'?ll\s+(take care of|handle|eat)\s+(the\s+|your\s+)?deductible/i,
  /\bzero\s+deductible\b/i,
  /\bdeductible\s+(discount|credit|rebate|allowance)/i,
];

export type DeductibleCheck = { ok: true } | { ok: false; reason: string; matched: string };

/**
 * Refuse text that offers to absorb a deductible.
 *
 * This is not a lint rule. Texas Bus. & Com. Code § 27.02 makes it an offence
 * for a roofing contractor to pay or rebate all or part of an insurance
 * deductible, and § 27.01 makes advertising it an offence too. So the software
 * will not write it down.
 */
export function checkDeductibleLanguage(text: string | null | undefined): DeductibleCheck {
  if (!text) return { ok: true };
  for (const pattern of DEDUCTIBLE_RED_FLAGS) {
    const found = pattern.exec(text);
    if (found) {
      return {
        ok: false,
        matched: found[0],
        reason:
          `"${found[0]}" cannot go on a Texas roofing contract. Under Business & Commerce ` +
          `Code § 27.02 a roofing contractor may not pay, rebate or absorb any part of a ` +
          `homeowner's insurance deductible — it is a criminal offence, not a policy. The ` +
          `homeowner pays their deductible; we invoice the carrier for the rest.`,
      };
    }
  }
  return { ok: true };
}

/**
 * An insurance job priced below the carrier's scope plus the deductible is
 * the same offence wearing a different hat: quoting $8,000 on a $10,000 claim
 * with a $2,000 deductible is absorbing the deductible by arithmetic.
 */
export function checkInsurancePricing({
  carrierScope,
  deductible,
  sold,
}: {
  carrierScope: number | null;
  deductible: number | null;
  sold: number;
}): DeductibleCheck {
  if (carrierScope === null || deductible === null) return { ok: true };
  const owed = carrierScope + deductible;
  if (sold + 1 < owed) {
    return {
      ok: false,
      matched: `$${sold} against $${owed}`,
      reason:
        `Selling at $${sold.toLocaleString()} when the carrier's scope is ` +
        `$${carrierScope.toLocaleString()} and the deductible is ` +
        `$${deductible.toLocaleString()} absorbs $${(owed - sold).toLocaleString()} of the ` +
        `deductible, which § 27.02 treats the same as waiving it outright. Price the job at ` +
        `$${owed.toLocaleString()} or more, or take it retail instead of through the claim.`,
    };
  }
  return { ok: true };
}

// --- What a rep may and may not say about the claim --------------------------

/** Printed on the contract and on the rep's own screen. */
export const ADJUSTER_LINE =
  "We are a roofing contractor, not a public insurance adjuster. We can show you the " +
  "damage, meet your adjuster on site and give you our scope in writing. We cannot " +
  "negotiate your claim for you or act on your behalf with your carrier — Texas Insurance " +
  "Code Chapter 4102 forbids it on a property we are contracting to repair.";

/** The RCLA paragraph, which has to be in the contract. */
export const RCLA_NOTICE =
  "NOTICE: This contract is subject to Chapter 27 of the Texas Property Code. The " +
  "provisions of that chapter may affect your right to recover damages arising from a " +
  "construction defect. If you have a complaint concerning a construction defect and that " +
  "defect has not been corrected through normal warranty service, you must provide notice " +
  "regarding the defect to the contractor by certified mail, return receipt requested, not " +
  "later than the 60th day before the date you file suit to recover damages in a court of " +
  "law. The notice must refer to Chapter 27 of the Texas Property Code and must describe " +
  "the construction defect. If requested by the contractor, you must provide the " +
  "contractor an opportunity to inspect and cure the defect as provided by Section 27.004 " +
  "of the Texas Property Code.";

/** The statement the cancellation right requires, next to the signature. */
export const CANCELLATION_PROXIMITY_NOTICE =
  "You, the buyer, may cancel this transaction at any time prior to midnight of the third " +
  "business day after the date of this transaction. See the attached notice of cancellation " +
  "form for an explanation of this right.";

/** Trades Texas licenses, which we therefore do not sell. */
export const LICENSED_TRADES = [
  { trade: "Electrical", regulator: "TDLR" },
  { trade: "Plumbing", regulator: "Texas State Board of Plumbing Examiners" },
  { trade: "HVAC / air conditioning", regulator: "TDLR" },
  { trade: "Lawn irrigation", regulator: "TCEQ" },
] as const;

export const LICENSED_TRADE_LINE =
  "Electrical, plumbing, HVAC and irrigation work is licensed by the State of Texas and is " +
  "not part of this contract. Where a job needs one of those, it goes to a licensed " +
  "contractor who contracts with the homeowner directly.";
