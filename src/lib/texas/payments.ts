// How a Texas construction job actually gets paid for.
//
// The California side of this business takes $70 deposits on Venmo and Apple
// Cash, and for a $350 yard job that is exactly right. A $20,000 roof is a
// different animal and the same rails break in three separate ways:
//
//   1. Limits. Consumer peer-to-peer rails are built for splitting dinner.
//      Venmo and Apple Cash both cap well below a roof, so a homeowner trying
//      to pay a real invoice hits a wall mid-transaction — which they
//      experience as us looking amateur.
//   2. Reversibility. Zelle and Apple Cash are irreversible by design and have
//      no buyer protection whatsoever. A homeowner handing five figures to a
//      contractor they met last week, on a rail with no recourse, is being
//      asked to take a risk no sensible person takes. Losing that sale is the
//      good outcome; the bad one is the customer who pays, panics, and files a
//      complaint that reads like fraud.
//   3. Fees, at the other end. Card is the rail customers reach for and 2.9%
//      of a roof is real money — roughly six hundred dollars, which is most of
//      a crew day.
//
// So the rails here are graded by amount rather than offered as a flat menu,
// and the schedule matters more than the rail: nobody should be paying for a
// roof in one lump, in either direction.
//
// Two Texas rules shape the schedule rather than merely decorating it:
//
//   - Property Code Ch. 162. What a homeowner pays is a construction trust
//      fund. It pays that job's labour and material. Using a deposit as
//      working capital for a different job is misapplication of trust funds,
//      which is criminal, and it is the single easiest way for a growing
//      contractor to end up in genuine trouble without ever intending to.
//   - Bus. & Com. Code Ch. 601. A sale agreed at the kitchen table can be
//      cancelled for three business days. Money taken before that window
//      closes is money that may have to go back, so it does not get spent and
//      the job does not get started.
//
// Fee figures are the published rates I know of and they move. Confirm the
// current ones with each processor before quoting them to anybody.

import type { JobKind } from "@/lib/texas/contracts";

export type RailValue = "ACH" | "CARD" | "CHECK" | "FINANCING" | "ZELLE" | "APPLE_PAY";

export type Rail = {
  value: RailValue;
  label: string;
  /** Largest sensible single payment on this rail, in dollars. */
  practicalMax: number;
  /** Percentage fee, as a fraction. */
  rate: number;
  /** Flat fee per transaction, in dollars. */
  flat: number;
  /** Cap on the percentage fee, where the processor applies one. */
  feeCap: number | null;
  /** Whether the payer can claw it back. Matters to the customer, not to us. */
  reversible: boolean;
  /** Plain-language note for the rep and the admin screen. */
  note: string;
};

/**
 * The rails, worst-to-best is not the order — the order is what a homeowner
 * reaches for first, because that is the order the conversation happens in.
 *
 * `practicalMax` is deliberately not the processor's hard ceiling. It is the
 * amount above which this rail starts costing somebody real money or real
 * risk, which is the number a rep standing in a kitchen actually needs.
 */
export const RAILS: readonly Rail[] = [
  {
    value: "ACH",
    label: "Bank transfer (ACH)",
    practicalMax: 100_000,
    rate: 0.008,
    flat: 0,
    feeCap: 5,
    reversible: true,
    note:
      "The right rail for job-sized money. Fee is capped at about $5 however large the " +
      "payment, it clears in a couple of days, and the customer keeps a dispute route.",
  },
  {
    value: "CHECK",
    label: "Cheque",
    practicalMax: 100_000,
    rate: 0,
    flat: 0,
    feeCap: null,
    reversible: true,
    note:
      "Free, and still how most insurance money arrives. Slow to clear, and do not start " +
      "work against one until it has.",
  },
  {
    value: "CARD",
    label: "Credit or debit card",
    practicalMax: 5_000,
    rate: 0.029,
    flat: 0.3,
    feeCap: null,
    reversible: true,
    note:
      "Fine for a deposit, expensive for a job. 2.9% of a roof is roughly a crew day. Use it " +
      "for the deposit and move the balance to ACH.",
  },
  {
    value: "FINANCING",
    label: "Financing",
    practicalMax: 100_000,
    rate: 0,
    flat: 0,
    feeCap: null,
    reversible: false,
    note:
      "The lender pays us and the homeowner pays the lender. Dealer fees vary by programme " +
      "and come out of the job, so price them in before offering a monthly number.",
  },
  {
    value: "ZELLE",
    label: "Zelle",
    practicalMax: 2_500,
    rate: 0,
    flat: 0,
    feeCap: null,
    reversible: false,
    note:
      "Free and instant, and irreversible with no buyer protection. Fine for paying crews. " +
      "Asking a homeowner to send five figures this way is what a scam looks like from their " +
      "side, and most banks cap it well below a job anyway.",
  },
  {
    value: "APPLE_PAY",
    label: "Apple Cash",
    practicalMax: 2_000,
    rate: 0,
    flat: 0,
    feeCap: null,
    reversible: false,
    note:
      "Same shape as Zelle: good for crews, wrong for customers at job size, and capped per " +
      "message and per week.",
  },
];

export function getRail(value: string): Rail | undefined {
  return RAILS.find((r) => r.value === value);
}

/** What a payment on this rail costs us. */
export function feeFor(rail: Rail, amount: number): number {
  const pct = rail.feeCap === null ? amount * rail.rate : Math.min(amount * rail.rate, rail.feeCap);
  return Math.round((pct + rail.flat) * 100) / 100;
}

/** Rails that can sensibly carry this amount, cheapest first. */
export function railsFor(amount: number): Rail[] {
  return RAILS.filter((r) => amount <= r.practicalMax).sort(
    (a, b) => feeFor(a, amount) - feeFor(b, amount),
  );
}

/**
 * Refuse, in words, to send a homeowner an irreversible link for job money.
 *
 * Returns null when the pairing is fine. This is advice rather than a hard
 * block because there are edge cases — a $900 gutter job on Zelle is not a
 * scandal — but it should be loud by default.
 */
export function railWarning(rail: Rail, amount: number, payingCustomer: boolean): string | null {
  if (amount > rail.practicalMax) {
    return (
      `${rail.label} is not built for ${fmt(amount)}. It gets awkward above about ` +
      `${fmt(rail.practicalMax)}` +
      (rail.reversible ? "." : ", and it cannot be reversed if anything goes wrong.")
    );
  }
  if (payingCustomer && !rail.reversible && amount >= 1_000) {
    return (
      `${rail.label} gives the homeowner no protection at all. At ${fmt(amount)} that is a ` +
      `lot to ask of somebody who met us this week — offer bank transfer or card instead.`
    );
  }
  return null;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// --- The schedule ------------------------------------------------------------

export type Stage = {
  key: string;
  label: string;
  amount: number;
  /** When it comes due, in words the customer reads on the contract. */
  due: string;
  /** Rails we will actually take for this stage. */
  rails: RailValue[];
};

/**
 * Deposit sizing.
 *
 * Small on purpose. A contractor asking for half up front is the thing every
 * consumer-protection article tells homeowners to run from, and they are right
 * to — it is also money we would be holding in trust and unable to spend. Ten
 * percent covers mobilising, and the material draw does the rest when there is
 * something physical on the driveway to show for it.
 */
export const DEPOSIT_RATE = 0.1;
export const DEPOSIT_MINIMUM = 500;
export const DEPOSIT_MAXIMUM = 2_500;

export function depositFor(soldPrice: number): number {
  if (soldPrice <= DEPOSIT_MINIMUM) return 0;
  return Math.min(
    Math.max(Math.round((soldPrice * DEPOSIT_RATE) / 50) * 50, DEPOSIT_MINIMUM),
    DEPOSIT_MAXIMUM,
  );
}

/**
 * The stages of a job, retail or insurance.
 *
 * Insurance is genuinely a different cash flow rather than the same one with
 * different words on it. The carrier pays actual cash value first, holds back
 * depreciation, and releases that only once the work is done and invoiced —
 * so the homeowner's own money in the middle is the deductible, and nothing
 * else. Building the schedule to match means nobody has to explain later why
 * the numbers on the contract did not match the cheques that arrived.
 */
export function paymentSchedule({
  soldPrice,
  jobKind,
  deductible,
  deposit,
}: {
  soldPrice: number;
  jobKind: JobKind;
  deductible?: number | null;
  deposit?: number | null;
}): Stage[] {
  if (jobKind === "INSURANCE") {
    const owed = deductible ?? 0;
    return [
      {
        key: "acv",
        label: "Carrier's first payment (actual cash value)",
        amount: Math.max(soldPrice - owed, 0),
        due:
          "When your carrier issues it. It usually arrives made out to you, and to your " +
          "mortgage company if you have one — they endorse it too.",
        rails: ["CHECK", "ACH"],
      },
      {
        key: "deductible",
        label: "Your deductible",
        amount: owed,
        due:
          "On completion. This is your obligation under your own policy. We will not pay, " +
          "rebate or absorb any part of it, and nobody else honest will either.",
        rails: ["ACH", "CARD", "CHECK", "FINANCING"],
      },
      {
        key: "depreciation",
        label: "Recoverable depreciation",
        amount: 0,
        due:
          "Your carrier releases this after the work is finished and we send them the final " +
          "invoice and photographs. It comes to you and you pass it to us.",
        rails: ["CHECK", "ACH"],
      },
    ];
  }

  const down = deposit ?? depositFor(soldPrice);
  const material = Math.round((soldPrice - down) * 0.5);
  const final = soldPrice - down - material;

  return [
    {
      key: "deposit",
      label: "Deposit",
      amount: down,
      due:
        "On signing. We do not bank it, order material or start work until your three " +
        "business days to cancel have passed.",
      rails: ["ACH", "CARD", "CHECK"],
    },
    {
      key: "material",
      label: "Material draw",
      amount: material,
      due: "When material is delivered to your property and you can see it there.",
      rails: ["ACH", "CHECK", "FINANCING"],
    },
    {
      key: "final",
      label: "Balance",
      amount: final,
      due: "When the work is finished, the site is clean and you have walked it with us.",
      rails: ["ACH", "CHECK", "CARD", "FINANCING"],
    },
  ];
}

/**
 * Money we are holding that is not ours to spend yet.
 *
 * Two separate reasons a payment is untouchable: the buyer can still cancel
 * under Ch. 601, or it is a trust fund under Ch. 162 earmarked for this job's
 * labour and material. Both are real; the first expires, the second does not.
 */
export const TRUST_RULE =
  "Everything a customer pays is that job's money until that job's labour and material are " +
  "paid for. It is not working capital, it is not payroll for another job, and Texas " +
  "Property Code Chapter 162 makes spending it elsewhere a criminal offence rather than a " +
  "cash-flow decision.";

export const CANCEL_HOLD_RULE =
  "A deposit taken at a kitchen table stays untouched until the customer's three business " +
  "days to cancel have run out. Do not bank it, do not order against it, do not schedule a " +
  "crew on it.";
