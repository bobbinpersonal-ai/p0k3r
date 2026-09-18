import { CHANNEL_PARTNER_PROFIT_SHARE } from "@/lib/regions/channelPartners";
import { COMPANY } from "@/lib/regions/brand";

// Recruiting the channel partners themselves.
//
// The other direction of the business. Everything in channelPartners.ts is
// about a partner we already have; this is about the hundred phone calls that
// produce the first one. It is deliberately a separate module because the
// audience is different in every way that matters: a contractor with a truck
// and a bad opinion of lead vendors, answering a number they do not know,
// standing on a roof.
//
// THE COMPLIANCE POINT THAT MAKES THIS WORTH DOING TODAY. Calling a business
// on its business line for a business purpose is not covered by the National
// Do Not Call Registry, which protects residential subscribers, and most B2B
// calls sit outside the FTC's Telemarketing Sales Rule outright. That is the
// opposite of the homeowner side of this business, which needs registration,
// state list scrubbing and a warm introduction before anyone dials. Recruiting
// partners needs none of it and can start this afternoon.
//
// Two limits survive, and both are real:
//
//   1. The TCPA's restriction on automated dialling to a mobile has no B2B
//      exemption, and a contractor's "office" number is very often a cell.
//      Manual dial only. See isAutodialable() in calling.ts, which returns
//      false everywhere and by construction.
//   2. It has to actually be B2B. Pitching an owner something for themselves
//      rather than for their company is not a business call and loses the
//      exemption. This offer is paid to the business, which keeps it clean.

const SHARE_PCT = Math.round(CHANNEL_PARTNER_PROFIT_SHARE * 100);

/** What we tell a prospect a job pays them. Verified against the price book. */
export const TYPICAL_PER_JOB = 2000;

/**
 * Who to call, best first.
 *
 * Ordered by how warm the list is, not by how big the trade is. The whole
 * asset being borrowed is the customer's memory of the partner, so a plumber
 * who was under the sink last spring beats a builder who framed the house in
 * 2009 — regardless of ticket size.
 */
export type ProspectTrade = {
  value: string;
  label: string;
  /**
   * What you call their trade out loud.
   *
   * Stored rather than derived from the label, because deriving it produced
   * "we don't do hvac" — lowercasing an acronym is the kind of detail that
   * makes a script sound like it was written by someone who has never done
   * the work.
   */
  shortName: string;
  /** Why their list is worth something. The line that opens the call. */
  why: string;
  /** What a shop this size usually has sitting in a spreadsheet. */
  typicalList: string;
  /** Rough share of that list that owns the house. Drives the maths on the call. */
  ownerOccupied: string;
};

export const PROSPECT_TRADES: readonly ProspectTrade[] = [
  {
    value: "HVAC",
    shortName: "HVAC",
    label: "HVAC & furnace service",
    why: "A service book is the warmest list in home services, and nobody mines it. They have been inside the house, often more than once, and the customer called them — not the other way round.",
    typicalList: "800–4,000",
    ownerOccupied: "high",
  },
  {
    value: "PLUMBING",
    shortName: "plumbing",
    label: "Plumbing & drains",
    why: "Same as HVAC: invited in, remembered, and repeat. A plumber who did a water heater knows exactly which houses are tired.",
    typicalList: "600–3,000",
    ownerOccupied: "high",
  },
  {
    value: "SOLAR",
    shortName: "solar",
    label: "Solar install & O&M",
    why: "Every single customer owns their roof and has already signed a five-figure contract on the house. The best-qualified list there is, and solar shops are hungry right now.",
    typicalList: "200–1,500",
    ownerOccupied: "total",
  },
  {
    value: "PEST",
    shortName: "pest control",
    label: "Pest control & inspection",
    why: "They are in the crawlspace and on the roofline on a schedule, and they see the damage before the owner does. Recurring contracts mean the relationship is current.",
    typicalList: "500–3,000",
    ownerOccupied: "high",
  },
  {
    value: "SECURITY",
    shortName: "security systems",
    label: "Security & smart home",
    why: "They have been inside the house and know which ones have original windows and doors. Install lists are well kept because they are tied to monitoring accounts.",
    typicalList: "300–2,000",
    ownerOccupied: "high",
  },
  {
    value: "GARAGE",
    shortName: "garage doors",
    label: "Garage doors & openers",
    why: "Exterior work on a house they have already measured. Their customer already paid for something on the outside of the building.",
    typicalList: "400–2,000",
    ownerOccupied: "high",
  },
  {
    value: "LANDSCAPE",
    shortName: "landscaping",
    label: "Landscaping & sprinklers",
    why: "Weekly or seasonal contact means the relationship is warm right now, not two years ago. They can see the roof and the paint from the yard.",
    typicalList: "200–1,200",
    ownerOccupied: "medium",
  },
  {
    value: "CLEANING",
    shortName: "cleaning",
    label: "Carpet, window & gutter cleaning",
    why: "Cheap, frequent, remembered. A window cleaner has looked at every window in the house and knows which are failing.",
    typicalList: "300–2,000",
    ownerOccupied: "medium",
  },
  {
    value: "REALTOR",
    shortName: "real estate",
    label: "Realtors & property managers",
    why: "Closed clients with a punch list and no contractor they trust. Careful: some brokerages have their own rules about referral compensation, so ask.",
    typicalList: "100–600",
    ownerOccupied: "total",
  },
];

const TRADE_BY_VALUE = new Map(PROSPECT_TRADES.map((t) => [t.value, t]));

export function getProspectTrade(value: string | null | undefined): ProspectTrade | undefined {
  return value ? TRADE_BY_VALUE.get(value) : undefined;
}

export function isProspectTrade(value: string): boolean {
  return TRADE_BY_VALUE.has(value);
}

/**
 * Where the names come from.
 *
 * Deliberately not "buy a list". A bought B2B list is stale, wrong about who
 * owns the business, and full of numbers that have been called forty times
 * this month. Every source below produces a shop that is demonstrably working
 * right now, which is the only filter that matters.
 */
export const WHERE_TO_FIND: readonly { source: string; how: string }[] = [
  {
    source: "Google Maps, by trade and suburb",
    how: "Search the trade plus the suburb, and take the shops with 15–150 reviews. Under 15 is usually too new to have a list; over 150 usually has a marketing person who will block you. The phone number and owner's name are right there.",
  },
  {
    source: "Supply house counters",
    how: "ABC Supply, SRS, Beacon, Ferguson, the Sherwin-Williams commercial desk. Counter staff know who is busy, who pays on time, and who just lost a salesperson. Ask who has been in this week.",
  },
  {
    source: "City and county permit records",
    how: "Whoever pulled a mechanical or plumbing permit last month is actively working and has a real customer base. Most Front Range jurisdictions publish these online for free.",
  },
  {
    source: "Truck and yard signs",
    how: "Drive the neighbourhoods you want to sell into and photograph the trucks. A shop working in the postcode you want is the shop whose list you want.",
  },
  {
    source: "State licence lookups",
    how: "Plumbing and electrical are state-licensed in Colorado (DPO/DORA). The register is public, searchable by county, and tells you the business has been around long enough to matter.",
  },
  {
    source: "Facebook groups and trade associations",
    how: "Local contractor groups, chambers, BNI chapters. Slower, but the introduction is warm and the close rate is several times a cold dial.",
  },
];

/**
 * What happened on a prospecting call.
 *
 * A different set from the homeowner desk's (see dispositions.ts). Two
 * differences carry weight: GATEKEEPER is its own outcome because "the owner
 * isn't in" is the single most common result and it is not a no — it is a
 * scheduling problem. And SENT_LINK exists because on this call the win is not
 * a signature, it is getting the page in front of them while they are still
 * thinking about it.
 */
export type ProspectDisposition = {
  value: string;
  label: string;
  /** What the button says. Has to fit on a phone. */
  short: string;
  /** Whether it leaves the working queue. */
  closes: boolean;
  /** Hours before it comes back round. Null when it does not. */
  retryHours: number | null;
  /** How it reads on screen. */
  tone: "GOOD" | "NEUTRAL" | "BAD";
};

export const PROSPECT_DISPOSITIONS: readonly ProspectDisposition[] = [
  { value: "NEW", label: "Not called yet", short: "New", closes: false, retryHours: null, tone: "NEUTRAL" },
  { value: "NO_ANSWER", label: "No answer", short: "No answer", closes: false, retryHours: 4, tone: "NEUTRAL" },
  { value: "VOICEMAIL", label: "Left a voicemail", short: "Voicemail", closes: false, retryHours: 24, tone: "NEUTRAL" },
  { value: "GATEKEEPER", label: "Got past reception, owner not in", short: "Gatekeeper", closes: false, retryHours: 20, tone: "NEUTRAL" },
  { value: "CALLBACK", label: "Owner wants a call back", short: "Call back", closes: false, retryHours: 24, tone: "GOOD" },
  { value: "SENT_LINK", label: "Pitched, sent the link", short: "Sent link", closes: false, retryHours: 48, tone: "GOOD" },
  { value: "SIGNED_UP", label: "Signed up", short: "Signed", closes: true, retryHours: null, tone: "GOOD" },
  { value: "NOT_NOW", label: "Interested, wrong time", short: "Not now", closes: false, retryHours: 24 * 60, tone: "NEUTRAL" },
  { value: "DEAD", label: "No, and don't call again", short: "Dead", closes: true, retryHours: null, tone: "BAD" },
];

/** What the hub can set. NEW is a starting state, not an outcome. */
export const PROSPECT_ACTIONS = PROSPECT_DISPOSITIONS.filter((d) => d.value !== "NEW");

const DISP_BY_VALUE = new Map(PROSPECT_DISPOSITIONS.map((d) => [d.value, d]));

export function getProspectDisposition(value: string): ProspectDisposition | undefined {
  return DISP_BY_VALUE.get(value);
}

export function isProspectDisposition(value: string): boolean {
  return DISP_BY_VALUE.has(value);
}

/** The ones still worth dialling. */
export const OPEN_PROSPECT_DISPOSITIONS = PROSPECT_DISPOSITIONS.filter((d) => !d.closes).map(
  (d) => d.value,
);

/**
 * When a disposition should surface again, given when it was set.
 *
 * Returns null for the ones that never come back. The hub uses this to decide
 * what is due rather than showing everything at once — a list of four hundred
 * names with no ordering is a list nobody works.
 */
export function dueAt(disposition: string, lastCalledAt: Date): Date | null {
  const d = DISP_BY_VALUE.get(disposition);
  if (!d || d.retryHours == null) return null;
  return new Date(lastCalledAt.getTime() + d.retryHours * 60 * 60 * 1000);
}

export type PitchStep = {
  heading: string;
  /** Said out loud. Kept short because they are standing on something. */
  say: string;
  /** Why it is worded that way. For whoever runs this desk after you. */
  note: string;
};

/**
 * The call.
 *
 * Under ninety seconds to the ask. The structure is deliberate: the reason for
 * calling comes before the offer, because a contractor's first thought is
 * "what are you selling me" and the only way past it is to answer immediately.
 * Nothing here promises a specific outcome for their list, because we cannot
 * substantiate it and because the structure is a better pitch than a number.
 */
export function pitch(facts: {
  /** The person dialling. Their own name, not the company's. */
  callerName: string;
  businessName: string;
  contactName?: string | null;
  trade?: string | null;
}): readonly PitchStep[] {
  const who = facts.contactName?.trim() || "";
  const trade = getProspectTrade(facts.trade);
  const me = facts.callerName.trim() || "[your name]";

  return [
    {
      heading: "Opener",
      // Two openers, because having a name and not having one are different
      // calls. Without one you are talking to whoever picked up, and the first
      // job is to get the owner — asking "is this there?" is how a script
      // written only for the happy path sounds on the other nine calls.
      say: who
        ? `Hi, is this ${who}? — ${who}, it's ${me} from ${COMPANY.name}. ` +
          `I'm not selling you anything, I want to send you money. Have you got sixty seconds?`
        : `Hi — it's ${me} from ${COMPANY.name}. Who owns ${facts.businessName}? ` +
          `I'm not selling anything, I want to send them money. Is that you, or can you put me on?`,
      note: who
        ? "Name, company, and the reason, in one breath. 'I'm not selling you anything' is " +
          "true here and it is the only sentence that buys the next twenty seconds from " +
          "somebody who gets four lead-vendor calls a week."
        : "No name on the record, so the first job is getting the owner rather than pitching " +
          "whoever answered. Saying what it is about in the same breath stops it reading as a " +
          "sales call to be blocked — and get the name for next time.",
    },
    {
      heading: "The setup",
      say:
        `We're a general contractor — roofing, siding, windows, gutters, paint, fence. ` +
        `We don't do ${trade ? trade.shortName : "what you do"}, and we never will.`,
      note:
        "Establishes we are not a competitor before the offer lands. Skipping this is the " +
        "single most common reason the call dies: they assume you want their customers.",
    },
    {
      heading: "The offer",
      say:
        `You've got a list of people you've already done work for. Send it to us. We call ` +
        `them, we do the work you don't do, and we pay you ${SHARE_PCT}% of the profit on ` +
        `anything that sells. That's about $${TYPICAL_PER_JOB.toLocaleString("en-US")} a job ` +
        `to you. You don't sell, you don't quote, you don't show up.`,
      note:
        "The number goes here and nowhere earlier. Say 'about' — it is an average from our " +
        "price book, not a promise about their list, and overstating it is how you lose a " +
        "partner in month three.",
    },
    {
      heading: "The proof",
      say:
        `And you can check it. Every job shows you what it sold for, what it cost us, and ` +
        `what was left — so you can see we actually paid you ${SHARE_PCT}% of the real number.`,
      note:
        "This is the differentiator and most people will not believe it until you say it " +
        "plainly. Every lead vendor they have dealt with hid the margin. We publish it.",
    },
    {
      heading: "The ask",
      say:
        `Roughly how many past customers have you got sitting in a system somewhere?`,
      note:
        "An easy question with a number for an answer, which restarts the conversation on " +
        "their side. It also qualifies: under about 150 and this will not be worth either " +
        "of our time yet. Note the answer.",
    },
    {
      heading: "The close",
      say:
        `Here's what I'll do — I'll text you a link right now. It shows the maths and you ` +
        `can sign up on your phone in two minutes. Nothing to pay, nothing to sign today. ` +
        `What's the best number for that?`,
      note:
        "Never try to close on the first call. The win is the link in their hand while they " +
        "are still thinking about it. Send it before you hang up, and say that you are " +
        "sending it now — a text that arrives while you are still on the phone gets opened.",
    },
  ];
}

export type Objection = { says: string; answer: string; note: string };

/**
 * What they actually say.
 *
 * Six, because a page of thirty is a page nobody reads at the moment they need
 * it. Every one of these is a real thing a contractor says in the first minute,
 * and the answers are short enough to say without reading.
 */
export const OBJECTIONS: readonly Objection[] = [
  {
    says: "“I'm not giving you my customer list.”",
    answer:
      "Completely fair, and you're not handing it over — you share a Google Sheet you own, " +
      "we read it, and you switch our access off whenever you want. We never import it, never " +
      "sell it, and one 'no thanks' from any of them puts that person on our do-not-call list " +
      "for the whole company, permanently.",
    note:
      "The number one objection and the one that decides the call. Do not argue with it — " +
      "agree with it first. The control staying with them is the actual answer.",
  },
  {
    says: "“Are you going to compete with me?”",
    answer:
      "No. We carve your trade out in writing before you send us a single name, and it's on " +
      "your account so nobody here can quote it by accident.",
    note: "Answer in one sentence. Hesitating here reads as a yes.",
  },
  {
    says: "“What's this going to cost me?”",
    answer:
      "Nothing. No fee, no subscription, no minimum, and no exclusivity. You only ever see " +
      "money going the other way.",
    note:
      "They are braced for a setup fee because that is how every lead vendor opens. The " +
      "flat 'nothing' is disarming precisely because they did not expect it.",
  },
  {
    says: "“How do I know you'll actually pay me?”",
    answer:
      "You watch it on your own page from the day the customer signs, and you see the whole " +
      "working — sold price, our cost, what's left, your share. We pay when the job is " +
      "finished and the customer has paid us. If nothing sells, you've lost nothing.",
    note:
      "Being shown our own cost is the part that lands. Most people expect to be told the " +
      "margin is confidential.",
  },
  {
    says: "“My customers will think I sold them out.”",
    answer:
      "It's the risk we take most seriously, because your name is the whole asset here. We " +
      "say who we are, we say we work with you, we make one call, and we stop the second " +
      "somebody isn't interested. No pressure scripts, no repeat dialling, nobody pretending " +
      "to be your company.",
    note:
      "This is usually the real objection hiding behind 'I'll think about it'. Ask directly " +
      "if you suspect it: 'Is it the money, or is it how it looks to your customers?'",
  },
  {
    says: "“Send me something and I'll look at it.”",
    answer:
      "Doing it right now — what's the best number? It's a two-minute read and it's got the " +
      "maths on it. I'll follow up Thursday.",
    note:
      "The brush-off. Convert it into a sent link plus a named day, then actually call on " +
      "that day. Half of these are real if you follow up once.",
  },
];

/**
 * The text to send while you are still on the phone.
 *
 * Short, because it is read on a jobsite. Their own business name in it stops
 * it reading as a blast.
 */
export function followUpText(facts: {
  callerName: string;
  businessName: string;
  url: string;
}): string {
  return (
    `${facts.callerName} from ${COMPANY.name} — just spoke. ` +
    `${SHARE_PCT}% of the profit on any job we sell to your past customers, ` +
    `about $${TYPICAL_PER_JOB.toLocaleString("en-US")} a job. ` +
    `Nothing to pay, you can switch it off any time: ${facts.url}`
  );
}

/** The version for when you only have an email address. */
export function followUpEmail(facts: {
  callerName: string;
  businessName: string;
  contactName?: string | null;
  url: string;
}): { subject: string; body: string } {
  const who = facts.contactName?.trim() || "there";
  return {
    subject: `${facts.businessName} + ${COMPANY.name} — ${SHARE_PCT}% of the profit, no cost to you`,
    body:
      `Hi ${who},\n\n` +
      `${facts.callerName} from ${COMPANY.name}. Quick version:\n\n` +
      `You have a list of people you've already done work for. We're a general contractor — ` +
      `roofing, siding, windows, gutters, paint, fence — and we don't do your trade.\n\n` +
      `Share the list, we call them, we do the work, and you get ${SHARE_PCT}% of the profit ` +
      `on anything that sells. That's about $${TYPICAL_PER_JOB.toLocaleString("en-US")} a job. ` +
      `You don't sell, quote, schedule or show up.\n\n` +
      `You can check every figure: each job shows what it sold for, what it cost us, and what ` +
      `was left, so you can see the split is real.\n\n` +
      `No fee, no contract to buy, no exclusivity, and you can revoke access to your list at ` +
      `any time.\n\n` +
      `${facts.url}\n\n` +
      `${facts.callerName}\n${COMPANY.name}\n${COMPANY.phone}`,
  };
}

/** A prospect worth the call: enough of a list for the maths to work. */
export const MIN_VIABLE_LIST = 150;
