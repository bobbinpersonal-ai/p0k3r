// What the network routes, and what it costs a partner to do it.
//
// Six trades, none of them licensed at state level anywhere in the network
// (Kansas roofing registration aside): roofing, siding, windows,
// gutters, fence and exterior paint. There is no statewide general contractor
// or remodeler licence here, and roofing in particular is licence-free (the
// RCAT certification is voluntary). Electrical, plumbing, HVAC and irrigation
// are state-licensed and are deliberately absent from this file — see
// src/lib/regions/compliance.ts for what happens when someone asks for them.
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
// IMPORTANT: the rates below are realistic metro placeholders, not your
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

/**
 * Where an option sits in a good/better/best presentation.
 *
 * In-home construction is sold in threes. A rep who opens with one number is
 * negotiating; a rep who lays out three is letting the homeowner choose, and
 * the middle one wins most of the time — which is why the middle one is the
 * one to get the margin right on.
 */
export type Tier = "GOOD" | "BETTER" | "BEST";

export type TradeOption = {
  value: string;
  label: string;
  /** What the rep says about it in one line. */
  description: string;

  /**
   * The manufacturer, where there is one.
   *
   * This matters more than it looks. A homeowner has heard of Owens Corning
   * and has not heard of us, so the brand is doing a large share of the
   * closing — "architectural shingle" and "TruDefinition Duration" are the
   * same roof and they do not sell the same way. Null for unbranded work like
   * a cedar fence.
   */
  brand: string | null;
  /** The product line within that brand, e.g. "TruDefinition Duration". */
  line: string | null;
  tier: Tier;

  /**
   * Warranty as the manufacturer states it.
   *
   * Free text and deliberately not parsed, because it belongs to them, not to
   * us. Copy it from the dealer materials verbatim — misstating a
   * manufacturer's warranty on a contract is its own category of problem, and
   * the terms change with certification level and registration.
   */
  warranty: string | null;
  /** Three or four things a rep actually says at the table. */
  sellingPoints: readonly string[];

  /** Materials, labour, disposal and permit, per unit. */
  costPerUnit: number;
  /** The lowest price per unit we will sell at. */
  basePerUnit: number;
};

export type Trade = {
  value: string;
  label: string;
  /**
   * One line about the trade for the public site.
   *
   * Separate from the options' descriptions on purpose: an option describes a
   * product, and borrowing the first one meant the roofing card opened with
   * "builder-grade, cheapest way to get a dry roof" — leading with the thing
   * we least want to sell.
   */
  blurb: string;
  unit: UnitOfMeasure;
  /** Below this the truck roll costs more than the job earns. */
  minimumUnits: number;
  /** A job this size is a typo, not a sale — asked to confirm, not refused. */
  implausibleAbove: number;
  /**
   * Where this trade stops.
   *
   * Data rather than a note, because on some trades it is the compliance
   * boundary and not a marketing caveat. Garage doors is the clearest case:
   * hanging the door is unlicensed work, and running a new circuit for the
   * opener is licensed electrical. The line has to be somewhere a rep and a
   * crew both read.
   */
  excludes: readonly string[];
  options: readonly TradeOption[];
};

export const TRADES: readonly Trade[] = [
  {
    value: "ROOFING",
    label: "Roof replacement",
    blurb: "Tear-off to final nail in a day, most houses.",
    unit: "SQUARE",
    minimumUnits: 8,
    implausibleAbove: 120,
    excludes: [],
    options: [
      {
        value: "OC_OAKRIDGE",
        label: "Owens Corning Oakridge",
        description: "Entry architectural shingle from a brand they have heard of.",
        brand: "Owens Corning",
        line: "Oakridge",
        tier: "GOOD",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "The cheapest way to put a name on the roof",
          "Dimensional look without the dimensional price",
        ],
        costPerUnit: 330,
        basePerUnit: 500,
      },
      {
        value: "OC_DURATION",
        label: "Owens Corning TruDefinition Duration",
        description: "The volume seller. The one most of these roofs should be.",
        brand: "Owens Corning",
        line: "TruDefinition Duration",
        tier: "BETTER",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "SureNail nailing strip — the fastening everybody else copies",
          "Colour range that actually matches brick",
          "Qualifies for the system warranty if we install the full system",
        ],
        costPerUnit: 385,
        basePerUnit: 585,
      },
      {
        value: "OC_DURATION_STORM",
        label: "Owens Corning Duration STORM",
        description: "Impact-rated. In a hail county this is the conversation.",
        brand: "Owens Corning",
        line: "Duration STORM",
        tier: "BEST",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "Class 4 impact rating — the top one there is",
          "Many carriers discount the premium for Class 4. Ask your agent",
          "The roof you do not replace again after the next storm",
        ],
        costPerUnit: 470,
        basePerUnit: 715,
      },
      {
        value: "THREE_TAB",
        label: "3-tab asphalt",
        description: "The builder-grade shingle. Cheapest way to get a dry roof.",
        brand: null,
        line: null,
        tier: "GOOD",
        warranty: null,
        sellingPoints: [
          "It keeps the water out and it is the cheapest way to do that.",
          "Fine on a rental or a house you are selling.",
        ],
        costPerUnit: 280,
        basePerUnit: 425,
      },
      {
        value: "ARCHITECTURAL",
        label: "Architectural shingle",
        description: "Dimensional, 30-year. What most of the street has.",
        brand: null,
        line: null,
        tier: "BETTER",
        warranty: null,
        sellingPoints: [
          "What most of this street has.",
          "Thirty-year shingle, dimensional look.",
        ],
        costPerUnit: 340,
        basePerUnit: 525,
      },
      {
        value: "IMPACT_CLASS4",
        label: "Class 4 impact-resistant",
        description:
          "Rated for hail. Many carriers discount the premium for it — worth asking their agent.",
        brand: null,
        line: null,
        tier: "BEST",
        warranty: null,
        sellingPoints: [
          "Rated for hail, which in this county is the whole argument.",
          "Ask your agent about the premium discount — many carriers give one.",
        ],
        costPerUnit: 425,
        basePerUnit: 650,
      },
      {
        value: "STANDING_SEAM",
        label: "Standing seam metal",
        description: "50-year roof. Costs like one, lasts like one.",
        brand: null,
        line: null,
        tier: "BEST",
        warranty: null,
        sellingPoints: [
          "Fifty-year roof. You will not do this again.",
        ],
        costPerUnit: 900,
        basePerUnit: 1400,
      },
    ],
  },
  {
    value: "SIDING",
    label: "Siding",
    blurb: "Hardie board that ignores hail and holds paint for fifteen years.",
    unit: "SQUARE",
    minimumUnits: 4,
    implausibleAbove: 90,
    excludes: [],
    options: [
      {
        value: "ALSIDE_PRODIGY",
        label: "Alside Prodigy",
        description: "Insulated vinyl. Thicker, flatter, quieter than standard.",
        brand: "Alside",
        line: "Prodigy",
        tier: "BETTER",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "Insulation bonded to the panel, so it lies flat instead of waving",
          "Noticeably quieter inside",
          "No painting for the life of it",
        ],
        costPerUnit: 620,
        basePerUnit: 950,
      },
      {
        value: "ALSIDE_ASCEND",
        label: "Alside Ascend",
        description: "Composite cladding. Looks like paint, behaves like vinyl.",
        brand: "Alside",
        line: "Ascend",
        tier: "BEST",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "Deep, flat finish — reads as painted wood from the kerb",
          "Colours vinyl cannot hold",
          "No repaint cycle, ever",
        ],
        costPerUnit: 1050,
        basePerUnit: 1600,
      },
      {
        value: "VINYL",
        label: "Vinyl",
        description: "Insulated vinyl, no painting ever again.",
        brand: null,
        line: null,
        tier: "GOOD",
        warranty: null,
        sellingPoints: [
          "No painting, ever again.",
        ],
        costPerUnit: 450,
        basePerUnit: 700,
      },
      {
        value: "FIBER_CEMENT",
        label: "Fiber cement",
        description: "Hardie board. Holds paint, ignores hail, adds resale.",
        brand: null,
        line: null,
        tier: "BEST",
        warranty: null,
        sellingPoints: [
          "Holds paint, ignores hail, and appraisers like it.",
        ],
        costPerUnit: 900,
        basePerUnit: 1400,
      },
    ],
  },
  {
    value: "WINDOWS",
    label: "Windows",
    blurb: "The reason your August electric bill is what it is.",
    unit: "OPENING",
    minimumUnits: 3,
    implausibleAbove: 60,
    excludes: [],
    options: [
      {
        value: "ANLIN_CATALINA",
        label: "Anlin Catalina",
        description: "Vinyl replacement window, retrofit into the opening.",
        brand: "Anlin",
        line: "Catalina",
        tier: "BETTER",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "Made to the opening, not cut down to fit",
          "Dual-pane with a real spacer, not a stick-on grid",
          "Goes in without touching the brick",
        ],
        costPerUnit: 620,
        basePerUnit: 1025,
      },
      {
        value: "ANLIN_DEL_MAR",
        label: "Anlin Del Mar",
        description: "Their top line. The window you sell on the West-facing wall.",
        brand: "Anlin",
        line: "Del Mar",
        tier: "BEST",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "The one that changes what a west-facing room feels like at 5pm",
          "Heavier frame, tighter seal",
          "Ask about their glass-breakage coverage — it is unusual",
        ],
        costPerUnit: 720,
        basePerUnit: 1195,
      },
      {
        value: "VINYL_DH",
        label: "Vinyl double-hung",
        description: "Retrofit into the existing opening. No brick work.",
        brand: null,
        line: null,
        tier: "GOOD",
        warranty: null,
        sellingPoints: [
          "Drops into the existing opening — no brick work, no mess.",
        ],
        costPerUnit: 450,
        basePerUnit: 750,
      },
      {
        value: "LOW_E",
        label: "Low-E double pane",
        description: "The one that makes an August electric bill survivable.",
        brand: null,
        line: null,
        tier: "BETTER",
        warranty: null,
        sellingPoints: [
          "This is the one that changes the August bill.",
        ],
        costPerUnit: 600,
        basePerUnit: 975,
      },
    ],
  },
  {
    value: "GUTTERS",
    label: "Gutters",
    blurb: "Seamless, run on site, colour-matched to the trim.",
    unit: "LINEAR_FOOT",
    minimumUnits: 40,
    implausibleAbove: 600,
    excludes: [],
    options: [
      {
        value: "K5",
        label: '5" K-style aluminium',
        description: "Seamless, run on site, any colour.",
        brand: null,
        line: null,
        tier: "GOOD",
        warranty: null,
        sellingPoints: [
          "Seamless, run on your driveway, colour-matched to the trim.",
        ],
        costPerUnit: 6.5,
        basePerUnit: 11,
      },
      {
        value: "K6",
        label: '6" oversized',
        description: "For roofs that dump. Handles a real downpour.",
        brand: null,
        line: null,
        tier: "BETTER",
        warranty: null,
        sellingPoints: [
          "For a roof that dumps. A five-inch gutter overshoots in a heavy storm.",
        ],
        costPerUnit: 8.5,
        basePerUnit: 14,
      },
    ],
  },
  {
    value: "FENCE",
    label: "Fence",
    blurb: "Cedar with steel posts. Outlives the house.",
    unit: "LINEAR_FOOT",
    minimumUnits: 30,
    implausibleAbove: 800,
    excludes: [],
    options: [
      {
        value: "CEDAR_6",
        label: "6 ft cedar privacy",
        description: "Standard board-on-board, wood posts.",
        brand: null,
        line: null,
        tier: "GOOD",
        warranty: null,
        sellingPoints: [
          "Standard board-on-board, wood posts.",
        ],
        costPerUnit: 22,
        basePerUnit: 35,
      },
      {
        value: "CEDAR_STEEL",
        label: "6 ft cedar, steel posts",
        description: "Steel posts don't rot. This is the one that outlives the house.",
        brand: null,
        line: null,
        tier: "BEST",
        warranty: null,
        sellingPoints: [
          "Steel posts do not rot. That is the whole fence, in one sentence.",
        ],
        costPerUnit: 28,
        basePerUnit: 45,
      },
    ],
  },
  {
    value: "GARAGE_DOORS",
    label: "Garage doors",
    blurb: "The biggest moving object on the house, and the loudest.",
    unit: "OPENING",
    // Priced per door rather than per square foot, and a single and a double
    // are separate products because a 16-footer is not two 8-footers.
    minimumUnits: 1,
    implausibleAbove: 6,
    // Hanging a door is unlicensed work across the network. Wiring for it is not.
    // Plugging an opener into an outlet that already exists is fine; putting
    // a new circuit in for one is licensed electrical (TDLR) and goes to a
    // licensed contractor who deals with the homeowner directly.
    excludes: [
      "No new electrical circuits — an opener goes into an existing outlet or an electrician does it",
      "No structural changes to the opening — header work is a different trade",
      "No coastal windstorm-rated installs without a WPI-8 certificate on the job",
    ],
    options: [
      {
        value: "CLOPAY_STEEL",
        label: "Clopay steel, non-insulated",
        description: "The honest replacement. New door, new springs, new track.",
        brand: "Clopay",
        line: "Classic Steel",
        tier: "GOOD",
        warranty: null,
        sellingPoints: [
          "Everything behind the door is new too — springs, rollers, track",
          "The rattle and the noise go away with the old one",
        ],
        costPerUnit: 650,
        basePerUnit: 1050,
      },
      {
        value: "CLOPAY_INSULATED",
        label: "Clopay insulated steel",
        description: "Two-layer insulated. The one to sell on an attached garage.",
        brand: "Clopay",
        line: "Classic Steel Insulated",
        tier: "BETTER",
        warranty: null,
        sellingPoints: [
          "If there is a room over the garage, this is the one",
          "Quieter — the insulation kills the boom",
          "An uninsulated garage bakes — or freezes — the wall it shares with the house",
        ],
        costPerUnit: 850,
        basePerUnit: 1375,
      },
      {
        value: "CLOPAY_DOUBLE_INSULATED",
        label: "Clopay insulated steel, double",
        description: "16-foot insulated. The common two-car replacement.",
        brand: "Clopay",
        line: "Classic Steel Insulated",
        tier: "BETTER",
        warranty: null,
        sellingPoints: [
          "One door, the whole front of the garage",
          "Insulated, so the garage stops being an oven in July",
        ],
        costPerUnit: 1350,
        basePerUnit: 2150,
      },
      {
        value: "CARRIAGE_HOUSE",
        label: "Carriage house, double",
        description: "Faux-wood carriage style. The one that changes the front of the house.",
        brand: "Clopay",
        line: "Coachman",
        tier: "BEST",
        warranty: null,
        sellingPoints: [
          "The garage door is a third of what you see from the street",
          "Reads as timber, behaves as steel",
          "The upgrade people actually notice from the kerb",
        ],
        costPerUnit: 2400,
        basePerUnit: 3800,
      },
      {
        value: "LIFTMASTER_OPENER",
        label: "LiftMaster opener",
        description: "Belt drive, phone control. Sold with the door, not after it.",
        brand: "LiftMaster",
        line: "Belt drive",
        tier: "BETTER",
        warranty: null,
        sellingPoints: [
          "Belt, not chain — you stop hearing it through the ceiling",
          "Opens from the phone, and tells you when it was left open",
          "Goes into the outlet that is already up there",
        ],
        costPerUnit: 380,
        basePerUnit: 650,
      },
    ],
  },
  {
    value: "PAINT",
    label: "Exterior paint",
    blurb: "Wash, scrape, caulk, prime, two coats. Not one.",
    unit: "SQUARE",
    minimumUnits: 8,
    implausibleAbove: 80,
    excludes: [],
    options: [
      {
        value: "TEXCOTE_COOLWALL",
        label: "TexCote COOLWALL",
        description: "Ceramic coating, not paint. Sold as the last exterior finish.",
        brand: "TexCote",
        line: "COOLWALL",
        tier: "BEST",
        // Warranty is null until somebody copies it out of the dealer
        // materials. Misstating a manufacturer's warranty on a contract is its
        // own category of problem, and the terms move with certification level.
        warranty: null,
        sellingPoints: [
          "A coating system, not a repaint — thickness you can see at the edge",
          "Reflects heat rather than absorbing it, which is most of the pitch",
          "Sold as the last time you do the outside of this house",
        ],
        costPerUnit: 520,
        basePerUnit: 850,
      },
      {
        value: "TWO_COAT",
        label: "Two-coat exterior",
        description: "Pressure wash, scrape, caulk, prime bare spots, two coats.",
        brand: null,
        line: null,
        tier: "GOOD",
        warranty: null,
        sellingPoints: [
          "Wash, scrape, caulk, prime the bare spots, two coats. Not one.",
        ],
        costPerUnit: 210,
        basePerUnit: 340,
      },
    ],
  },
];

/**
 * Every lookup and every price takes the book it should read.
 *
 * Defaulting to TRADES is what keeps this additive — a test or a script with
 * no book to hand still gets a right answer for the shipped products. But a
 * surface that prices a real job has to pass the merged book from
 * loadPriceBook(), or a product somebody added at /admin/network/products cannot be
 * quoted at all, which makes the editor decorative.
 */
export function getTrade(value: string, book: readonly Trade[] = TRADES): Trade | undefined {
  return book.find((trade) => trade.value === value);
}

export function getTradeOption(
  trade: string,
  option: string,
  book: readonly Trade[] = TRADES,
): TradeOption | undefined {
  return getTrade(trade, book)?.options.find((o) => o.value === option);
}

export function getTradeLabel(
  value: string | null | undefined,
  book: readonly Trade[] = TRADES,
): string {
  if (!value) return "";
  return getTrade(value, book)?.label ?? value;
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
export function priceLine(
  line: MeasuredLine,
  book: readonly Trade[] = TRADES,
): PricedLine | undefined {
  const trade = getTrade(line.trade, book);
  const option = getTradeOption(line.trade, line.option, book);
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
export function priceJob(
  lines: readonly MeasuredLine[],
  book: readonly Trade[] = TRADES,
): {
  lines: PricedLine[];
  cost: number;
  base: number;
} {
  const priced = lines
    .map((line) => priceLine(line, book))
    .filter((line): line is PricedLine => line !== undefined);
  return {
    lines: priced,
    cost: round(priced.reduce((sum, line) => sum + line.cost, 0)),
    base: round(priced.reduce((sum, line) => sum + line.base, 0)),
  };
}

/** True when a measurement is big enough to be worth a second look. */
export function looksImplausible(
  line: MeasuredLine,
  book: readonly Trade[] = TRADES,
): boolean {
  const trade = getTrade(line.trade, book);
  return trade ? line.quantity > trade.implausibleAbove : false;
}

/** Dollars. Money is never carried as a fraction of a cent. */
function round(value: number): number {
  return Math.round(value);
}
