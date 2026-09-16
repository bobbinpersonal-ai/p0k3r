// What the rep earns, and the floor they cannot sell through.
//
// The comp structure is the product decision that shapes everything else: the
// price book gives a base, and the rep keeps 60% of whatever they sell above
// it. That is why the estimator shows a rep our cost and our base rather than
// hiding them — a rep who can see the floor sells above it on purpose, and a
// rep who cannot just reads the first number on the screen.
//
// The floor is enforced rather than advised. Selling below base is not a
// discount, it is the company paying for the privilege of doing the work, and
// a rep under pressure at a kitchen table at 8pm should not be the last thing
// standing between us and a job we lose money on. Same reasoning as the crew
// wage floor on the California side: the rule lives in code, not in a memo.

import { priceJob, type MeasuredLine, type Trade } from "@/lib/regions/trades";

/** The rep's share of everything sold above base. */
export const OVERAGE_RATE = 0.6;

/**
 * The rep's share of the base itself.
 *
 * Zero by default and deliberately so: nobody has told me what it should be,
 * and inventing a number here would quietly change what every rep is owed.
 * Set it per company (or per rep) before the first cheque — a structure that
 * pays only on overage is legal but brutal, and it is not what most shops run.
 */
export const DEFAULT_BASE_COMMISSION_RATE = 0;

export type CommissionTerms = {
  /** Fraction of the base price the rep earns. */
  baseRate: number;
  /** Fraction of the amount above base the rep earns. */
  overageRate: number;
};

export const DEFAULT_TERMS: CommissionTerms = {
  baseRate: DEFAULT_BASE_COMMISSION_RATE,
  overageRate: OVERAGE_RATE,
};

export type Deal = {
  /** What the job takes out of the company. */
  cost: number;
  /** The lowest we will sell it for. */
  base: number;
  /** What the rep actually sold it for. */
  sold: number;
  /** On the base, and on the overage. */
  baseCommission: number;
  overage: number;
  overageCommission: number;
  commission: number;
  /** What is left after the job is done and the rep is paid. */
  grossProfit: number;
  /** Gross profit as a share of the sold price, 0–1. */
  margin: number;
};

/**
 * Work out a deal at a given sold price.
 *
 * Returns undefined when the price is below base, rather than returning a
 * negative or clamping silently: the caller has to decide what to do about a
 * price we won't accept, and every caller so far decides to refuse it.
 */
export function dealAt(
  { cost, base }: { cost: number; base: number },
  sold: number,
  terms: CommissionTerms = DEFAULT_TERMS,
): Deal | undefined {
  if (!Number.isFinite(sold) || sold < base) return undefined;

  const overage = sold - base;
  const baseCommission = round(base * terms.baseRate);
  const overageCommission = round(overage * terms.overageRate);
  const commission = baseCommission + overageCommission;

  return {
    cost,
    base,
    sold,
    baseCommission,
    overage: round(overage),
    overageCommission,
    commission,
    grossProfit: round(sold - cost - commission),
    margin: sold > 0 ? (sold - cost - commission) / sold : 0,
  };
}

/** The same thing straight from the measurements, for the estimator screen. */
export function dealForLines(
  lines: readonly MeasuredLine[],
  sold: number,
  terms: CommissionTerms = DEFAULT_TERMS,
  book?: readonly Trade[],
): Deal | undefined {
  const { cost, base } = priceJob(lines, book);
  return dealAt({ cost, base }, sold, terms);
}

/**
 * What the rep would earn at a given price — for the live readout as they
 * drag the number up. Zero below base rather than undefined, because this
 * feeds a display, not a decision.
 */
export function commissionAt(
  base: number,
  sold: number,
  terms: CommissionTerms = DEFAULT_TERMS,
): number {
  if (sold < base) return 0;
  return round(base * terms.baseRate) + round((sold - base) * terms.overageRate);
}

/**
 * The price a rep has to reach to earn a given commission.
 *
 * Runs the arithmetic backwards for the "what do I need to sell this at to
 * make $2,000?" question, which is the question every rep actually asks.
 */
export function priceForCommission(
  base: number,
  target: number,
  terms: CommissionTerms = DEFAULT_TERMS,
): number {
  const fromBase = round(base * terms.baseRate);
  if (target <= fromBase) return base;
  if (terms.overageRate <= 0) return base;
  return Math.ceil(base + (target - fromBase) / terms.overageRate);
}

function round(value: number): number {
  return Math.round(value);
}
