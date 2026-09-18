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
  /**
   * The two or three of our trades worth naming to this one, out loud.
   *
   * Not the full list. A solar shop's customers all own a roof, so "roofs and
   * gutters" lands where reciting seven trades does not — and the full list
   * takes ten seconds that a cold call does not have. Their own trade is
   * never in here, which matters most for garage doors, where we genuinely
   * do compete unless we say we do not.
   */
  leadWith: string;
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
    leadWith: "roofs, windows, and siding",
    shortName: "HVAC",
    label: "HVAC & furnace service",
    why: "A service book is the warmest list in home services, and nobody mines it. They have been inside the house, often more than once, and the customer called them — not the other way round.",
    typicalList: "800–4,000",
    ownerOccupied: "high",
  },
  {
    value: "PLUMBING",
    leadWith: "roofs, windows, and siding",
    shortName: "plumbing",
    label: "Plumbing & drains",
    why: "Same as HVAC: invited in, remembered, and repeat. A plumber who did a water heater knows exactly which houses are tired.",
    typicalList: "600–3,000",
    ownerOccupied: "high",
  },
  {
    value: "SOLAR",
    leadWith: "roofs and gutters",
    shortName: "solar",
    label: "Solar install & O&M",
    why: "Every single customer owns their roof and has already signed a five-figure contract on the house. The best-qualified list there is, and solar shops are hungry right now.",
    typicalList: "200–1,500",
    ownerOccupied: "total",
  },
  {
    value: "PEST",
    leadWith: "roofs, siding, and gutters",
    shortName: "pest control",
    label: "Pest control & inspection",
    why: "They are in the crawlspace and on the roofline on a schedule, and they see the damage before the owner does. Recurring contracts mean the relationship is current.",
    typicalList: "500–3,000",
    ownerOccupied: "high",
  },
  {
    value: "SECURITY",
    leadWith: "windows, doors, and siding",
    shortName: "security systems",
    label: "Security & smart home",
    why: "They have been inside the house and know which ones have original windows and doors. Install lists are well kept because they are tied to monitoring accounts.",
    typicalList: "300–2,000",
    ownerOccupied: "high",
  },
  {
    value: "GARAGE",
    leadWith: "roofs, siding, and paint",
    shortName: "garage doors",
    label: "Garage doors & openers",
    why: "Exterior work on a house they have already measured. Their customer already paid for something on the outside of the building.",
    typicalList: "400–2,000",
    ownerOccupied: "high",
  },
  {
    value: "LANDSCAPE",
    leadWith: "roofs, fences, and paint",
    shortName: "landscaping",
    label: "Landscaping & sprinklers",
    why: "Weekly or seasonal contact means the relationship is warm right now, not two years ago. They can see the roof and the paint from the yard.",
    typicalList: "200–1,200",
    ownerOccupied: "medium",
  },
  {
    value: "CLEANING",
    leadWith: "roofs, windows, and gutters",
    shortName: "cleaning",
    label: "Carpet, window & gutter cleaning",
    why: "Cheap, frequent, remembered. A window cleaner has looked at every window in the house and knows which are failing.",
    typicalList: "300–2,000",
    ownerOccupied: "medium",
  },
  {
    value: "REALTOR",
    leadWith: "roofs, paint, and windows",
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
  /** How it reads on screen. */
  tone: "GOOD" | "NEUTRAL" | "BAD";
};

export const PROSPECT_DISPOSITIONS: readonly ProspectDisposition[] = [
  { value: "NEW", label: "Not called yet", short: "New", closes: false, tone: "NEUTRAL" },
  { value: "NO_ANSWER", label: "No answer", short: "No answer", closes: false, tone: "NEUTRAL" },
  { value: "VOICEMAIL", label: "Left a voicemail", short: "Voicemail", closes: false, tone: "NEUTRAL" },
  { value: "GATEKEEPER", label: "Got past reception, owner not in", short: "Gatekeeper", closes: false, tone: "NEUTRAL" },
  { value: "CALLBACK", label: "Owner wants a call back", short: "Call back", closes: false, tone: "GOOD" },
  { value: "SENT_LINK", label: "Pitched, sent the link", short: "Sent link", closes: false, tone: "GOOD" },
  { value: "SIGNED_UP", label: "Signed up", short: "Signed", closes: true, tone: "GOOD" },
  { value: "NOT_NOW", label: "Interested, wrong time", short: "Not now", closes: false, tone: "NEUTRAL" },
  { value: "DEAD", label: "No, and don't call again", short: "Dead", closes: true, tone: "BAD" },
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
 * The two outcomes that set their own next date instead of using the cadence.
 *
 * A named callback is the prospect's own appointment and outranks the
 * sequence. A "not this quarter" is parked long enough to be worth reopening
 * without being forgotten. Everything else is scheduled by CADENCE, and
 * keeping these here rather than inline in the action means there is one
 * place that answers "when do we come back".
 */
export const CALLBACK_HOURS = 24;
export const NOT_NOW_DAYS = 60;

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
 * WRITTEN FOR SOMEBODY WHOSE FIRST LANGUAGE IS NOT ENGLISH, ON A JOBSITE, ON
 * A PHONE. That constraint decides every word here, and anybody editing this
 * has to keep it:
 *
 *   - Short sentences. One idea each. Full stops instead of commas.
 *   - Common words. "We pay you", not "you receive compensation".
 *   - No idioms. "Sitting in a spreadsheet doing nothing" is invisible to a
 *     native speaker and a wall to everybody else.
 *   - Numbers said plainly: "two thousand dollars", not "$2k" or "a couple
 *     of grand".
 *   - The offer before the proof before the ask. If they hang up after
 *     twenty seconds they should still know what was being offered.
 *
 * This is deliberately shorter and flatter than a pitch written to sound
 * clever. A contractor who understands a plain offer signs; one who is
 * impressed but unsure does not.
 *
 * On the claims in step five: they are the caller's own track record, said in
 * the first person, because that is what is true and substantiable. Do not
 * rewrite them into "we" or into what LoveMeAfter has done — an earnings
 * claim a company cannot evidence is the one thing regulators in this
 * industry reliably act on, and it is also weaker on the phone than a person
 * saying what they have personally seen.
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
  const weDo = trade ? trade.leadWith : "roofs, siding, windows, and gutters";

  return [
    {
      heading: "Who I am",
      say: who
        ? `Hi ${who}. My name is ${me}. I am with ${COMPANY.name}. ` +
          `We are a construction company.`
        : `Hi. My name is ${me}. I am with ${COMPANY.name}. We are a ` +
          `construction company. Are you the owner?`,
      note:
        "Name, company, what we are. Three short sentences. With no name on " +
        "file, ask for the owner here rather than pitching whoever answered.",
    },
    {
      heading: "What we do",
      say:
        `We do ${weDo}. We do not do ${trade ? trade.shortName : "your work"}. ` +
        `I am not your competition.`,
      note:
        "Only the trades that matter to their customers, not all seven — ten " +
        "seconds saved and it lands harder. Saying we are not competition is " +
        "the sentence that keeps them on the phone.",
    },
    {
      heading: "What I want",
      say:
        `I am looking for a partner. You have old customers. I want to call ` +
        `them and sell them work.`,
      note:
        "Plain and direct. No jargon. 'Channel partner' means nothing to a " +
        "contractor — say what it actually is.",
    },
    {
      heading: "What you get",
      say:
        `You get ${SHARE_PCT} percent of the profit on every job we sell. ` +
        `That is about two thousand dollars for you. On each job. ` +
        `You do not sell. You do not work. It costs you nothing.`,
      note:
        "The number, then what they do for it, which is nothing. Say 'two " +
        "thousand dollars' out loud rather than reading a figure — it is " +
        "understood first time, in any accent.",
    },
    {
      heading: "Why me",
      say:
        `I have done this for three years. My partners made two thousand ` +
        `dollars or more on each deal. My reps run appointments all day. ` +
        `We close jobs every day. Now I need more customers to call.`,
      note:
        "FIRST PERSON, AND KEEP IT THAT WAY. This is the caller's own record " +
        "and it is true; the same sentences as 'we' become a claim about " +
        "this company that cannot be evidenced. It is also the honest answer " +
        "to the question they are actually asking — why should I trust you.",
    },
    {
      heading: "You can check it",
      say:
        `You will see every job on your own page. What it sold for. What it ` +
        `cost us. Your ${SHARE_PCT} percent. Nothing is hidden.`,
      note:
        "The trust line. Every lead vendor they have dealt with hid the " +
        "margin, so say it simply and let it surprise them.",
    },
    {
      heading: "The question",
      say: `How many old customers do you have?`,
      note:
        "One short question with a number for an answer. It restarts the " +
        "conversation on their side and it qualifies them. Under about 150 " +
        "and this is not worth either of your time yet. Write it down.",
    },
    {
      heading: "The close",
      say:
        `Good. I will text you a link now. Two minutes on your phone. ` +
        `Nothing to pay. What is the best number?`,
      note:
        "Never close on the first call. The win is the link in their hand " +
        "while they are still thinking about it. Send it before you hang up " +
        "and tell them you are sending it now.",
    },
  ];
}

export type Objection = { says: string; answer: string; note: string };

/**
 * What they actually say.
 *
 * Same rule as the script: short sentences, plain words, no idioms. These get
 * read off a screen mid-call, so an answer longer than four lines is an
 * answer nobody uses.
 */
export const OBJECTIONS: readonly Objection[] = [
  {
    says: "\u201cI will not give you my customer list.\u201d",
    answer:
      "That is fair. You do not give it to us. You share a file. You keep it. " +
      "You can turn our access off any time. We never copy it and we never " +
      "sell it. If a customer says no, we never call them again.",
    note:
      "The number one objection and the one that decides the call. Agree " +
      "first. Do not argue. The answer is that they keep control.",
  },
  {
    says: "\u201cWill you compete with me?\u201d",
    answer: "No. We put your trade in writing as excluded before you send anything.",
    note: "One sentence. Any hesitation here sounds like a yes.",
  },
  {
    says: "\u201cWhat does it cost me?\u201d",
    answer: "Nothing. No fee. No contract. No minimum. Money only goes to you.",
    note:
      "They expect a setup fee, because that is how every lead vendor opens. " +
      "A flat 'nothing' is disarming.",
  },
  {
    says: "\u201cHow do I know you will pay me?\u201d",
    answer:
      "You watch it on your own page. You see what the job sold for. You see " +
      "what it cost us. You see your share. We pay when the job is finished " +
      "and the customer has paid us. If nothing sells, you lose nothing.",
    note: "Being shown our own cost is the part that lands.",
  },
  {
    says: "\u201cMy customers will think I sold them out.\u201d",
    answer:
      "Your name matters to us too. We say who we are. We say we work with " +
      "you. We call one time. If they are not interested, we stop.",
    note:
      "Usually the real objection behind 'I will think about it'. Ask " +
      "directly: is it the money, or how it looks to your customers?",
  },
  {
    says: "\u201cSend me something and I will look.\u201d",
    answer:
      "Sending it now. What is the best number? It is a two minute read. " +
      "I will call you Thursday.",
    note:
      "The brush-off. Turn it into a sent link plus a named day, then call " +
      "on that day. Half of these are real if you follow up once.",
  },
];

/**
 * What to call them in a message.
 *
 * Half the lists that get pasted in here come off Google Maps and have no
 * owner's name on them, so the business name has to work as a greeting. It
 * does, as long as it is tidied first: "Front Range Heating & Air LLC" reads
 * like a mail merge, "Front Range Heating" reads like somebody typed it.
 *
 * The suffix strip is deliberately conservative. Only legal-entity endings and
 * a trailing ampersand clause go; nothing that could be the actual name of the
 * shop. Getting this wrong is worse than not trying, because a contractor who
 * sees their name mangled knows exactly what kind of message they are reading.
 */
export function greetingName(facts: {
  contactName?: string | null;
  businessName: string;
}): string {
  const person = facts.contactName?.trim();
  if (person) return person.split(/\s+/)[0];

  return (
    facts.businessName
      .trim()
      .replace(/[,\s]+(inc|llc|l\.l\.c|ltd|co|corp|company|pllc|plc)\.?$/i, "")
      .replace(/\s*&\s*(son|sons|daughters|co)\.?$/i, "")
      .trim() || facts.businessName.trim()
  );
}

/** True when we are addressing a business rather than a person. */
export function isBusinessGreeting(facts: { contactName?: string | null }): boolean {
  return !facts.contactName?.trim();
}

export type Channel = "CALL" | "TEXT" | "EMAIL";

export type CadenceStep = {
  /** 1-based, and what gets stored on the prospect. */
  step: number;
  /** Days after the first touch that this one is due. */
  day: number;
  channel: Channel;
  /** What the console calls it. */
  label: string;
  /** What this touch is for, so it does not repeat the last one. */
  intent: string;
};

/**
 * The follow-up sequence.
 *
 * Eight touches over eighteen days across three channels. That is aggressive
 * by the standards of a contractor who has never been followed up with at all,
 * and unremarkable by the standards of anybody selling B2B — most of these
 * businesses are reached on touch four or later, and a sequence that quits at
 * two is a sequence that pays for the first two and throws away the rest.
 *
 * Three things make it aggressive without making it obnoxious. The channel
 * rotates, so it is never the same interruption twice running. The gaps widen,
 * so it reads as persistence rather than pestering. And it ends — touch eight
 * says we are stopping, which is both honest and, reliably, the touch that
 * gets the most replies.
 *
 * A prospect who asks not to be contacted goes DEAD immediately and the
 * sequence stops, wherever it had got to.
 */
export const CADENCE: readonly CadenceStep[] = [
  { step: 1, day: 0, channel: "CALL", label: "First call", intent: "Reach the owner. If no answer, text straight after." },
  { step: 2, day: 1, channel: "TEXT", label: "Text after the miss", intent: "The offer in writing, so the next call is not cold." },
  { step: 3, day: 2, channel: "CALL", label: "Second call", intent: "Different time of day from the first. Mornings if you tried the afternoon." },
  { step: 4, day: 4, channel: "EMAIL", label: "The full pitch", intent: "Long enough to forward to a partner or a bookkeeper." },
  { step: 5, day: 7, channel: "CALL", label: "Third call", intent: "A week on. Reference the email rather than starting over." },
  { step: 6, day: 11, channel: "TEXT", label: "One-line bump", intent: "Short. Easy to reply to with a yes or a no." },
  { step: 7, day: 15, channel: "CALL", label: "Last call", intent: "Say it is the last one. It changes how the call goes." },
  { step: 8, day: 18, channel: "TEXT", label: "Closing the file", intent: "Tell them you are stopping. This one gets replies." },
];

const CADENCE_BY_STEP = new Map(CADENCE.map((c) => [c.step, c]));

/** Where a prospect is now. Step 0 means nobody has touched them. */
export function currentTouch(step: number): CadenceStep | undefined {
  return CADENCE_BY_STEP.get(Math.max(step, 1));
}

/** What comes after the touch just made, or undefined when the sequence is spent. */
export function nextTouch(step: number): CadenceStep | undefined {
  return CADENCE_BY_STEP.get(step + 1);
}

/**
 * When the next touch is due, from the one just completed.
 *
 * Measured forward from now rather than from a stored start date, because a
 * sequence that is behind should carry on from where the caller actually is —
 * anchoring to day zero would dump five overdue touches into the queue at once
 * after any gap, which is how a cadence turns into a backlog nobody works.
 */
export function nextTouchDue(completedStep: number, from: Date): Date | null {
  const done = CADENCE_BY_STEP.get(completedStep);
  const next = nextTouch(completedStep);
  if (!next) return null;
  const gapDays = Math.max(next.day - (done?.day ?? 0), 0);
  return new Date(from.getTime() + gapDays * 24 * 60 * 60 * 1000);
}

export const CADENCE_LENGTH = CADENCE.length;

type MessageFacts = {
  callerName: string;
  businessName: string;
  contactName?: string | null;
  url: string;
};

const money = `$${TYPICAL_PER_JOB.toLocaleString("en-US")}`;

/**
 * The text message for a given touch.
 *
 * Same reader as the script, so the same rules: short sentences, plain words,
 * no idioms. Each touch is worded differently, because the fastest way to get
 * blocked is to send the same paragraph three times, and each one assumes the
 * ones before it arrived.
 */
export function touchText(step: number, facts: MessageFacts): string {
  const who = greetingName(facts);
  const me = facts.callerName.trim() || "[your name]";

  switch (step) {
    case 1:
    case 2:
      return (
        `${who} — this is ${me} from ${COMPANY.name}. I called you just now. ` +
        `We are a construction company. We want to call your old customers and ` +
        `sell them work. You get ${SHARE_PCT}% of the profit. That is about ` +
        `${money} on each job. You do nothing and it costs nothing. ${facts.url}`
      );
    case 6:
      return (
        `${who}, are you interested? ${SHARE_PCT}% of the profit on each job. ` +
        `About ${money} for you. No cost. You can stop any time. ` +
        `Yes or no is fine: ${facts.url}`
      );
    case 8:
      return (
        `${who} — I will stop calling you now. If you ever want ${money} a job ` +
        `from your old customer list, the offer stays open: ${facts.url}. ` +
        `Good luck. ${me}`
      );
    default:
      return (
        `${who} — ${me} from ${COMPANY.name} again. ${SHARE_PCT}% of the profit ` +
        `on work we sell to your old customers. About ${money} each job. ` +
        `No cost to you: ${facts.url}`
      );
  }
}

/** The email for a given touch. Only steps 4 and 8 send one by default. */
export function touchEmail(
  step: number,
  facts: MessageFacts,
): { subject: string; body: string } {
  const who = greetingName(facts);
  const me = facts.callerName.trim() || "[your name]";
  const sign = `${me}\n${COMPANY.name}\n${COMPANY.phone}`;

  if (step >= 8) {
    return {
      subject: `Closing the file — ${facts.businessName}`,
      body:
        `Hi ${who},\n\n` +
        `I have tried you a few times, so I will stop here.\n\n` +
        `The offer does not expire: share the customers you have already done work for, ` +
        `we sell them roofing, siding, windows, gutters, paint or fence, and you take ` +
        `${SHARE_PCT}% of the profit — about ${money} a job. You do none of the work and ` +
        `it costs you nothing.\n\n` +
        `${facts.url}\n\n` +
        `If it is not for you, no hard feelings at all.\n\n${sign}`,
    };
  }

  return {
    subject: `${facts.businessName} + ${COMPANY.name} — ${SHARE_PCT}% of the profit, no cost to you`,
    body:
      `Hi ${who},\n\n` +
      `${me} from ${COMPANY.name}. Quick version:\n\n` +
      `You have a list of people you have already done work for. We are a general ` +
      `contractor — roofing, siding, windows, gutters, paint, fence — and we do not do ` +
      `your trade.\n\n` +
      `Share the list, we call them, we do the work, and you get ${SHARE_PCT}% of the ` +
      `profit on anything that sells. That is about ${money} a job. You do not sell, quote, ` +
      `schedule or show up.\n\n` +
      `You can check every figure: each job shows what it sold for, what it cost us, and ` +
      `what was left, so you can see the split is real. Most companies would not show you ` +
      `their cost.\n\n` +
      `No fee, no contract to buy, no exclusivity, and you can revoke access to your list ` +
      `at any time.\n\n` +
      `${facts.url}\n\n${sign}`,
  };
}

/** A prospect worth the call: enough of a list for the maths to work. */
export const MIN_VIABLE_LIST = 150;
