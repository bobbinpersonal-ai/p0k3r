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

/** The flat fee, in cents, paid per job that closes off a partner's list. */
export const CHANNEL_PARTNER_FEE_CENTS = 200_000;

export function formatFee(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
