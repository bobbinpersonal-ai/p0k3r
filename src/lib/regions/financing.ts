import { COMPANY, FINANCING_PARTNER, FINANCING_ENABLED } from "@/lib/regions/brand";

// Point-of-sale financing on an estimate.
//
// A FINANCING rail already existed in payments.ts and FINANCING_PARTNER
// already existed in brand.ts; what was missing was the arithmetic and the
// disclosure, so nothing could actually show a homeowner a monthly payment.
// This is that, and nothing more — we are not the lender, we do not approve
// anybody, and we do not take the credit risk.
//
// WHY THIS MODULE IS CAUTIOUS ABOUT A NUMBER THAT LOOKS HARMLESS.
//
// "As low as $89/mo" is a triggering term under Regulation Z (12 CFR 1026.24,
// implementing TILA). Advertising the amount of any payment on closed-end
// credit obliges the advertiser to also disclose the down payment, the terms
// of repayment and the annual percentage rate, in the same advert, with equal
// prominence. A monthly figure on its own — the thing the brief asked for —
// is the exact violation the rule is written about, and it is the most common
// one in home improvement.
//
// So: this module will not produce a payment figure unless it has a real APR
// and a real term to show beside it, and quote() returns null rather than
// guessing. If no plans are configured, the UI shows a "financing available,
// ask us" line with no numbers in it, which is lawful and still useful.
//
// NOBODY HAS GIVEN US LENDER TERMS YET. FINANCING_PLANS reads them from the
// environment and is empty by default on purpose. Do not hardcode an APR to
// make the component look finished: a wrong APR on a screen a homeowner signs
// next to is a consumer-credit problem, not a styling bug.

export type FinancingPlan = {
  id: string;
  /** What the lender calls it, for the disclosure. */
  label: string;
  /** Annual percentage rate as a fraction, e.g. 0.0999. From the lender. */
  apr: number;
  termMonths: number;
  /** The range this plan is actually offered over, in dollars. */
  minAmount: number;
  maxAmount: number;
};

/**
 * The contract value below which we do not offer financing.
 *
 * Small jobs do not justify a credit application and the monthly figure is
 * not persuasive anyway. The brief put this at $2,000 and that is kept.
 */
export const FINANCING_MIN_AMOUNT = 2_000;

/**
 * Lender plans, from the environment.
 *
 * Format: NEXT_PUBLIC_FINANCING_PLANS as JSON, an array of FinancingPlan.
 * Empty when unset, which is the current state — see the header.
 */
export const FINANCING_PLANS: readonly FinancingPlan[] = parsePlans(
  process.env.NEXT_PUBLIC_FINANCING_PLANS,
);

function parsePlans(raw: string | undefined): FinancingPlan[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPlan);
  } catch {
    // A malformed env var must not take the site down, and must not
    // silently become a made-up APR either. No plans means no numbers.
    return [];
  }
}

function isPlan(v: unknown): v is FinancingPlan {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.label === "string" &&
    typeof p.apr === "number" &&
    p.apr >= 0 &&
    p.apr < 1 &&
    typeof p.termMonths === "number" &&
    p.termMonths > 0 &&
    typeof p.minAmount === "number" &&
    typeof p.maxAmount === "number"
  );
}

/** Whether we can lawfully show a payment figure at all. */
export const FINANCING_CONFIGURED = FINANCING_ENABLED && FINANCING_PLANS.length > 0;

/**
 * The standard amortised payment.
 *
 * principal × r / (1 − (1 + r)^−n), with the zero-rate case handled because
 * promotional 0% plans are common in this trade and the general formula
 * divides by zero on them.
 */
export function monthlyPayment(principal: number, apr: number, termMonths: number): number {
  if (!(principal > 0) || !(termMonths > 0)) return 0;
  if (apr <= 0) return principal / termMonths;
  const r = apr / 12;
  return (principal * r) / (1 - Math.pow(1 + r, -termMonths));
}

export type FinancingQuote = {
  plan: FinancingPlan;
  /** Rounded up — quoting below the real payment is the wrong direction. */
  monthly: number;
  apr: number;
  termMonths: number;
  totalOfPayments: number;
  totalInterest: number;
};

/**
 * The best plan for an amount, or null when we must not quote one.
 *
 * "Best" is the lowest monthly payment among plans that actually cover the
 * amount, which is what a homeowner is choosing on. Returns null below the
 * minimum, when nothing is configured, or when no plan's range covers the
 * job — never a fallback, because a fallback here is an invented APR.
 */
export function quote(amount: number): FinancingQuote | null {
  if (!FINANCING_CONFIGURED) return null;
  if (!(amount >= FINANCING_MIN_AMOUNT)) return null;

  const eligible = FINANCING_PLANS.filter(
    (p) => amount >= p.minAmount && amount <= p.maxAmount,
  );
  if (eligible.length === 0) return null;

  let best: FinancingQuote | null = null;
  for (const plan of eligible) {
    // Rounded up to the cent, then to the dollar on display. A payment quoted
    // a dollar light is a payment the lender's paperwork contradicts.
    const monthly = Math.ceil(monthlyPayment(amount, plan.apr, plan.termMonths));
    const totalOfPayments = monthly * plan.termMonths;
    const candidate: FinancingQuote = {
      plan,
      monthly,
      apr: plan.apr,
      termMonths: plan.termMonths,
      totalOfPayments,
      totalInterest: Math.max(totalOfPayments - amount, 0),
    };
    if (!best || candidate.monthly < best.monthly) best = candidate;
  }
  return best;
}

/**
 * The disclosure that must appear wherever a payment figure does.
 *
 * Regulation Z requires the APR and the repayment terms alongside the
 * payment amount, with equal prominence. The component renders all three
 * together and this sentence carries the rest: who the lender is, that it is
 * subject to approval, and that we are not the one lending.
 */
export function financingDisclosure(q: FinancingQuote): string {
  const aprText = `${(q.apr * 100).toFixed(2)}% APR`;
  const lender = FINANCING_PARTNER || "our lending partner";
  return (
    `Estimated payment of $${q.monthly.toLocaleString("en-US")} per month for ` +
    `${q.termMonths} months at ${aprText}, with no down payment required. ` +
    `Total of payments $${q.totalOfPayments.toLocaleString("en-US")}. ` +
    `Financing is provided by ${lender}, not by ${COMPANY.name}, and is subject to credit ` +
    `approval; your rate and term may differ. This is an estimate, not an offer of credit.`
  );
}

/** The line to show when financing exists but we cannot quote a figure. */
export const FINANCING_UNQUOTED =
  "Monthly payment plans are available on this job, subject to credit approval. " +
  "Ask us and we will send you the lender's application.";
