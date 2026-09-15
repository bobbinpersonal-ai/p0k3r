// What we sell in Texas, and what it costs us to sell it.
//
// Six trades, all of them unlicensed in Texas: roofing, siding, windows,
// gutters, fence and exterior paint. There is no statewide general contractor
// or remodeler licence here, and roofing in particular is licence-free (the
// RCAT certification is voluntary). Electrical, plumbing, HVAC and irrigation
// are state-licensed and are deliberately absent from this file — see
// src/lib/texas/compliance.ts for what happens when someone asks for them.
//
// Everything is priced per unit of measure rather than per job, because that
// is how a rep actually sells at a kitchen table: you measure the roof, you
// count the windows, and the number follows. Two numbers travel with every
// line:
//
//   cost — materials, labour, disposal, permit. What the job takes out of the
//          company before anyone is paid commission.
//   base — the lowest we will sell it for. Below this the job stops being
//          worth doing, so the estimator refuses it (see commission.ts).
//
// The rep sees both, and everything they sell above base is 60% theirs. That
// is the whole incentive: the price book is a floor to build on, not a
// ceiling to read out.
//
// IMPORTANT: the rates below are realistic Texas metro placeholders, not your
// numbers. Replace them with your real costs before a rep quotes off them —
// every one of these is wrong by some margin for your suppliers and your
// crews, and the structure is what this file is for.

export type UnitOfMeasure = "SQUARE" | "LINEAR_FOOT" | "OPENING";

export const UNITS: Record<UnitOfMeasure, { label: string; short: string; hint: string }> = {
  SQUARE: {
    label: "Squares",
    short: "sq",
    hint: "100 sq ft — roofing and siding are sold this way",
  },
  LINEAR_FOOT: { label: "Linear feet", short: "ft", hint: "Run along the ground or the eave" },
  OPENING: { label: "Openings", short: "ea", hint: "Count them" },
};

export type TradeOption = {
  value: string;
  label: string;
  /** What the rep says about it in one line. */
  description: string;
  /** Materials, labour, disposal and permit, per unit. */
  costPerUnit: number;
  /** The lowest price per unit we will sell at. */
  basePerUnit: number;
};

export type Trade = {
  value: string;
  label: string;
  unit: UnitOfMeasure;
  /** Below this the truck roll costs more than the job earns. */
  minimumUnits: number;
  /** A job this size is a typo, not a sale — asked to confirm, not refused. */
  implausibleAbove: number;
  options: readonly TradeOption[];
};

export const TRADES: readonly Trade[] = [
  {
    value: "ROOFING",
    label: "Roof replacement",
    unit: "SQUARE",
    minimumUnits: 8,
    implausibleAbove: 120,
    options: [
      {
        value: "THREE_TAB",
        label: "3-tab asphalt",
        description: "The builder-grade shingle. Cheapest way to get a dry roof.",
        costPerUnit: 280,
        basePerUnit: 425,
      },
      {
        value: "ARCHITECTURAL",
        label: "Architectural shingle",
        description: "Dimensional, 30-year. What most of the street has.",
        costPerUnit: 340,
        basePerUnit: 525,
      },
      {
        value: "IMPACT_CLASS4",
        label: "Class 4 impact-resistant",
        description:
          "Rated for hail. Most Texas carriers discount the premium for it — worth asking their agent.",
        costPerUnit: 425,
        basePerUnit: 650,
      },
      {
        value: "STANDING_SEAM",
        label: "Standing seam metal",
        description: "50-year roof. Costs like one, lasts like one.",
        costPerUnit: 900,
        basePerUnit: 1400,
      },
    ],
  },
  {
    value: "SIDING",
    label: "Siding",
    unit: "SQUARE",
    minimumUnits: 4,
    implausibleAbove: 90,
    options: [
      {
        value: "VINYL",
        label: "Vinyl",
        description: "Insulated vinyl, no painting ever again.",
        costPerUnit: 450,
        basePerUnit: 700,
      },
      {
        value: "FIBER_CEMENT",
        label: "Fiber cement",
        description: "Hardie board. Holds paint, ignores hail, adds resale.",
        costPerUnit: 900,
        basePerUnit: 1400,
      },
    ],
  },
  {
    value: "WINDOWS",
    label: "Windows",
    unit: "OPENING",
    minimumUnits: 3,
    implausibleAbove: 60,
    options: [
      {
        value: "VINYL_DH",
        label: "Vinyl double-hung",
        description: "Retrofit into the existing opening. No brick work.",
        costPerUnit: 450,
        basePerUnit: 750,
      },
      {
        value: "LOW_E",
        label: "Low-E double pane",
        description: "The one that makes an August electric bill survivable.",
        costPerUnit: 600,
        basePerUnit: 975,
      },
    ],
  },
  {
    value: "GUTTERS",
    label: "Gutters",
    unit: "LINEAR_FOOT",
    minimumUnits: 40,
    implausibleAbove: 600,
    options: [
      {
        value: "K5",
        label: '5" K-style aluminium',
        description: "Seamless, run on site, any colour.",
        costPerUnit: 6.5,
        basePerUnit: 11,
      },
      {
        value: "K6",
        label: '6" oversized',
        description: "For roofs that dump. Handles a Texas downpour.",
        costPerUnit: 8.5,
        basePerUnit: 14,
      },
    ],
  },
  {
    value: "FENCE",
    label: "Fence",
    unit: "LINEAR_FOOT",
    minimumUnits: 30,
    implausibleAbove: 800,
    options: [
      {
        value: "CEDAR_6",
        label: "6 ft cedar privacy",
        description: "Standard board-on-board, wood posts.",
        costPerUnit: 22,
        basePerUnit: 35,
      },
      {
        value: "CEDAR_STEEL",
        label: "6 ft cedar, steel posts",
        description: "Steel posts don't rot. This is the one that outlives the house.",
        costPerUnit: 28,
        basePerUnit: 45,
      },
    ],
  },
  {
    value: "PAINT",
    label: "Exterior paint",
    unit: "SQUARE",
    minimumUnits: 8,
    implausibleAbove: 80,
    options: [
      {
        value: "TWO_COAT",
        label: "Two-coat exterior",
        description: "Pressure wash, scrape, caulk, prime bare spots, two coats.",
        costPerUnit: 210,
        basePerUnit: 340,
      },
    ],
  },
];

export function getTrade(value: string): Trade | undefined {
  return TRADES.find((trade) => trade.value === value);
}

export function getTradeOption(trade: string, option: string): TradeOption | undefined {
  return getTrade(trade)?.options.find((o) => o.value === option);
}

export function getTradeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return getTrade(value)?.label ?? value;
}

export type MeasuredLine = {
  trade: string;
  option: string;
  quantity: number;
};

export type PricedLine = {
  trade: Trade;
  option: TradeOption;
  quantity: number;
  /** What this line takes out of the company. */
  cost: number;
  /** The lowest we will sell this line for. */
  base: number;
};

/**
 * Price one measured line.
 *
 * Undefined for a trade or option we don't carry, so a caller can treat that
 * as "we don't sell that" rather than as an error — which is what it is.
 */
export function priceLine(line: MeasuredLine): PricedLine | undefined {
  const trade = getTrade(line.trade);
  const option = getTradeOption(line.trade, line.option);
  if (!trade || !option) return undefined;
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) return undefined;

  // Below the minimum, the job is still priced — at the minimum. A crew and a
  // truck cost the same for six squares as for eight, and quoting the true
  // six-square number is how you lose money politely.
  const billable = Math.max(line.quantity, trade.minimumUnits);

  return {
    trade,
    option,
    quantity: line.quantity,
    cost: round(billable * option.costPerUnit),
    base: round(billable * option.basePerUnit),
  };
}

/** Whole-job totals from measured lines. Unknown lines are dropped, not guessed. */
export function priceJob(lines: readonly MeasuredLine[]): {
  lines: PricedLine[];
  cost: number;
  base: number;
} {
  const priced = lines
    .map(priceLine)
    .filter((line): line is PricedLine => line !== undefined);
  return {
    lines: priced,
    cost: round(priced.reduce((sum, line) => sum + line.cost, 0)),
    base: round(priced.reduce((sum, line) => sum + line.base, 0)),
  };
}

/** True when a measurement is big enough to be worth a second look. */
export function looksImplausible(line: MeasuredLine): boolean {
  const trade = getTrade(line.trade);
  return trade ? line.quantity > trade.implausibleAbove : false;
}

/** Dollars. Money is never carried as a fraction of a cent. */
function round(value: number): number {
  return Math.round(value);
}
