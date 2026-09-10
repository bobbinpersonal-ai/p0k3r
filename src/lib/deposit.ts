// What we take at the door, and what's left to pay on the day.
//
// A deposit does two things at once, and they pull in opposite directions: it
// has to be big enough that a booking means something — a crew drives to this
// address instead of another one — and small enough that someone who agreed
// thirty seconds ago on their own doorstep doesn't stall on it. So it's a
// share of the visit rather than a flat fee, floored so the smallest job is
// still worth collecting for, and capped so the largest one doesn't turn a
// yes into "let me think about it".
//
// The rest is due when the work is done. Nothing here is a separate charge:
// the deposit comes off the price the customer was quoted, which is the only
// version of this that survives being explained on a doorstep.

/** Share of the first visit taken up front. */
export const DEPOSIT_RATE = 0.2;

/** Below this, collecting is more hassle than the money is worth. */
export const DEPOSIT_MINIMUM = 25;

/**
 * Above this, the deposit stops being a formality and becomes its own
 * decision. A bigger job is worth more, but it isn't worth more *at the
 * door* — the balance is still due either way.
 */
export const DEPOSIT_MAXIMUM = 150;

const ceilToFive = (value: number) => Math.ceil(value / 5) * 5;

/**
 * The deposit for one visit at `perVisit` dollars.
 *
 * Never more than the job itself: on a cheap enough visit the minimum would
 * otherwise ask for more than the whole price.
 */
export function depositFor(perVisit: number): number {
  if (perVisit <= 0) return 0;
  const share = ceilToFive(perVisit * DEPOSIT_RATE);
  const bounded = Math.min(Math.max(share, DEPOSIT_MINIMUM), DEPOSIT_MAXIMUM);
  return Math.min(bounded, perVisit);
}

/** What's still owed on the day, given whatever was actually collected. */
export function balanceAfter(perVisit: number, deposit: number | null | undefined): number {
  return Math.max(0, perVisit - (deposit ?? 0));
}
