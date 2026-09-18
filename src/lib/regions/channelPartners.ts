// The list-partner program: a home service business hands over its existing
// customer list instead of doing any labor, and gets paid a flat fee every
// time a job sells off it.
//
// This is a different shape from the crew partners in src/lib/regions/states.ts
// or the appointment-referral contractors in referralAgreement.ts. Both of
// those get paid for work — a labor rate or a percentage of a job they
// closed. A channel partner does neither. What they're actually selling is
// the trust their own customers already have in them, which is why the call
// works as "a service check-in from {Partner}" rather than a cold call.
//
// That framing is also the compliance question that matters here: riding a
// partner's own established relationship with their customer is the reason
// this kind of call is safer than a cold list, but it only works if the call
// is truthful about who's calling and why, and if the partner actually had
// the right to hand that list over in the first place. See docs/regions.md.
//
// The deal has two halves. Half the gross profit on every job sold above the
// price-book threshold, which scales with the job and so is always affordable,
// plus a flat bonus on jobs big enough to carry one — a number to say on a
// cold call that does not need a spreadsheet to explain. Paid only once the
// job is complete, not at signing: a signed job that cancels or never finishes
// has produced nothing to share.
//
// One known sharp edge, left in deliberately because the alternative is an
// offer nobody can say out loud. The bonus is a cliff, not a ramp, so a job
// sold at the minimum earns the company less than one sold a dollar under it,
// and it takes roughly another $10,000 of contract value to climb back. Reps
// are paid on overage and so push upward anyway, which keeps the dead zone
// theoretical, but it is real and it is here rather than in a spreadsheet
// nobody reads.

/**
 * The partner's share of gross profit.
 *
 * "Gross profit" is the one from src/lib/regions/commission.ts — sold price
 * less job cost less what the seller earned — so this can never collide with
 * seller comp the way a share of the raw overage would. The seller is paid
 * first and the partner splits what is actually left.
 */
export const CHANNEL_PARTNER_PROFIT_SHARE = 0.5;

/**
 * The most a partner earns on any one job.
 *
 * Added when the uncapped split was doing something the pitch never intended:
 * on a large job half the gross profit ran past what an introduction is
 * actually worth, and it came straight out of the margin that has to carry the
 * warranty, the insurance and everyone else on the job.
 *
 * It is a real change to the deal and the pitch page says so now — "half the
 * profit, up to $3,500 a job" rather than "half the profit". A cap we apply
 * quietly while advertising an uncapped split would be the kind of thing that
 * ends a partnership on the first big cheque.
 */
export const CHANNEL_PARTNER_MAX_PAYOUT = 3_500;

/**
 * The share of a contract the company has to keep after everyone is paid.
 *
 * Below this a job is not worth doing at the price it was sold at, and it
 * stops being processed automatically — see marginCheck(). It does not block
 * the sale; it blocks paying it out without somebody looking.
 */
export const MARGIN_FLOOR = 0.15;

export function formatFee(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/** Same, for figures already in dollars. */
export function formatMoney(dollars: number): string {
  return `$${Math.round(dollars).toLocaleString("en-US")}`;
}

export type ChannelPartnerPayout = {
  /** Half the gross profit, before the cap. */
  profitShare: number;
  /** What the partner is owed once the job is complete. */
  total: number;
  /** What is left for the company after paying them. Never negative. */
  companyNet: number;
  /** True when the cap bit — the split would have paid more. */
  capped: boolean;
  /** What the cap held back, for the admin screen. Zero when it did not bite. */
  cappedBy: number;
};

/**
 * What a channel partner earns on one completed job.
 *
 * Takes the deal rather than the raw numbers so the profit being split is
 * exactly the profit the estimator showed the seller — one definition of
 * profit, computed once, in commission.ts.
 *
 * Half of what exists can never exceed what exists, so this is affordable by
 * construction; the cap only ever makes the company's side larger.
 */
export function channelPartnerPayout(deal: {
  base: number;
  sold: number;
  grossProfit: number;
}): ChannelPartnerPayout {
  const grossProfit = Math.max(Math.round(deal.grossProfit), 0);

  // Above the threshold, not merely at it: a job sold at base has no overage,
  // and the split is the reward for selling past the floor.
  const uncapped =
    deal.sold > deal.base ? Math.round(grossProfit * CHANNEL_PARTNER_PROFIT_SHARE) : 0;
  const total = Math.min(uncapped, CHANNEL_PARTNER_MAX_PAYOUT);

  return {
    profitShare: uncapped,
    total,
    companyNet: grossProfit - total,
    capped: uncapped > total,
    cappedBy: uncapped - total,
  };
}

export type MarginCheck = {
  /** Company net as a share of the contract, 0–1. */
  margin: number;
  /** True when the job clears MARGIN_FLOOR. */
  ok: boolean;
  /** Why it was flagged, for the admin screen. Null when it cleared. */
  reason: string | null;
};

/**
 * Whether a finished job is profitable enough to pay out without a human.
 *
 * Deliberately measured against the contract value rather than against gross
 * profit: a 15% margin on what the customer paid is a number that means the
 * same thing on every job, and it is the one an owner can hold in their head.
 */
export function marginCheck(soldPrice: number, companyNet: number): MarginCheck {
  if (soldPrice <= 0) {
    return { margin: 0, ok: false, reason: "No contract value on this job." };
  }
  const margin = companyNet / soldPrice;
  if (margin >= MARGIN_FLOOR) return { margin, ok: true, reason: null };

  return {
    margin,
    ok: false,
    reason:
      `This job keeps ${(margin * 100).toFixed(1)}% after everyone is paid, under the ` +
      `${Math.round(MARGIN_FLOOR * 100)}% floor. Somebody has to sign it off before it pays out.`,
  };
}

/**
 * The customer journey, as a partner sees it.
 *
 * Their own words rather than our pipeline's. "ASSIGNED" means nothing to a
 * solar company; "we're calling them this week" does. The stages are the Lead
 * statuses in prisma/schema.prisma, mapped once here so the page that promises
 * visibility and the page that delivers it can never drift apart.
 */
export type JourneyStage = {
  status: string;
  label: string;
  /** What it means, for the partner's own page. */
  hint: string;
  /** Position in the pipeline. Terminal outcomes sit outside the run. */
  step: number | null;
  /** True once this stage means money is owed. */
  earning: boolean;
};

export const JOURNEY: readonly JourneyStage[] = [
  {
    status: "NEW",
    label: "On your list",
    hint: "We have them. Nobody has called yet.",
    step: 1,
    earning: false,
  },
  {
    status: "ASSIGNED",
    label: "We're calling",
    hint: "One of ours is working on reaching them.",
    step: 2,
    earning: false,
  },
  {
    status: "APPOINTMENT_SET",
    label: "Appointment booked",
    hint: "They agreed to a time and we're going out.",
    step: 3,
    earning: false,
  },
  {
    status: "SOLD",
    label: "Sold — work scheduled",
    hint: "They signed. You've earned it; it pays when the job is finished.",
    step: 4,
    earning: true,
  },
  {
    status: "COMPLETED",
    label: "Finished — you're paid",
    hint: "Job done, money released.",
    step: 5,
    earning: true,
  },
  {
    status: "NO_SALE",
    label: "Quoted, no sale",
    hint: "They got a price and passed. Costs you nothing.",
    step: null,
    earning: false,
  },
  {
    status: "DEAD",
    label: "Not interested",
    hint: "They said no or we couldn't reach them. We won't call again.",
    step: null,
    earning: false,
  },
] as const;

/** The forward run, for drawing the pipeline. */
export const JOURNEY_STEPS = JOURNEY.filter((s) => s.step !== null);

export function journeyStage(status: string): JourneyStage {
  return (
    JOURNEY.find((s) => s.status === status) ?? {
      status,
      label: status,
      hint: "",
      step: null,
      earning: false,
    }
  );
}

/**
 * Hosts we accept a shared customer list from.
 *
 * A allowlist rather than "any https URL" because this field is pasted by
 * someone who was cold-called an hour ago and is about to be asked to share
 * their customers. A typo'd or hostile link sitting in our admin waiting for
 * somebody to click it is a phishing vector aimed at us, and the set of
 * places a real list actually lives is small enough to name.
 */
const LIST_HOSTS = [
  "docs.google.com",
  "drive.google.com",
  "sheets.google.com",
  "dropbox.com",
  "www.dropbox.com",
  "onedrive.live.com",
  "1drv.ms",
  "box.com",
  "app.box.com",
] as const;

// --- What a partner can put in front of their own customers -------------------

export type CrossSellService = {
  value: string;
  label: string;
  /** One line, read while they are ticking a box. Their customer's problem. */
  pitch: string;
  /** The price-book trade this sells as, where one exists. */
  trade: string | null;
  /**
   * LIVE means a rep can quote it today. GATED means we are not selling it
   * yet and saying otherwise to a partner is a promise we would break.
   */
  status: "LIVE" | "GATED";
  gatedReason?: string;
};

/**
 * The menu a contractor picks from at signup.
 *
 * Not the same list as TRADES, and deliberately so. TRADES is a price book
 * organised the way an estimator measures; this is organised the way a partner
 * thinks about their own customers, which is why Cool Wall has its own row
 * despite being a product inside PAINT — it is sold as its own thing at a
 * kitchen table and a partner who has heard of it will not find it under
 * "exterior paint".
 */
export const CROSS_SELL_SERVICES: readonly CrossSellService[] = [
  {
    value: "ROOFING",
    label: "Roofing",
    pitch: "The one with the shortest path from a storm to a signature.",
    trade: "ROOFING",
    status: "LIVE",
  },
  {
    value: "WINDOWS",
    label: "Windows",
    pitch: "Anybody complaining about a draught or a summer power bill.",
    trade: "WINDOWS",
    status: "LIVE",
  },
  {
    value: "SIDING",
    label: "Siding",
    pitch: "Biggest ticket on the list, and the one that changes the house.",
    trade: "SIDING",
    status: "LIVE",
  },
  {
    value: "COOL_WALL",
    label: "Cool Wall coating",
    pitch: "TexCote COOLWALL — sold as the last time they do the outside.",
    trade: "PAINT",
    status: "LIVE",
  },
  {
    value: "PAINT",
    label: "Exterior paint",
    pitch: "Cheaper entry than siding, and it opens the siding conversation.",
    trade: "PAINT",
    status: "LIVE",
  },
  {
    value: "GUTTERS",
    label: "Gutters",
    pitch: "Easy add-on. Rarely the whole job, often the reason they say yes.",
    trade: "GUTTERS",
    status: "LIVE",
  },
  {
    value: "FENCE",
    label: "Fencing",
    pitch: "New dog, new neighbour, or a panel down after wind.",
    trade: "FENCE",
    status: "LIVE",
  },
  {
    value: "GARAGE_DOORS",
    label: "Garage doors",
    pitch: "A third of the kerb view, and usually the oldest thing on the house.",
    trade: "GARAGE_DOORS",
    status: "LIVE",
  },
  {
    // Kept on the menu because partners ask for it by name and hiding it just
    // means the question arrives on a phone call instead. Held back rather
    // than quietly sold — see SOLAR_WARNING in referralAgreement.ts.
    value: "SOLAR",
    label: "Solar",
    pitch: "Highest ticket in home improvement, and the most regulated.",
    trade: null,
    status: "GATED",
    gatedReason:
      "Not live yet. Solar is the most litigated trade in the country to call on — $500 a " +
      "call, $1,500 where it's wilful — and the install itself is licensed electrical work " +
      "in every state we cover. Tick it and we'll talk, but we won't quote it until the " +
      "consent trail has been through a lawyer.",
  },
] as const;

export const LIVE_SERVICES = CROSS_SELL_SERVICES.filter((s) => s.status === "LIVE");

export function getService(value: string): CrossSellService | undefined {
  return CROSS_SELL_SERVICES.find((s) => s.value === value);
}

/** Parse a stored comma-separated selection back into services we know. */
export function parseServices(stored: string | null | undefined): CrossSellService[] {
  if (!stored) return [];
  return stored
    .split(",")
    .map((v) => getService(v.trim().toUpperCase()))
    .filter((s): s is CrossSellService => Boolean(s));
}

/** Normalise a submitted selection for storage. Unknown values are dropped. */
export function serializeServices(values: readonly unknown[]): string | null {
  const picked = values
    .map((v) => String(v).trim().toUpperCase())
    .filter((v) => getService(v));
  return picked.length ? Array.from(new Set(picked)).join(",") : null;
}

// --- Which referrals are worth sending ----------------------------------------

/**
 * What separates a referral that books from one that wastes everybody's time.
 *
 * Shown to partners rather than kept internal, because the lead they don't
 * send is free and the bad lead costs a truck roll. A partner who understands
 * this sends fewer and better, which is the outcome both sides want.
 */
export const PREQUALIFICATION = [
  {
    signal: "They own the house",
    why: "A tenant can't authorise work on it. This is the single most common dead end.",
  },
  {
    signal: "You did work for them, and they were happy",
    why: "The call opens with your name. A sour customer makes it the worst call of our week.",
  },
  {
    signal: "Within about two years",
    why: "Longer and they may not place who you are, which turns a warm call cold.",
  },
  {
    signal: "A house with something visibly aging",
    why: "Original windows, a roof past twenty, chalking paint. You've seen the outside — we haven't.",
  },
  {
    signal: "You have the address",
    why: "We look at the property before we ring, so the first call carries a real number.",
  },
  {
    signal: "Somewhere we actually work",
    why: "Colorado, Missouri, Kansas, Indiana, Wyoming. Outside those we can't send anyone.",
  },
] as const;

export type LeadQuality = {
  /** 0–100, and only ever advisory. */
  score: number;
  band: "STRONG" | "WORKABLE" | "THIN";
  /** What is missing, in the partner's words, so they can fix it now. */
  gaps: string[];
};

/**
 * Score a referral as it is typed, to nudge rather than to gate.
 *
 * Advisory on purpose: a partner who has a great customer with no address
 * should still be able to send them. Refusing the submission would cost a real
 * job to enforce a preference.
 */
export function scoreLead(input: {
  address?: string | null;
  zip?: string | null;
  trades?: readonly string[];
  relationship?: string | null;
  notes?: string | null;
}): LeadQuality {
  let score = 40;
  const gaps: string[] = [];

  if (input.address && input.address.trim().length > 6) score += 25;
  else gaps.push("Add the street address — it's worth more than anything else here.");

  if (input.zip && /^\d{5}$/.test(input.zip.trim())) score += 10;
  else gaps.push("A ZIP code lets us check we cover them before anyone calls.");

  const trades = (input.trades ?? []).filter(Boolean);
  if (trades.length >= 2) score += 15;
  else if (trades.length === 1) score += 8;
  else gaps.push("Tell us what they might need, even if it's a guess.");

  if (input.relationship && input.relationship.trim().length > 2) score += 10;
  else gaps.push("What did you do for them, and roughly when? It opens the call.");

  if (input.notes && input.notes.trim().length > 12) score += 5;

  score = Math.max(0, Math.min(100, score));
  const band: LeadQuality["band"] = score >= 80 ? "STRONG" : score >= 55 ? "WORKABLE" : "THIN";
  return { score, band, gaps };
}

// --- Milestones ---------------------------------------------------------------

export type Milestone = {
  value: string;
  label: string;
  /** What they had to do. */
  hint: string;
  /** Completed jobs required. Zero for the ones that fire on activity. */
  jobs: number;
};

/**
 * Progress markers for a partner who has sent a list and is now waiting.
 *
 * The waiting is the problem this solves. Weeks pass between handing over a
 * spreadsheet and the first cheque, and a partner with nothing to look at in
 * that gap concludes it went nowhere. These are deliberately weighted toward
 * the early ones, where the doubt actually lives.
 */
export const MILESTONES: readonly Milestone[] = [
  { value: "LIST", label: "List shared", hint: "You sent us your customers.", jobs: 0 },
  { value: "FIRST_APPOINTMENT", label: "First appointment", hint: "We got someone to the table.", jobs: 0 },
  { value: "FIRST_SALE", label: "First job sold", hint: "One of yours signed.", jobs: 1 },
  { value: "FIRST_PAID", label: "First payout", hint: "Money in your account.", jobs: 1 },
  { value: "FIVE", label: "Five jobs", hint: "This is a channel now, not a favour.", jobs: 5 },
  { value: "TEN", label: "Ten jobs", hint: "Top tier. We should be talking about a bigger list.", jobs: 10 },
] as const;

export type ListUrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Validate a pasted list link.
 *
 * Returns the normalised URL rather than a boolean so the caller stores what
 * was actually parsed — a link with a stray space or a missing scheme is the
 * normal case here, not the exception.
 */
export function checkListUrl(raw: string): ListUrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Paste the link to your list." };

  // Somebody copying out of a browser bar often loses the scheme. Adding it
  // is the difference between "that link doesn't work" and it just working.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: "That doesn't look like a link. Paste the whole thing." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "The link needs to start with https." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!LIST_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    return {
      ok: false,
      reason:
        "We take a Google Sheets, Drive, Dropbox, OneDrive or Box link. If yours lives " +
        "somewhere else, call us and we'll sort it out.",
    };
  }

  return { ok: true, url: parsed.toString() };
}
