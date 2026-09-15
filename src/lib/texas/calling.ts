// When a purchased lead may legally be called, and by what.
//
// Cold-calling bought lists is the highest-liability thing this business
// does. Not because the rules are obscure — they are published and specific —
// but because they are the kind nobody remembers at 8:40pm with three names
// left on the list. So they live here, and the dialer asks this module before
// it shows anyone a number.
//
// What governs a call to a Texas homeowner:
//
//   FTC Telemarketing Sales Rule, 16 CFR 310 — national Do Not Call, an
//   internal do-not-call list we keep ourselves, accurate caller ID, and a
//   disclosure in the first breath that this is a sales call and who from.
//
//   TCPA, 47 U.S.C. 227 — prior express *written* consent before an autodialer
//   or a prerecorded voice may touch a mobile number. A purchased list is not
//   consent. This is why the dialer in this codebase is click-to-call and
//   why isAutodialable() exists only to return false.
//
//   Tex. Bus. & Com. Code Ch. 304 — the Texas no-call list, and hours
//   narrower than the federal ones. We take the narrower of the two.
//
//   Tex. Bus. & Com. Code Ch. 302 — telephone solicitors need a registration
//   certificate from the Texas Secretary of State, with a $10,000 bond,
//   unless an exemption applies. That is a filing, not a function, so it is
//   an open question in docs/texas-launch.md rather than code.
//
//   Cal. Penal Code 632 — and this is the one that catches people. The
//   callers sit in California. Texas is a one-party-consent state and
//   California is an all-party-consent state, and a call between them is
//   safest treated as all-party. So if a call is recorded, everyone on it has
//   to be told and agree.
//
// None of this is legal advice. It is a careful reading, encoded so it is
// applied consistently, and it should be checked by a telemarketing-compliance
// attorney before the first dial.

export type CallOutcome =
  | "NO_ANSWER"
  | "VOICEMAIL"
  | "BUSY"
  | "WRONG_NUMBER"
  | "NOT_INTERESTED"
  | "DO_NOT_CALL"
  | "CALLBACK"
  | "APPOINTMENT_SET"
  | "DISCONNECTED";

/** Outcomes that mean this number is finished, whatever the attempt count. */
export const TERMINAL_OUTCOMES: readonly CallOutcome[] = [
  "DO_NOT_CALL",
  "WRONG_NUMBER",
  "DISCONNECTED",
];

// --- When you may call -------------------------------------------------------

/**
 * Calling hours, in the called party's local time.
 *
 * Federal (TSR) is 8am–9pm. Texas (Ch. 304) is 9am–9pm on weekdays and
 * Saturdays, and noon–9pm on Sundays. Where they differ we take the Texas
 * one, because it is narrower and because the call is to a Texan.
 *
 * Stored as hours in 24h local time. `null` opening means no calling at all.
 */
export const TEXAS_CALLING_HOURS = {
  weekday: { opens: 9, closes: 21 },
  saturday: { opens: 9, closes: 21 },
  sunday: { opens: 12, closes: 21 },
} as const;

export type CallWindow = { opens: number; closes: number };

export function windowFor(localTime: Date): CallWindow {
  const day = localTime.getDay();
  if (day === 0) return TEXAS_CALLING_HOURS.sunday;
  if (day === 6) return TEXAS_CALLING_HOURS.saturday;
  return TEXAS_CALLING_HOURS.weekday;
}

/**
 * Is it legal to dial right now, in the lead's own time zone?
 *
 * The caller being in California is irrelevant to this — the curfew follows
 * the phone being rung, which is why the dialer has to know where the lead
 * is rather than where the rep is.
 */
export function isWithinCallingHours(localTime: Date): boolean {
  const { opens, closes } = windowFor(localTime);
  const hour = localTime.getHours() + localTime.getMinutes() / 60;
  return hour >= opens && hour < closes;
}

/** When the next legal window opens, for the "come back at" line on the queue. */
export function nextWindowOpens(localTime: Date): Date {
  const next = new Date(localTime);
  const { opens, closes } = windowFor(localTime);
  const hour = next.getHours() + next.getMinutes() / 60;

  if (hour < opens) {
    next.setHours(opens, 0, 0, 0);
    return next;
  }
  if (hour < closes) return new Date(localTime);

  // Past close: roll to the next day's opening, whatever that day's rule is.
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  next.setHours(windowFor(next).opens, 0, 0, 0);
  return next;
}

// --- Whether you may call this number at all ---------------------------------

export type DncList = "NATIONAL" | "TEXAS" | "INTERNAL" | "LITIGATOR";

export type ScreenableLead = {
  phone: string;
  /** Lists this number appeared on when it was last scrubbed. */
  dnc?: readonly DncList[];
  /** When the list was last checked against the registries. */
  scrubbedAt?: Date | null;
  /** Mobile numbers can never be autodialed without written consent. */
  lineType?: "MOBILE" | "LANDLINE" | "UNKNOWN";
  /** Attempts already made to this number, newest first. */
  attempts?: readonly { at: Date; outcome: CallOutcome }[];
};

/**
 * How stale a Do Not Call scrub may be.
 *
 * The TSR safe harbour is built around scrubbing no more than 31 days before
 * the call. 30 is inside it with a day to spare, which is the side of that
 * line to be on.
 */
export const SCRUB_MAX_AGE_DAYS = 30;

/**
 * Our own policy, not a statute: how hard we chase a number before we stop.
 *
 * There is no federal cap on attempts to a residential line. There is a limit
 * on how many times a stranger will tolerate being rung, and a pattern of
 * hammering one number is what turns a complaint into a case.
 */
export const MAX_ATTEMPTS = 6;
export const MAX_ATTEMPTS_PER_DAY = 1;
export const MIN_HOURS_BETWEEN_ATTEMPTS = 20;

export type Block = { code: string; reason: string };

/** Every reason this number may not be dialled right now. Empty means go. */
export function screenLead(lead: ScreenableLead, now: Date, localTime: Date): Block[] {
  const blocks: Block[] = [];

  for (const list of lead.dnc ?? []) {
    blocks.push({
      code: `DNC_${list}`,
      reason:
        list === "INTERNAL"
          ? "This number asked us not to call. That request is permanent and is ours to honour, not the registry's."
          : list === "LITIGATOR"
            ? "Flagged as a known TCPA litigator. Do not dial."
            : `On the ${list === "TEXAS" ? "Texas" : "national"} Do Not Call registry.`,
    });
  }

  if (!lead.scrubbedAt) {
    blocks.push({
      code: "NOT_SCRUBBED",
      reason: "This list has never been scrubbed against the DNC registries.",
    });
  } else {
    const ageDays = (now.getTime() - lead.scrubbedAt.getTime()) / 86_400_000;
    if (ageDays > SCRUB_MAX_AGE_DAYS) {
      blocks.push({
        code: "SCRUB_STALE",
        reason: `Last scrubbed ${Math.floor(ageDays)} days ago. Re-scrub before calling — the safe harbour runs out at 31.`,
      });
    }
  }

  if (!isWithinCallingHours(localTime)) {
    const { opens, closes } = windowFor(localTime);
    blocks.push({
      code: "OUTSIDE_HOURS",
      reason: `It is ${formatHour(localTime)} where they are. Texas allows ${formatClock(opens)}–${formatClock(closes)} today.`,
    });
  }

  const attempts = lead.attempts ?? [];
  const terminal = attempts.find((a) => TERMINAL_OUTCOMES.includes(a.outcome));
  if (terminal) {
    blocks.push({
      code: `CLOSED_${terminal.outcome}`,
      reason: `Marked ${terminal.outcome.toLowerCase().replace(/_/g, " ")} on ${terminal.at.toDateString()}.`,
    });
  }

  if (attempts.length >= MAX_ATTEMPTS) {
    blocks.push({
      code: "ATTEMPTS_EXHAUSTED",
      reason: `${attempts.length} attempts already. Let it go.`,
    });
  }

  const last = attempts[0];
  if (last) {
    const hours = (now.getTime() - last.at.getTime()) / 3_600_000;
    if (hours < MIN_HOURS_BETWEEN_ATTEMPTS) {
      blocks.push({
        code: "TOO_SOON",
        reason: `Called ${Math.floor(hours)}h ago. One attempt a day, no more.`,
      });
    }
  }

  return blocks;
}

export function isCallable(lead: ScreenableLead, now: Date, localTime: Date): boolean {
  return screenLead(lead, now, localTime).length === 0;
}

// --- What may do the dialling ------------------------------------------------

/**
 * Always false, and it is a function so that the answer is written down once.
 *
 * The TCPA requires prior express written consent before an autodialer or an
 * artificial or prerecorded voice may call a mobile number. A purchased list
 * carries no consent of any kind. Roughly two thirds of US households are
 * mobile-only, and a "landline" flag on a bought list is a guess about a
 * number that may have been ported years ago.
 *
 * So: no predictive dialer, no power dialer, no ringless voicemail, no
 * prerecorded drops. A human presses call, every time. That is slower and it
 * is the difference between a business and a $1,500-per-call exposure.
 */
export function isAutodialable(): false {
  return false;
}

export const AUTODIAL_POLICY =
  "Manual dial only. No predictive or power dialer, no prerecorded messages, no ringless " +
  "voicemail. Purchased lists carry no consent, and the TCPA prices a mistake at $500 to " +
  "$1,500 per call.";

// --- What must be said -------------------------------------------------------

/**
 * The disclosure the TSR requires promptly, before the pitch.
 *
 * Not a suggestion about tone: 16 CFR 310.4(d) requires the caller's identity,
 * the seller's identity, and that the purpose is to sell something.
 */
export function openingDisclosure(callerName: string, companyName: string): string {
  return `Hi, this is ${callerName} calling from ${companyName} — this is a sales call about home improvement work. Do you have thirty seconds?`;
}

/**
 * All-party consent, because the caller sits in California.
 *
 * Texas is one-party. California (Penal Code 632) is all-party, and applies to
 * confidential communications recorded by someone in California. An
 * interstate call between the two is the exact case courts have split on, so
 * this codebase takes the strict reading: if it is recorded, everyone is told
 * and everyone agrees, on the recording, before anything else is said.
 */
export const RECORDING_CONSENT_RULE = "ALL_PARTY" as const;

export const RECORDING_DISCLOSURE =
  "Before we go on — this call is recorded for training and quality. Is that alright with you?";

/** No consent, no recording. There is no third option. */
export function mayRecord(consentGiven: boolean): boolean {
  return consentGiven === true;
}

// --- Small helpers -----------------------------------------------------------

function formatClock(hour: number): string {
  const period = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}${period}`;
}

function formatHour(date: Date): string {
  const hour = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hour >= 12 ? "pm" : "am";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${minutes}${period}`;
}
