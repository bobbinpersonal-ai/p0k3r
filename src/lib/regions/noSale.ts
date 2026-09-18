// Why an appointment didn't close, written down where the partner can read it.
//
// This is the trust mechanism of the channel program, not a reporting nicety.
// A partner hands over customers they spent years earning, watches four of
// them go to appointment, and hears nothing back on three. With no record they
// have exactly two theories: we are bad at selling, or we closed the deal and
// kept the money. There is no way for them to tell which, and the second one
// ends the partnership.
//
// So every appointment that doesn't sell produces a note with a reason code, a
// name against it and a timestamp, and the partner reads the same words the
// rep wrote. It costs a rep ninety seconds and it is the difference between a
// program that compounds and one that burns through partners.
//
// The reason codes exist so these are countable as well as readable. "How
// often is it price" is a question worth being able to answer, and free text
// alone can never answer it.

export type NoSaleReason = {
  value: string;
  /** What the partner sees in a sentence. */
  label: string;
  /** One or two words, for a badge. The full label wraps to three lines. */
  short: string;
  /** What the rep sees while picking, so codes stay used consistently. */
  guidance: string;
  /**
   * Whether this one is worth going back to. Drives the revisit prompt and
   * tells a partner whether their customer is gone or just not ready.
   */
  revisitable: boolean;
};

export const NO_SALE_REASONS: readonly NoSaleReason[] = [
  {
    value: "PRICE",
    short: "Price",
    label: "Price — it was more than they wanted to spend",
    guidance: "They wanted the work and balked at the number. Put the number in the detail.",
    revisitable: true,
  },
  {
    value: "TIMING",
    short: "Timing",
    label: "Timing — they want it, just not yet",
    guidance: "Selling season, a bonus in March, after a wedding. Set a revisit date.",
    revisitable: true,
  },
  {
    value: "FINANCING",
    short: "Financing",
    label: "Financing — couldn't get it approved",
    guidance: "They said yes and the money didn't. Worth another look if their position changes.",
    revisitable: true,
  },
  {
    value: "SPOUSE",
    short: "Decision-maker away",
    label: "Second decision-maker wasn't there",
    guidance: "Our miss, not theirs. Say so plainly — the partner will respect it more.",
    revisitable: true,
  },
  {
    value: "COMPETITOR",
    short: "Went elsewhere",
    label: "Went with someone else",
    guidance: "Note who and what they charged if you got it. That's worth real money to us.",
    revisitable: false,
  },
  {
    value: "NOT_NEEDED",
    short: "Didn't need it",
    label: "The work didn't need doing",
    guidance: "We looked and it was fine. This is a good outcome — say it like one.",
    revisitable: false,
  },
  {
    value: "NOT_OWNER",
    short: "Not the owner",
    label: "Not the homeowner",
    guidance: "Tenant, or the property changed hands. Tell the partner so their list improves.",
    revisitable: false,
  },
  {
    value: "NO_SHOW",
    short: "No-show",
    label: "Nobody was home",
    guidance: "We went and they weren't there. Say whether we've tried to rebook.",
    revisitable: true,
  },
  {
    value: "OUT_OF_SCOPE",
    short: "Out of scope",
    label: "Needed work we don't do",
    guidance: "Electrical, plumbing, HVAC, structural. Say what they actually needed.",
    revisitable: false,
  },
] as const;

export function getNoSaleReason(value: string): NoSaleReason | undefined {
  return NO_SALE_REASONS.find((r) => r.value === value);
}

export function noSaleLabel(value: string): string {
  return getNoSaleReason(value)?.label ?? value;
}

/** Badge form. Falls back to the code so an unknown one is still visible. */
export function noSaleShort(value: string): string {
  return getNoSaleReason(value)?.short ?? value;
}

export type NoSaleFacts = {
  customerName: string;
  address: string;
  partnerName: string;
  reason: string;
  detail: string;
  filedBy: string;
  quotedAmount: number | null;
  customerAcknowledged: boolean;
  revisitAt: Date | null;
  visitedAt: Date;
  companyName: string;
};

export type NoSaleNote = {
  title: string;
  lines: readonly string[];
  /** The one sentence a partner reads if they read nothing else. */
  summary: string;
};

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function day(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Build the confirmation note a partner sees and a rep can hand over.
 *
 * Written as plain statements rather than as a form, because the audience is a
 * contractor reading it on a phone, not a filing system. The company name and
 * the filer are in the body rather than only in metadata so a screenshot of it
 * is still evidence of who said what.
 */
export function noSaleNote(facts: NoSaleFacts): NoSaleNote {
  const reason = getNoSaleReason(facts.reason);
  const lines: string[] = [];

  lines.push(`${facts.companyName} visited ${facts.customerName} at ${facts.address}.`);
  lines.push(`Visit date: ${day(facts.visitedAt)}.`);
  lines.push(`Referred by: ${facts.partnerName}.`);
  lines.push("");
  lines.push(`Outcome: no sale — ${reason?.label ?? facts.reason}.`);

  if (facts.quotedAmount != null) {
    lines.push(`We quoted ${money(facts.quotedAmount)}.`);
  } else {
    lines.push("We did not reach a price on this visit.");
  }

  lines.push("");
  lines.push(facts.detail);
  lines.push("");

  if (facts.revisitAt) {
    lines.push(`Worth another conversation after ${day(facts.revisitAt)}. We'll handle it.`);
  } else if (reason && !reason.revisitable) {
    lines.push("We're treating this one as closed and won't call them again.");
  }

  lines.push(
    facts.customerAcknowledged
      ? "The homeowner confirmed the visit and this outcome at the door."
      : "Filed from the visit. The homeowner did not sign off on this note.",
  );
  lines.push(`Filed by ${facts.filedBy}.`);

  return {
    title: `No sale — ${facts.customerName}`,
    lines,
    summary:
      `${reason?.label ?? facts.reason}` +
      (facts.quotedAmount != null ? ` after a ${money(facts.quotedAmount)} quote.` : "."),
  };
}
