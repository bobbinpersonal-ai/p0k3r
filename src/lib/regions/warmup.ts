// How a partner's customers get approached before we ring them.
//
// The program's whole promise is that these are warm introductions, not a
// bought list. A partner who hands over 1,400 names and then hears from an
// angry customer that a stranger called out of the blue does not send a
// second list, and tells the next business we call.
//
// So the track is the partner's choice, recorded per partner, and on the
// one-to-one track it is enforced rather than advised: the desk cannot dial a
// customer who has not had the introduction. See setDisposition in
// src/app/admin/desk/actions.ts.

export type Track = {
  value: string;
  label: string;
  /** What the partner is choosing, in their words. */
  blurb: string;
  /** Whether a customer must be warmed before the desk may dial. */
  gatesDialing: boolean;
  /** What the desk sees on a lead that is still waiting. */
  waitingLabel: string;
};

export const TRACKS: readonly Track[] = [
  {
    value: "PARTNER_BLAST",
    label: "Co-branded announcement",
    blurb:
      "One email and text goes out over your name introducing us, then we call. Fastest, and " +
      "your customers hear it from you first.",
    gatesDialing: true,
    waitingLabel: "Announcement not sent",
  },
  {
    value: "DESK_1TO1_INTRO",
    label: "Personal introduction, one at a time",
    blurb:
      "We write to each customer individually mentioning the work you did for them, then call a " +
      "day or two later. Slower, and it reads like a person rather than a campaign.",
    gatesDialing: true,
    waitingLabel: "Intro not sent yet",
  },
  {
    value: "DIRECT_COLD",
    label: "Just call them",
    blurb:
      "No introduction. We ring them, say who we are and that we work with you. Only pick this " +
      "if you are comfortable with that.",
    gatesDialing: false,
    waitingLabel: "",
  },
];

const BY_VALUE = new Map(TRACKS.map((t) => [t.value, t]));

export function getTrack(value: string | null | undefined): Track {
  return (value && BY_VALUE.get(value)) || TRACKS[1];
}

export function isTrack(value: string): boolean {
  return BY_VALUE.has(value);
}

export const UNWARMED = "UNWARMED";
export const PENDING_INTRO = "PENDING_INTRO";
export const WARMED = "WARMED";

/**
 * Whether the desk may dial this customer yet.
 *
 * A lead with no partner behind it was never on anybody's list, so there is
 * nothing to warm up and nothing to gate.
 */
export function mayDial(
  track: string | null | undefined,
  warmupStatus: string,
  hasPartner: boolean,
): boolean {
  if (!hasPartner) return true;
  if (!getTrack(track).gatesDialing) return true;
  return warmupStatus === WARMED;
}

/**
 * The introduction itself.
 *
 * Names the partner in the first line, because that is the only reason this
 * message is not spam. Kept short enough to land as one text.
 */
export function introMessage(facts: {
  customerName: string;
  partnerName: string;
  companyName: string;
  companyPhone: string;
}): { sms: string; emailSubject: string; emailBody: string } {
  const first = facts.customerName.trim().split(/\s+/)[0] || "there";

  const sms =
    `Hi ${first} — ${facts.companyName} here. We work with ${facts.partnerName}, who you've ` +
    `had work done by before. They've asked us to let you know we handle roofing, siding, ` +
    `windows and gutters if anything needs doing. I'll give you a quick call in a day or two — ` +
    `reply STOP and I won't. ${facts.companyPhone}`;

  const emailBody =
    `Hi ${first},\n\n` +
    `${facts.companyName} here. We work alongside ${facts.partnerName}, who you've had work ` +
    `done by before — they've asked us to introduce ourselves.\n\n` +
    `We do the outside of the house: roofing, siding, windows, gutters, fencing, garage doors ` +
    `and exterior paint. If anything on that list needs looking at, the estimate is free and ` +
    `there's no obligation.\n\n` +
    `I'll give you a quick call in the next day or two. If you'd rather I didn't, just reply ` +
    `to this email and I'll leave you alone.\n\n` +
    `${facts.companyPhone}`;

  return {
    sms,
    emailSubject: `${facts.partnerName} asked us to introduce ourselves`,
    emailBody,
  };
}
