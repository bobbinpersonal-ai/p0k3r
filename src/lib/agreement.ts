// The written agreement behind a job, and the cancellation rights that come
// with selling one at somebody's front door.
//
// Selling on a doorstep is not the same transaction as selling on a website.
// In California a sale of $25 or more agreed anywhere other than the seller's
// own place of business is a "home solicitation sale" (Civil Code 1689.5),
// and it carries rights the buyer cannot sign away: three business days to
// cancel for any reason at all, a refund of everything paid within ten days,
// and — the part that is easiest to get wrong — a *written* notice of that
// right, given at the time of sale, in the language the sale was conducted
// in, with a cancellation form the buyer can actually fill in and send back
// (Civil Code 1689.7).
//
// So this is not a nicety we generate afterwards. A home solicitation sale
// without the notice is voidable by the buyer, and the clock on their three
// days does not start until they get it. That is why the agreement is built
// from the booking itself, linked from the confirmation that goes out the
// moment the job is taken, and printable for anyone who wants it on paper.
//
// IMPORTANT: this file encodes a reading of the statute, not legal advice,
// and the wording of the notice in particular is prescribed by law. Have a
// California attorney review it before the first door — see the open
// questions in docs/door-knock.md.

import { EXEMPTION_LIMIT } from "@/lib/landscaping";
import { LICENSING_DISCLAIMER, SITE_NAME } from "@/lib/compliance";

/**
 * Who the contract is with, and where a cancellation can be posted.
 *
 * The mailing address is not optional decoration: the notice has to tell the
 * buyer where to send it, so an unset address makes the whole notice
 * defective. Callers render `BUSINESS_ADDRESS_MISSING` loudly rather than
 * printing a blank line that reads as complete.
 */
export const SELLER = {
  name: process.env.NEXT_PUBLIC_LEGAL_ENTITY || SITE_NAME,
  tradeName: SITE_NAME,
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
  phone: process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
};

export const BUSINESS_ADDRESS_MISSING =
  "[SET NEXT_PUBLIC_BUSINESS_ADDRESS — the cancellation notice is not valid without a mailing address]";

export const sellerAddress = () => SELLER.address || BUSINESS_ADDRESS_MISSING;

/** Business days the buyer has to cancel, counted from the day after the sale. */
export const CANCELLATION_BUSINESS_DAYS = 3;

/** Days the seller has to return everything paid, once notice arrives. */
export const REFUND_DAYS = 10;

/**
 * California state holidays that fall on a fixed date.
 *
 * "Business day" excludes Sundays and holidays, so a Friday sale can run to
 * the following Thursday. Only the fixed-date holidays are listed: the
 * floating ones (Thanksgiving, and the Monday holidays) are computed below.
 * Getting this wrong in the buyer's favour costs nothing; getting it wrong in
 * ours voids the notice, so where the rule is unclear the later date wins.
 */
const FIXED_HOLIDAYS = [
  [0, 1], // New Year's Day
  [5, 19], // Juneteenth
  [6, 4], // Independence Day
  [10, 11], // Veterans Day
  [11, 25], // Christmas Day
] as const;

function isHoliday(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  const weekday = date.getDay();
  const weekOfMonth = Math.floor((day - 1) / 7);

  if (FIXED_HOLIDAYS.some(([m, d]) => m === month && d === day)) return true;
  // Third Monday in January (MLK) and February (Washington).
  if (weekday === 1 && weekOfMonth === 2 && (month === 0 || month === 1)) return true;
  // Last Monday in May (Memorial).
  if (weekday === 1 && month === 4 && day + 7 > 31) return true;
  // First Monday in September (Labor).
  if (weekday === 1 && month === 8 && weekOfMonth === 0) return true;
  // Fourth Thursday in November (Thanksgiving).
  if (weekday === 4 && month === 10 && weekOfMonth === 3) return true;
  return false;
}

/** Sundays and holidays don't count. Saturdays do. */
export function isBusinessDay(date: Date): boolean {
  return date.getDay() !== 0 && !isHoliday(date);
}

/**
 * Midnight at the end of the buyer's cancellation period.
 *
 * Returned as the last day they can still cancel — the notice says "not later
 * than midnight of" this date, which is the end of it, not the start.
 */
export function cancellationDeadline(
  transaction: Date,
  businessDays: number = CANCELLATION_BUSINESS_DAYS,
): Date {
  const day = new Date(transaction);
  day.setHours(0, 0, 0, 0);
  let counted = 0;
  while (counted < businessDays) {
    day.setDate(day.getDate() + 1);
    if (isBusinessDay(day)) counted++;
  }
  return day;
}

export function formatLegalDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * The statement the law wants next to where the buyer signs, not buried in
 * the terms. Rendered in bold at the required size by the page.
 */
export const CANCELLATION_PROXIMITY_NOTICE =
  "You, the Buyer, may cancel this transaction at any time prior to midnight of the " +
  "third business day after the date of this transaction. See the attached Notice of " +
  "Cancellation form for an explanation of this right.";

/**
 * The Notice of Cancellation, which the statute prescribes in substantially
 * this form and requires the buyer to receive two copies of — one to send and
 * one to keep.
 */
export function noticeOfCancellation(transaction: Date, deadline: Date): string[] {
  return [
    `You may cancel this transaction, without any penalty or obligation, within three business days from ${formatLegalDate(transaction)}.`,
    `If you cancel, any payments made by you under the contract, and any negotiable instrument executed by you, will be returned within ${REFUND_DAYS} days following receipt by the seller of your cancellation notice, and any security interest arising out of the transaction will be cancelled.`,
    `If you cancel, you must make available to the seller at your residence, in substantially as good condition as when received, any goods delivered to you under this contract; or you may, if you wish, comply with the instructions of the seller regarding the return shipment of the goods at the seller's expense and risk.`,
    `If you do make the goods available to the seller and the seller does not pick them up within 20 days of the date of your notice of cancellation, you may retain or dispose of the goods without any further obligation. If you fail to make the goods available to the seller, or if you agree to return the goods to the seller and fail to do so, then you remain liable for performance of all obligations under this contract.`,
    `To cancel this transaction, mail or deliver a signed and dated copy of this cancellation notice, or any other written notice, to ${SELLER.name} at ${sellerAddress()}, not later than midnight of ${formatLegalDate(deadline)}.`,
  ];
}

/** The terms themselves — short, in the order a customer would ask them. */
export function agreementTerms(): { heading: string; body: string }[] {
  return [
    {
      heading: "What we agree to do",
      body:
        "We will perform the service described above at the property described above, " +
        "on the date and within the arrival window shown, using our own tools and " +
        "equipment. If we cannot reach the property, cannot get access to the work " +
        "area, or find conditions materially different from what was described to us, " +
        "we will contact you before doing the work rather than changing the price " +
        "without telling you.",
    },
    {
      heading: "The price",
      body:
        "The price shown above is flat for the service and property size described. It " +
        "is not an estimate and it does not change on the day unless you ask us for " +
        "additional work and agree the price for it first. Where the service is billed " +
        "labour-only, materials are charged separately at our cost and are shown to you " +
        "before they are bought.",
    },
    {
      heading: "Paying",
      body:
        "Any deposit shown above has been received and comes off the price. The balance " +
        "is due when the work is finished. Recurring plans are charged per visit at the " +
        "rate shown, and either of us may end a recurring plan at any time by telling " +
        "the other before the next scheduled visit.",
    },
    {
      heading: "Rescheduling and cancelling",
      body:
        "You can reschedule or cancel any visit using the link in your confirmation, or " +
        `by calling ${SELLER.phone || "us"}. Cancel more than 24 hours before the visit ` +
        "and any deposit is refunded in full. Inside 24 hours we may keep the deposit " +
        "against the slot we held. This paragraph does not limit your cancellation " +
        "rights under the notice below, which come first.",
    },
    {
      heading: "What we are not",
      body:
        `${SELLER.tradeName} is not a licensed contractor. We perform minor maintenance ` +
        `and repair work under the $${EXEMPTION_LIMIT.toLocaleString()} threshold ` +
        "California allows for unlicensed work. We do not perform, and this agreement " +
        "does not cover, any work requiring a building permit or involving electrical, " +
        "plumbing, or structural systems. Work of that kind is referred to independent " +
        "licensed contractors who contract with you directly, and we are not a party to " +
        "and take no fee from that arrangement.",
    },
    {
      heading: "If something goes wrong",
      body:
        "Tell us within 7 days of the visit and we will come back and put right any part " +
        "of the service that was not done properly, at no charge. That re-performance is " +
        "the remedy this agreement provides. Nothing here limits any right you have under " +
        "California law, including your rights under the notice below.",
    },
    {
      heading: "Your details",
      body:
        "We use your name, address and phone number to schedule and perform the work and " +
        "to contact you about it. We do not sell them. If you asked us to refer you to a " +
        "licensed contractor for larger work, we pass your details to those contractors " +
        "for that purpose only, and only because you asked.",
    },
  ];
}

/** The licensing disclaimer, so the printed agreement carries it too. */
export const AGREEMENT_DISCLAIMER = LICENSING_DISCLAIMER;
