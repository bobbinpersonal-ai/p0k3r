// What yard work costs.
//
// Deliberately a different shape from src/lib/pricing.ts. A move is priced from
// the bottom up — hours times a wage, plus mileage — because no two moves are
// alike and the customer accepts a range. Yard work is the opposite: the
// customer wants one number before they'll call anyone, and the job repeats
// every week. So the price here is FLAT, set per (service x yard size), and the
// cost model runs underneath it as a check rather than as the thing that
// produces the number.
//
// That check matters. The prices below are business decisions — what the
// market in Sacramento and the Central Valley will pay — but they still have to
// leave enough behind to pay the crew what lovemeafter.com/drive promises.
// COST_MODEL records what each job actually takes (person-hours, crew size,
// what gets spent on fuel, blades, bags and dump fees), and the invariant test
// asserts that every price in the table clears the wage floor even at the slow
// end of its hours. Change a price and that test tells you whether you just
// priced a job below what it costs to do.
//
// Values are plain strings stored on Booking.landscapingService / Booking
// .yardSize / Booking.frequency — see the comment in schema.prisma about
// native enums.

// --- Yard sizes --------------------------------------------------------------

export type YardSize = {
  value: string;
  label: string;
  /** What the customer matches themselves against. */
  description: string;
  /** The number under the label, so nobody has to guess what "medium" means. */
  areaHint: string;
};

export const YARD_SIZES = [
  {
    value: "SMALL",
    label: "Small",
    description: "Townhouse strip, courtyard, or a patch out front",
    areaHint: "up to ~2,000 sq ft",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    description: "Standard suburban lot, front and back",
    areaHint: "~2,000–6,000 sq ft",
  },
  {
    value: "LARGE",
    label: "Large",
    description: "Big lot, corner lot, or a long back yard",
    areaHint: "~6,000–12,000 sq ft",
  },
  {
    value: "XL",
    label: "Extra large",
    description: "Quarter acre and up, or several separate areas",
    areaHint: "~12,000 sq ft and up",
  },
] as const satisfies readonly YardSize[];

export type YardSizeValue = (typeof YARD_SIZES)[number]["value"];

/**
 * A row of YARD_SIZES with its literal `value` intact.
 *
 * The `YardSize` shape above types `value` as a plain string so the array can
 * be declared against it; this is what the array actually holds, and it's what
 * callers get back, so a card taken out of the array can still be used to index
 * the price and cost tables.
 */
export type YardSizeCard = (typeof YARD_SIZES)[number];

export function isYardSizeValue(value: string): value is YardSizeValue {
  return YARD_SIZES.some((size) => size.value === value);
}

export function getYardSize(value: string): YardSizeCard | undefined {
  return YARD_SIZES.find((size) => size.value === value);
}

export function getYardSizeLabel(value: string | null | undefined): string {
  return (value ? getYardSize(value)?.label : undefined) ?? value ?? "";
}

// --- Services ----------------------------------------------------------------

export type LandscapingService = {
  value: string;
  label: string;
  description: string;
  /** The bullets on the service card — what's actually included. */
  includes: readonly string[];
  /**
   * Whether this job makes sense on a schedule.
   *
   * Mowing does: that's the whole business. Clearing a yard that's been left
   * for two years does not — offering "weekly overgrowth clearing" would be
   * selling something nobody needs twice.
   */
  allowsRecurring: boolean;
  /**
   * Set when the price covers labour only and the customer pays for materials.
   * Shown next to the price so nobody is surprised by a sod bill.
   *
   * Required rather than optional, and spelled `null` where there's nothing to
   * say, so adding a service is a decision about whether it carries a materials
   * bill rather than a field somebody forgot.
   */
  materialsNote: string | null;
};

export const LANDSCAPING_SERVICES = [
  {
    value: "MOW_EDGE_BLOW",
    label: "Mow, edge & blow",
    description: "The regular cut that keeps a yard looking looked-after",
    includes: [
      "Mow front and back",
      "Edge along walks, beds and driveway",
      "Blow down hard surfaces",
      "Clippings bagged and taken",
    ],
    allowsRecurring: true,
    materialsNote: null,
  },
  {
    value: "CLEANUP",
    label: "Cleanup & overgrowth",
    description: "A yard that got away from you, brought back to zero",
    includes: [
      "Cut down overgrowth and weeds",
      "Clear beds, fence lines and side yards",
      "Rake out leaves and debris",
      "Everything hauled away",
    ],
    allowsRecurring: false,
    materialsNote: null,
  },
  {
    value: "TRIM_HAUL",
    label: "Trimming & green-waste hauling",
    description: "Hedges, shrubs and branches cut back and taken off the property",
    includes: [
      "Shape hedges and shrubs",
      "Cut back low branches",
      "Load and haul the green waste",
      "Dump fees included",
    ],
    allowsRecurring: false,
    materialsNote: null,
  },
  {
    value: "INSTALL",
    label: "Mulch, sod & planting",
    description: "Putting something new in — turf, bark, plants, or all three",
    includes: [
      "Prep and grade the area",
      "Lay sod or spread mulch",
      "Set plants and water in",
      "Clean up after",
    ],
    allowsRecurring: false,
    materialsNote: "Labour only — sod, mulch and plants are billed at cost",
  },
] as const satisfies readonly LandscapingService[];

export type LandscapingServiceValue = (typeof LANDSCAPING_SERVICES)[number]["value"];

/** A row of LANDSCAPING_SERVICES with its literal `value` intact. */
export type LandscapingServiceCard = (typeof LANDSCAPING_SERVICES)[number];

export function isLandscapingServiceValue(value: string): value is LandscapingServiceValue {
  return LANDSCAPING_SERVICES.some((service) => service.value === value);
}

export function getLandscapingService(value: string): LandscapingServiceCard | undefined {
  return LANDSCAPING_SERVICES.find((service) => service.value === value);
}

export function getLandscapingServiceLabel(value: string | null | undefined): string {
  return (value ? getLandscapingService(value)?.label : undefined) ?? value ?? "";
}

// --- How often ---------------------------------------------------------------

export type Frequency = {
  value: string;
  label: string;
  /** Reads after the price: "$60 per visit, every week". */
  cadence: string;
  /**
   * Multiplier on the one-time price.
   *
   * Weekly and biweekly are cheaper per visit because the yard never gets away
   * from us — a lawn cut seven days ago takes a fraction of the time of one cut
   * five weeks ago. Monthly is NOT discounted for exactly that reason: by the
   * fourth week the grass is long enough that the visit costs what a one-off
   * costs. Discounting it anyway would be pricing a favour we can't afford.
   */
  priceMultiplier: number;
  /** Visits per month, for the "about $X a month" line. Null for one-offs. */
  visitsPerMonth: number | null;
};

export const FREQUENCIES = [
  {
    value: "ONE_TIME",
    label: "Just this once",
    cadence: "one visit",
    priceMultiplier: 1,
    visitsPerMonth: null,
  },
  {
    value: "WEEKLY",
    label: "Every week",
    cadence: "every week",
    priceMultiplier: 0.8,
    // 52 visits a year, not 48 — months aren't four weeks long, and quoting a
    // monthly figure off 4 undercounts what the customer actually pays.
    visitsPerMonth: 52 / 12,
  },
  {
    value: "BIWEEKLY",
    label: "Every 2 weeks",
    cadence: "every other week",
    priceMultiplier: 0.9,
    visitsPerMonth: 26 / 12,
  },
  {
    value: "MONTHLY",
    label: "Once a month",
    cadence: "once a month",
    priceMultiplier: 1,
    visitsPerMonth: 1,
  },
] as const satisfies readonly Frequency[];

export type FrequencyValue = (typeof FREQUENCIES)[number]["value"];

/** A row of FREQUENCIES with its literal `value` intact. */
export type FrequencyCard = (typeof FREQUENCIES)[number];

export const DEFAULT_FREQUENCY: FrequencyValue = "ONE_TIME";

export function isFrequencyValue(value: string): value is FrequencyValue {
  return FREQUENCIES.some((frequency) => frequency.value === value);
}

export function getFrequency(value: string): FrequencyCard | undefined {
  return FREQUENCIES.find((frequency) => frequency.value === value);
}

export function getFrequencyLabel(value: string | null | undefined): string {
  return (value ? getFrequency(value)?.label : undefined) ?? value ?? "";
}

/** The options a given service can actually be booked on. */
export function frequenciesFor(service: LandscapingServiceValue): readonly FrequencyCard[] {
  const card = getLandscapingService(service);
  return card?.allowsRecurring ? FREQUENCIES : FREQUENCIES.filter((f) => f.value === "ONE_TIME");
}

// --- The price table ---------------------------------------------------------

type PriceTable = Record<LandscapingServiceValue, Record<YardSizeValue, number>>;

/**
 * What a one-time visit costs, in dollars, before any recurring discount.
 *
 * These are the numbers on the website. They're set against what the
 * Sacramento / Central Valley market pays, not derived from the cost model —
 * but every one of them is checked against it (see COST_MODEL and the invariant
 * test) so a price can't quietly drop below what the crew has to be paid.
 */
const BASE_PRICE: PriceTable = {
  MOW_EDGE_BLOW: { SMALL: 55, MEDIUM: 75, LARGE: 110, XL: 165 },
  CLEANUP: { SMALL: 180, MEDIUM: 320, LARGE: 520, XL: 780 },
  TRIM_HAUL: { SMALL: 145, MEDIUM: 265, LARGE: 420, XL: 620 },
  INSTALL: { SMALL: 225, MEDIUM: 395, LARGE: 640, XL: 950 },
};

// --- What it costs us --------------------------------------------------------

/**
 * Crew hourly floor.
 *
 * The lowest rate lovemeafter.com/drive advertises — $19/hour for a helper. A
 * yard job has to leave at least this per person-hour after supplies, or the
 * site is promising a wage the price can't pay.
 */
const CREW_FLOOR_HOURLY = 19;

/** LoveMeAfter's cut, same as the moving side. See pricing.ts. */
const PLATFORM_RATE = 0.25;

type CostRow = {
  /** Person-hours on site, low and high. The floor check uses `high`. */
  hours: { low: number; high: number };
  /** How many people go. Drives what dispatch schedules, not the price. */
  crewSize: number;
  /**
   * Dollars per visit that leave the crew's pocket before anyone gets paid:
   * mower and truck fuel, trimmer line, blades, bags, and green-waste dump
   * fees. Subtracted from the payout before the wage floor is checked, because
   * a dump fee isn't wages.
   */
  supplies: number;
};

type CostTable = Record<LandscapingServiceValue, Record<YardSizeValue, CostRow>>;

/**
 * What each job actually takes. Used for the wage-floor check, for the "about
 * 2 hours" line on the quote, and for telling dispatch how many people to send.
 */
const COST_MODEL: CostTable = {
  MOW_EDGE_BLOW: {
    SMALL: { hours: { low: 0.4, high: 0.75 }, crewSize: 1, supplies: 8 },
    MEDIUM: { hours: { low: 0.75, high: 1.25 }, crewSize: 1, supplies: 10 },
    LARGE: { hours: { low: 1.25, high: 2 }, crewSize: 1, supplies: 14 },
    XL: { hours: { low: 2, high: 3 }, crewSize: 2, supplies: 20 },
  },
  CLEANUP: {
    SMALL: { hours: { low: 2, high: 3 }, crewSize: 2, supplies: 45 },
    MEDIUM: { hours: { low: 3.5, high: 5.5 }, crewSize: 2, supplies: 65 },
    LARGE: { hours: { low: 6, high: 9 }, crewSize: 3, supplies: 95 },
    XL: { hours: { low: 9, high: 13 }, crewSize: 3, supplies: 130 },
  },
  TRIM_HAUL: {
    SMALL: { hours: { low: 1.5, high: 2.5 }, crewSize: 2, supplies: 35 },
    MEDIUM: { hours: { low: 2.5, high: 4 }, crewSize: 2, supplies: 50 },
    LARGE: { hours: { low: 4, high: 6.5 }, crewSize: 2, supplies: 75 },
    XL: { hours: { low: 6, high: 9.5 }, crewSize: 3, supplies: 105 },
  },
  INSTALL: {
    SMALL: { hours: { low: 2, high: 3.5 }, crewSize: 2, supplies: 20 },
    MEDIUM: { hours: { low: 3.5, high: 6 }, crewSize: 2, supplies: 30 },
    LARGE: { hours: { low: 6, high: 10 }, crewSize: 3, supplies: 45 },
    XL: { hours: { low: 9, high: 15 }, crewSize: 3, supplies: 65 },
  },
};

/**
 * Round *up* to the next $5, for the same reason pricing.ts does: rounding to
 * the nearest would shave up to $2.50 off a recurring visit, every visit,
 * straight out of the crew's share.
 */
function ceilToFive(value: number): number {
  return Math.ceil(value / 5) * 5;
}

export type LandscapingQuote = {
  service: LandscapingServiceCard;
  yardSize: YardSizeCard;
  frequency: FrequencyCard;
  /** What the customer pays each visit. The headline number. */
  perVisit: number;
  /** What a one-off would have cost, when a recurring plan beat it. */
  oneTimePrice: number;
  /** Dollars saved per visit by being on a schedule. Zero for one-offs. */
  recurringSavings: number;
  /** Roughly what a month costs on this plan. Null for one-offs. */
  monthlyTotal: number | null;
  /** On-site person-hours, for the "about 2 hours of work" line. */
  hoursLow: number;
  hoursHigh: number;
  crewSize: number;
  /** The crew's share of what the customer pays, before tips. */
  crewPayout: number;
  platformFee: number;
};

/**
 * Price one yard job.
 *
 * Returns undefined only for combinations that don't exist (an unknown service
 * or size), so callers can treat undefined as "we don't do that" rather than
 * as an error.
 */
export function quoteLandscaping(
  service: LandscapingServiceValue,
  yardSize: YardSizeValue,
  frequencyValue: FrequencyValue = DEFAULT_FREQUENCY,
): LandscapingQuote | undefined {
  const serviceCard = getLandscapingService(service);
  const sizeCard = getYardSize(yardSize);
  if (!serviceCard || !sizeCard) return undefined;

  // A one-off service asked for on a schedule is priced — and delivered — as
  // the one-off it is, rather than refused. Someone who ticks "every week" on
  // a sod install has misread the form, not asked for something impossible.
  const requested = getFrequency(frequencyValue);
  const frequency =
    requested && (serviceCard.allowsRecurring || requested.value === "ONE_TIME")
      ? requested
      : getFrequency("ONE_TIME")!;

  const oneTimePrice = BASE_PRICE[service][yardSize];
  const perVisit = ceilToFive(oneTimePrice * frequency.priceMultiplier);
  const cost = COST_MODEL[service][yardSize];

  const crewPayout = Math.ceil(perVisit * (1 - PLATFORM_RATE));

  return {
    service: serviceCard,
    yardSize: sizeCard,
    frequency,
    perVisit,
    oneTimePrice,
    recurringSavings: Math.max(0, oneTimePrice - perVisit),
    monthlyTotal:
      frequency.visitsPerMonth === null
        ? null
        : Math.round(perVisit * frequency.visitsPerMonth),
    hoursLow: cost.hours.low,
    hoursHigh: cost.hours.high,
    crewSize: cost.crewSize,
    crewPayout,
    platformFee: perVisit - crewPayout,
  };
}

/** Every size priced for one service — the cards on the "how big" step. */
export function quoteYardSizes(
  service: LandscapingServiceValue,
  frequency: FrequencyValue = DEFAULT_FREQUENCY,
): LandscapingQuote[] {
  return YARD_SIZES.map((size) => quoteLandscaping(service, size.value, frequency)).filter(
    (quote): quote is LandscapingQuote => quote !== undefined,
  );
}

/**
 * The cheapest a service starts at, for the "from $55" line on the service
 * cards. Always the one-time small-yard price — never a recurring rate, which
 * would advertise a number most people can't have.
 */
export function startingPriceFor(service: LandscapingServiceValue): number {
  return BASE_PRICE[service].SMALL;
}

/**
 * What the crew clears per person-hour on a job, after supplies and the
 * platform's cut, at the slow end of the hours estimate.
 *
 * This is the number the wage floor is checked against — exported so the
 * invariant test and any future admin view compute it the same way rather than
 * each re-deriving it and drifting.
 */
export function crewPerPersonHour(quote: LandscapingQuote): number {
  const cost = COST_MODEL[quote.service.value][quote.yardSize.value];
  return (quote.crewPayout - cost.supplies) / cost.hours.high;
}

/** Exposed for the pricing invariant check and any future admin view. */
export const LANDSCAPING_CONSTANTS = {
  BASE_PRICE,
  COST_MODEL,
  PLATFORM_RATE,
  CREW_FLOOR_HOURLY,
};
