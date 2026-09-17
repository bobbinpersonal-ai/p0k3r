// The consumer rules that bite an in-home exterior sale, written as code
// rather than as a page nobody reads.
//
// This was a Texas-only file. It is now driven by src/lib/regions/states.ts,
// because the five states in the network are not interchangeable and the
// alternative — deleting the rules along with the Texas branding — would have
// been the most expensive kind of tidy-up.
//
// Specifically, the brief said to strip "local Texas compliance text". The
// branding, yes. The rules themselves mostly were not Texas's to begin with:
//
//   - The three-day right to cancel a sale agreed at somebody's home is the
//     FTC's Cooling-Off Rule. It is federal, it applies in all five states,
//     and it applies whether or not anyone writes it down.
//   - The prohibition on absorbing an insurance deductible exists in Colorado,
//     Kansas, Missouri and Indiana as well as Texas. Four of the five.
//   - Indiana's Home Improvement Contracts Act dictates what a residential
//     contract must contain, which is stricter than anything Texas imposes.
//   - Kansas requires roofing contractors to register with the Attorney
//     General, which is stricter than anything Texas imposes either.
//
// So what changed is the lookup, not the enforcement. Under the partner
// network these rules mostly bind the contractor holding the customer
// contract — but we are the ones introducing the homeowner to them, and a
// referral network that hands people to partners who break consumer statutes
// owns that outcome commercially whatever the paperwork says.
//
// Not legal advice. See docs/regions.md for the counsel list.

import {
  FEDERAL_COOLING_OFF_DAYS,
  HOME_SOLICITATION_THRESHOLD,
  getRegion,
  type Region,
  type StateCode,
} from "@/lib/regions/states";

export { FEDERAL_COOLING_OFF_DAYS, HOME_SOLICITATION_THRESHOLD };

/** Days we have to refund everything once a buyer cancels. */
export const REFUND_DAYS = 10;

/**
 * Business days a buyer has to cancel, for a given state.
 *
 * Falls back to the federal floor for anything unrecognised. Erring long costs
 * nothing; erring short produces a defective notice.
 */
export function coolingOffDays(state?: string | null): number {
  const region = getRegion(state);
  return Math.max(region?.rules.coolingOffBusinessDays ?? 0, FEDERAL_COOLING_OFF_DAYS);
}

/**
 * Federal holidays. Business days exclude Sundays and holidays; Saturdays
 * count. Where a rule is unclear the later date wins — a notice that
 * overstates the buyer's window costs us nothing, and one that understates it
 * is defective.
 */
const FIXED_HOLIDAYS = [
  [0, 1], // New Year's Day
  [5, 19], // Juneteenth
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
  if (weekday === 1 && weekOfMonth === 2 && (month === 0 || month === 1)) return true; // MLK, Presidents'
  if (weekday === 1 && month === 4 && day + 7 > 31) return true; // Memorial
  if (weekday === 1 && month === 8 && weekOfMonth === 0) return true; // Labor
  if (weekday === 4 && month === 10 && weekOfMonth === 3) return true; // Thanksgiving
  return false;
}

/** Sundays and holidays don't count. Saturdays do. */
export function isBusinessDay(date: Date): boolean {
  return date.getDay() !== 0 && !isHoliday(date);
}

/** The last day a buyer can still cancel — "midnight of" this date. */
export function cancellationDeadline(signed: Date, state?: string | null): Date {
  const businessDays = coolingOffDays(state);
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

// --- The deductible ----------------------------------------------------------

/**
 * Phrases that turn a roofing contract into an unlawful one.
 *
 * Checked against anything that reaches a homeowner. The list is deliberately
 * blunt: a false positive costs one rewrite, a false negative costs a partner
 * their registration and us the relationship.
 *
 * Enforced in EVERY state regardless of whether that state has its own
 * statute, because absorbing a deductible is in substance a misrepresentation
 * to the carrier about the price of the work. Wyoming has no roofing
 * deductible statute and it is still not something the network does.
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

export type ComplianceCheck = { ok: true } | { ok: false; reason: string; matched: string };

export function checkDeductibleLanguage(
  text: string | null | undefined,
  state?: string | null,
): ComplianceCheck {
  if (!text) return { ok: true };
  const region = getRegion(state);
  for (const pattern of DEDUCTIBLE_RED_FLAGS) {
    const found = pattern.exec(text);
    if (found) {
      const statutory = region?.rules.deductibleProhibition ?? true;
      return {
        ok: false,
        matched: found[0],
        reason:
          `"${found[0]}" cannot go to a homeowner. ` +
          (statutory && region
            ? `${region.name} prohibits a roofing contractor paying, rebating or absorbing any ` +
              `part of an insurance deductible. `
            : `No partner in this network offers to absorb a deductible in any state — it is a ` +
              `misrepresentation to the carrier about what the work actually cost. `) +
          `The homeowner pays their deductible; the carrier is invoiced for the rest.`,
      };
    }
  }
  return { ok: true };
}

/**
 * An insurance job priced below the carrier's scope plus the deductible is the
 * same problem wearing a different hat: quoting $8,000 on a $10,000 claim with
 * a $2,000 deductible absorbs the deductible by arithmetic.
 */
export function checkInsurancePricing({
  carrierScope,
  deductible,
  sold,
}: {
  carrierScope: number | null;
  deductible: number | null;
  sold: number;
}): ComplianceCheck {
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
        `deductible, which is treated the same as waiving it outright. Price the job at ` +
        `$${owed.toLocaleString()} or more, or take it retail instead of through the claim.`,
    };
  }
  return { ok: true };
}

// --- What we may and may not say about insurance claims ----------------------

export const ADJUSTER_LINE =
  "We are not a public insurance adjuster. We can show you damage, meet your adjuster on site " +
  "and give you a written scope. Negotiating your claim on your behalf is licensed work in " +
  "most states and is not something we do.";

/** The cancellation statement that belongs next to a signature. */
export function cancellationProximityNotice(state?: string | null): string {
  const days = coolingOffDays(state);
  const words = days === 3 ? "third" : `${days}th`;
  return (
    `You, the buyer, may cancel this transaction at any time prior to midnight of the ` +
    `${words} business day after the date of this transaction. See the attached notice of ` +
    `cancellation form for an explanation of this right.`
  );
}

/** Everything a given state wants said, assembled for the contract and the site. */
export function requiredNotices(state?: string | null): string[] {
  const region = getRegion(state);
  if (!region) return [];
  const out: string[] = [];
  if (region.rules.writtenContractStatute) {
    out.push(`${region.name}: ${region.rules.writtenContractStatute}.`);
  }
  if (region.licensing.roofingRegistration) {
    out.push(`${region.name}: ${region.licensing.roofingRegistration}.`);
  }
  if (region.rules.insuranceDenialRescissionHours) {
    out.push(
      `${region.name}: where a carrier denies the claim the homeowner may rescind within ` +
        `${region.rules.insuranceDenialRescissionHours} hours and any deposit is returned.`,
    );
  }
  out.push(...region.rules.notes);
  return out;
}

/**
 * What a partner must produce before they take work in a given state.
 *
 * This is the vetting checklist, and under a referral model it is the product.
 * We are not selling construction; we are selling the claim that the person
 * turning up has been checked. That claim is worth exactly what this function
 * returns.
 */
export function vettingRequirements(state?: string | null, trades: readonly string[] = []): string[] {
  const region = getRegion(state);
  const out = [
    "Certificate of general liability insurance, current, naming us as certificate holder.",
    "W-9.",
    "Two recent customers we can call.",
  ];
  if (!region) return out;
  if (region.licensing.localLicensingCommon) {
    out.push(
      `Whatever ${region.name} city or county they work in requires — local licensing is the ` +
        `norm there, not the exception.`,
    );
  }
  if (region.licensing.roofingRegistration && trades.some((t) => /roof/i.test(t))) {
    out.push(`${region.licensing.roofingRegistration} — the number, which we verify.`);
  }
  if (region.rules.writtenContractStatute) {
    out.push(
      `A copy of the contract they use with homeowners. ${region.rules.writtenContractStatute}, ` +
        `and it is their paper, so it is ours to check.`,
    );
  }
  return out;
}

/** Trades that are licensed essentially everywhere, and are outside our scope of work. */
export const LICENSED_TRADES = [
  "Electrical",
  "Plumbing",
  "HVAC / air conditioning",
  "Lawn irrigation",
] as const;

export const LICENSED_TRADE_LINE =
  "Electrical, plumbing, HVAC and irrigation work is licensed in every state we operate in. " +
  "Where a project needs one of those, it's handled by a licensed specialist who contracts " +
  "with the homeowner directly for that portion of the work.";
