// The states we operate in, and what each one actually requires.
//
// This replaces the single hardcoded Texas market. The shape is deliberately
// not "a list of place names" — every screen that used to assume one state now
// reads its rules from here, because the five target states are not
// interchangeable and treating them as one market is how a contract goes out
// missing something a statute required.
//
// A NOTE ON "RELAXED REGULATORY REGIONS", because the premise needs correcting
// before anybody relies on it:
//
//   - KANSAS licenses nothing generally, but roofing contractors must
//     REGISTER WITH THE KANSAS ATTORNEY GENERAL under the Kansas Roofing
//     Registration Act. A partner roofing without it is not merely unlicensed,
//     they are operating against a registration statute.
//   - COLORADO has no state contractor licence but does have a roofing statute
//     covering insurance work: written contract, no absorbing deductibles, and
//     a right to rescind after a carrier denies. Denver, Colorado Springs,
//     Aurora and most Front Range municipalities also license locally.
//   - INDIANA's Home Improvement Contracts Act requires a written contract
//     with specified contents for residential work above a low dollar
//     threshold. This is a contract-contents rule, and it binds whoever holds
//     the customer contract.
//   - MISSOURI is genuinely light at state level; Kansas City and St. Louis
//     are not.
//   - WYOMING is the only one that is broadly as relaxed as the premise
//     assumes, and even there Cheyenne and Casper register contractors.
//
// The good news, and the reason the referral model helps: most of the above
// binds the party holding the customer contract. Under the partner network the
// contractor holds it. That moves the burden without making it disappear, and
// it is why vetting is the product rather than paperwork we do afterwards.
//
// Not legal advice. Citations are flagged for counsel in docs/regions.md.

export type StateCode = "CO" | "MO" | "KS" | "IN" | "WY";

export type Market = {
  slug: string;
  name: string;
  /** Named towns, which is most of the local search this site will ever do. */
  cities: readonly string[];
  /** Counties, because a lot of our work is outside any city's jurisdiction. */
  counties?: readonly string[];
  /** True where the work is mostly unincorporated and permitting is county-level. */
  rural?: boolean;
};

export type Region = {
  code: StateCode;
  name: string;
  slug: string;
  timeZone: string;
  /** ZIP prefixes, inclusive, for inferring state from a typed ZIP. */
  zipRange: readonly [number, number];
  markets: readonly Market[];
  licensing: {
    /** A state-level general contractor or remodeler licence. None of these have one. */
    stateContractorLicense: boolean;
    /** Registration specific to roofing, where it exists. */
    roofingRegistration: string | null;
    /** Whether city/county licensing is the norm rather than the exception. */
    localLicensingCommon: boolean;
    note: string;
  };
  rules: {
    /** Business days a homeowner may cancel a sale agreed at their home. */
    coolingOffBusinessDays: number;
    /**
     * Whether workers' compensation is mandatory for a contractor with
     * employees.
     *
     * This flips the Texas assumption and it matters. Texas is the outlier
     * that does not require it; every state in this network does, subject to
     * employee-count or payroll thresholds. A partner who ran uninsured in
     * Texas and carries that habit north is not merely taking a risk, they are
     * out of compliance — and Wyoming goes further, running a monopolistic
     * state fund, so a private policy from elsewhere does not substitute.
     * Confirm the thresholds per state with counsel.
     */
    workersCompRequired: boolean;
    workersCompNote: string;
    /** Whether absorbing a homeowner's insurance deductible is prohibited. */
    deductibleProhibition: boolean;
    /** A statute dictating what a residential contract must contain. */
    writtenContractStatute: string | null;
    /** Hours to rescind after a carrier denies an insurance claim, where given. */
    insuranceDenialRescissionHours: number | null;
    notes: readonly string[];
  };
};

/**
 * The federal floor.
 *
 * The FTC's Cooling-Off Rule gives a buyer three business days to cancel a
 * sale of $25 or more agreed somewhere other than the seller's usual place of
 * business. It applies in every state, so three days is the floor everywhere
 * and a state that gives more wins. This is why removing "the Texas
 * cancellation code" and shipping nothing in its place would have been wrong:
 * the right was never really Texas's to begin with.
 */
export const FEDERAL_COOLING_OFF_DAYS = 3;
export const HOME_SOLICITATION_THRESHOLD = 25;

export const REGIONS: readonly Region[] = [
  {
    code: "CO",
    name: "Colorado",
    slug: "colorado",
    timeZone: "America/Denver",
    zipRange: [80000, 81699],
    markets: [
      {
        slug: "denver-metro",
        name: "Denver Metro",
        cities: ["Denver", "Aurora", "Lakewood", "Arvada", "Westminster", "Thornton", "Centennial"],
        counties: ["Adams", "Arapahoe", "Jefferson", "Douglas"],
      },
      {
        slug: "colorado-springs",
        name: "Colorado Springs & Pueblo",
        cities: ["Colorado Springs", "Fountain", "Monument", "Pueblo", "Cañon City"],
        counties: ["El Paso", "Pueblo", "Fremont"],
      },
      {
        slug: "northern-colorado",
        name: "Northern Colorado",
        cities: ["Fort Collins", "Greeley", "Loveland", "Longmont", "Windsor", "Evans"],
        counties: ["Larimer", "Weld"],
      },
      {
        slug: "eastern-plains",
        name: "Eastern Plains",
        cities: ["Sterling", "Fort Morgan", "Limon", "Burlington", "Lamar"],
        counties: ["Logan", "Morgan", "Lincoln", "Kit Carson", "Prowers"],
        rural: true,
      },
    ],
    licensing: {
      stateContractorLicense: false,
      roofingRegistration: null,
      localLicensingCommon: true,
      note:
        "No state contractor licence, but most Front Range municipalities license locally — " +
        "Denver, Colorado Springs, Aurora and Lakewood among them. Partners must hold whatever " +
        "their own jurisdiction requires and we verify it before they take work.",
    },
    rules: {
      coolingOffBusinessDays: 3,
      workersCompRequired: true,
      workersCompNote:
        "Required for employers with employees. Confirm the threshold.",
      deductibleProhibition: true,
      writtenContractStatute: "Colorado roofing statute — written contract required on insurance work",
      insuranceDenialRescissionHours: 72,
      notes: [
        "A roofing contractor may not pay, waive, rebate or absorb a homeowner's insurance deductible.",
        "Where a carrier denies the claim, the homeowner may rescind the contract and get any deposit back.",
        "Payments taken before material is delivered or work begins are held for the homeowner, not spent.",
      ],
    },
  },
  {
    code: "MO",
    name: "Missouri",
    slug: "missouri",
    timeZone: "America/Chicago",
    zipRange: [63000, 65899],
    markets: [
      {
        slug: "kansas-city-mo",
        name: "Kansas City Metro",
        cities: ["Kansas City", "Independence", "Lee's Summit", "Blue Springs", "Liberty", "St. Joseph"],
        counties: ["Jackson", "Clay", "Platte", "Cass"],
      },
      {
        slug: "st-louis",
        name: "St. Louis Metro",
        cities: ["St. Louis", "St. Charles", "O'Fallon", "Chesterfield", "Wentzville", "Arnold"],
        counties: ["St. Louis", "St. Charles", "Jefferson", "Franklin"],
      },
      {
        slug: "springfield-ozarks",
        name: "Springfield & the Ozarks",
        cities: ["Springfield", "Branson", "Nixa", "Ozark", "Joplin", "Republic"],
        counties: ["Greene", "Christian", "Taney", "Jasper"],
      },
      {
        slug: "mid-missouri",
        name: "Mid-Missouri",
        cities: ["Columbia", "Jefferson City", "Sedalia", "Moberly", "Fulton"],
        counties: ["Boone", "Cole", "Pettis", "Randolph", "Callaway"],
        rural: true,
      },
    ],
    licensing: {
      stateContractorLicense: false,
      roofingRegistration: null,
      localLicensingCommon: true,
      note:
        "Genuinely light at state level. Kansas City and St. Louis both license and permit " +
        "locally, and several suburbs run their own registration. County work outside those " +
        "jurisdictions is the least encumbered in the network.",
    },
    rules: {
      coolingOffBusinessDays: 3,
      workersCompRequired: true,
      workersCompNote:
        "Required; construction employers hit the threshold at a lower headcount than other industries.",
      deductibleProhibition: true,
      writtenContractStatute: null,
      insuranceDenialRescissionHours: null,
      notes: [
        "Missouri restricts a contractor advertising or offering to absorb an insurance deductible. Confirm the current citation before relying on the detail.",
        "No statewide residential contract-contents statute; the contract still has to carry the federal cancellation notice.",
      ],
    },
  },
  {
    code: "KS",
    name: "Kansas",
    slug: "kansas",
    timeZone: "America/Chicago",
    zipRange: [66000, 67999],
    markets: [
      {
        slug: "wichita",
        name: "Wichita",
        cities: ["Wichita", "Derby", "Andover", "Newton", "El Dorado", "Hutchinson"],
        counties: ["Sedgwick", "Butler", "Harvey", "Reno"],
      },
      {
        slug: "kansas-city-ks",
        name: "Kansas City & Johnson County",
        cities: ["Overland Park", "Olathe", "Lenexa", "Shawnee", "Kansas City", "Leawood"],
        counties: ["Johnson", "Wyandotte", "Leavenworth"],
      },
      {
        slug: "topeka",
        name: "Topeka & Lawrence",
        cities: ["Topeka", "Lawrence", "Manhattan", "Junction City", "Emporia"],
        counties: ["Shawnee", "Douglas", "Riley", "Geary"],
      },
      {
        slug: "central-kansas",
        name: "Central & Western Kansas",
        cities: ["Salina", "Hays", "Great Bend", "Dodge City", "Garden City", "Liberal"],
        counties: ["Saline", "Ellis", "Barton", "Ford", "Finney"],
        rural: true,
      },
    ],
    licensing: {
      stateContractorLicense: false,
      roofingRegistration:
        "Kansas Roofing Registration Act — roofing contractors must register with the Kansas Attorney General",
      localLicensingCommon: true,
      note:
        "The one target state with a roofing-specific state requirement. A roofing partner in " +
        "Kansas must hold a current AG registration and we check the number before they take a " +
        "job, not after. Non-roofing trades are unaffected.",
    },
    rules: {
      coolingOffBusinessDays: 3,
      workersCompRequired: true,
      workersCompNote:
        "Required, with a narrow payroll-based exemption. Confirm the current threshold.",
      deductibleProhibition: true,
      writtenContractStatute: null,
      insuranceDenialRescissionHours: null,
      notes: [
        "Roofing registration with the Attorney General is verifiable — ask for the number and check it.",
        "Kansas restricts absorbing an insurance deductible on roofing work.",
      ],
    },
  },
  {
    code: "IN",
    name: "Indiana",
    slug: "indiana",
    timeZone: "America/Indiana/Indianapolis",
    zipRange: [46000, 47999],
    markets: [
      {
        slug: "indianapolis",
        name: "Indianapolis Metro",
        cities: ["Indianapolis", "Carmel", "Fishers", "Noblesville", "Greenwood", "Avon", "Plainfield"],
        counties: ["Marion", "Hamilton", "Johnson", "Hendricks", "Boone"],
      },
      {
        slug: "fort-wayne",
        name: "Fort Wayne & Northeast",
        cities: ["Fort Wayne", "Huntington", "Auburn", "Warsaw", "Columbia City"],
        counties: ["Allen", "Whitley", "DeKalb", "Kosciusko"],
      },
      {
        slug: "south-bend",
        name: "South Bend & Elkhart",
        cities: ["South Bend", "Mishawaka", "Elkhart", "Goshen", "Granger"],
        counties: ["St. Joseph", "Elkhart"],
      },
      {
        slug: "southern-indiana",
        name: "Southern Indiana",
        cities: ["Evansville", "Bloomington", "Terre Haute", "Columbus", "Jasper"],
        counties: ["Vanderburgh", "Monroe", "Vigo", "Bartholomew", "Dubois"],
        rural: true,
      },
    ],
    licensing: {
      stateContractorLicense: false,
      roofingRegistration: null,
      localLicensingCommon: true,
      note:
        "No state contractor licence, but Indiana regulates the CONTRACT rather than the " +
        "contractor. Indianapolis, Fort Wayne and most counties license or register locally.",
    },
    rules: {
      coolingOffBusinessDays: 3,
      workersCompRequired: true,
      workersCompNote:
        "Required for employers with employees.",
      deductibleProhibition: true,
      writtenContractStatute:
        "Indiana Home Improvement Contracts Act — written contract with specified contents required above a low dollar threshold",
      insuranceDenialRescissionHours: null,
      notes: [
        "The Home Improvement Contracts Act dictates what a residential contract must contain — names, addresses, a description of the work, the price, and signatures. A contract missing them is a deceptive act.",
        "This binds whoever holds the customer contract, which under the partner model is the contractor. Their paperwork is therefore our problem to vet.",
      ],
    },
  },
  {
    code: "WY",
    name: "Wyoming",
    slug: "wyoming",
    timeZone: "America/Denver",
    zipRange: [82000, 83199],
    markets: [
      {
        slug: "cheyenne",
        name: "Cheyenne & Laramie",
        cities: ["Cheyenne", "Laramie", "Wheatland", "Torrington"],
        counties: ["Laramie", "Albany", "Platte", "Goshen"],
      },
      {
        slug: "casper",
        name: "Casper & Central Wyoming",
        cities: ["Casper", "Douglas", "Glenrock", "Riverton", "Lander"],
        counties: ["Natrona", "Converse", "Fremont"],
      },
      {
        slug: "gillette",
        name: "Gillette & the Powder River Basin",
        cities: ["Gillette", "Sheridan", "Buffalo", "Newcastle"],
        counties: ["Campbell", "Sheridan", "Johnson", "Weston"],
        rural: true,
      },
      {
        slug: "western-wyoming",
        name: "Western Wyoming",
        cities: ["Rock Springs", "Green River", "Evanston", "Jackson", "Cody", "Powell"],
        counties: ["Sweetwater", "Uinta", "Teton", "Park"],
        rural: true,
      },
    ],
    licensing: {
      stateContractorLicense: false,
      roofingRegistration: null,
      localLicensingCommon: false,
      note:
        "The least encumbered state in the network. Cheyenne and Casper register contractors; " +
        "most of the rest of the state permits at county level or not at all.",
    },
    rules: {
      coolingOffBusinessDays: 3,
      workersCompRequired: true,
      workersCompNote:
        "Required for construction, and Wyoming runs a MONOPOLISTIC state fund — coverage must come from the state, not a private carrier.",
      deductibleProhibition: false,
      writtenContractStatute: null,
      insuranceDenialRescissionHours: null,
      notes: [
        "No roofing deductible statute found. Absorbing a deductible is still insurance fraud against the carrier in substance, and no partner in the network is permitted to offer it in any state.",
        "Long drives. Service radius matters more here than anywhere else in the network.",
      ],
    },
  },
] as const;

// --- Lookups -----------------------------------------------------------------

export const STATE_CODES = REGIONS.map((r) => r.code);

export function getRegion(code: string | null | undefined): Region | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return REGIONS.find((r) => r.code === upper || r.slug === code.trim().toLowerCase());
}

export function isStateCode(value: string): value is StateCode {
  return REGIONS.some((r) => r.code === value.toUpperCase());
}

/**
 * Which state a ZIP belongs to.
 *
 * Homeowners type a ZIP far more reliably than they pick a state from a
 * dropdown, and a ZIP outside the network is the single most useful thing a
 * lead form can find out early — it means we cannot serve them and should say
 * so rather than taking their details.
 */
export function regionForZip(zip: string | null | undefined): Region | undefined {
  if (!zip) return undefined;
  const digits = zip.replace(/\D/g, "").slice(0, 5);
  if (digits.length < 5) return undefined;
  const n = Number(digits);
  return REGIONS.find((r) => n >= r.zipRange[0] && n <= r.zipRange[1]);
}

/** True when we can actually serve this ZIP. */
export function servesZip(zip: string | null | undefined): boolean {
  return Boolean(regionForZip(zip));
}

export const ALL_MARKETS = REGIONS.flatMap((r) =>
  r.markets.map((m) => ({ ...m, state: r.code, stateName: r.name })),
);

export const ALL_CITIES = REGIONS.flatMap((r) => r.markets.flatMap((m) => m.cities));

export const ALL_COUNTIES = REGIONS.flatMap((r) =>
  r.markets.flatMap((m) => m.counties ?? []),
);

/** Counties where the work is mostly unincorporated and permitting is county-level. */
export const RURAL_MARKETS = ALL_MARKETS.filter((m) => m.rural);

/** Every state in the network requires workers' comp. Texas did not. */
export const WORKERS_COMP_REQUIRED_STATES = REGIONS.filter(
  (r) => r.rules.workersCompRequired,
).map((r) => r.code);

/** States whose rules forbid a partner absorbing an insurance deductible. */
export const DEDUCTIBLE_PROHIBITION_STATES = REGIONS.filter(
  (r) => r.rules.deductibleProhibition,
).map((r) => r.code);

/** States that require something specific of the contract itself. */
export const CONTRACT_STATUTE_STATES = REGIONS.filter(
  (r) => r.rules.writtenContractStatute,
).map((r) => r.code);

/** Trades needing a state registration before a partner may take work. */
export function registrationRequired(code: string, trade: string): string | null {
  const region = getRegion(code);
  if (!region?.licensing.roofingRegistration) return null;
  return trade.toUpperCase().includes("ROOF") ? region.licensing.roofingRegistration : null;
}
