// Every automated message the app sends, in one file: the dispatcher's "a
// lead just came in" alert, the customer's booking receipt and status
// updates, and the driver's job-assigned text. Every provider is optional
// and independent — set email vars, SMS vars, both, or neither, per
// recipient. Nothing below throws — whatever triggered a message (a booking
// saved, a status changed) has already happened by the time this runs, and a
// notification failing is never a reason to fail that.
//
// Plain fetch against each provider's REST API rather than an SDK, same
// approach the geocoding ladder (serviceAreaPlaces.ts) takes for the same
// reason: one dependency-free file, easy to read end to end.
//
// One real constraint worth knowing: Resend's shared sandbox sender
// (onboarding@resend.dev) only delivers to the address that owns the Resend
// account. That's fine for notifyOwner* below — the owner IS that account —
// but it means customer- and driver-facing email silently goes nowhere until
// NOTIFY_FROM_EMAIL points at a verified domain. SMS has no such limit, so
// it's the channel that actually works out of the box for anyone who isn't
// the account owner.

import type { Booking, ContractorLead, Driver, DriverApplication } from "@prisma/client";
import { getCity } from "./cities";
import { getServiceTypeLabel } from "./serviceTypes";
import { getApplicantRoleLabel } from "./applicantRoles";
import { getServiceLine, isLandscaping } from "./serviceLines";
import { bookedServiceLabel, getFrequency, getYardSizeLabel } from "./landscaping";
import { MATCH_COUNT, requestedTradeLabel } from "./majorTrades";
import { balanceAfter } from "./deposit";
import { getPaymentMethodLabel, isPaidMethod } from "./payments";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "LoveMeAfter";
const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";
/** A Google Business (or similar) review link. Unset until the owner has one to give out. */
const REVIEW_URL = process.env.REVIEW_URL || "";

type Message = { subject: string; lines: string[] };

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * How a message should talk about this job: "your move", "your yard service".
 *
 * One company, three businesses (see serviceLines.ts), so every automated
 * message has to know which one it's about. A yard customer told their "move"
 * is confirmed will assume they got someone else's text.
 */
function jobNoun(booking: Pick<Booking, "serviceLine">): string {
  return getServiceLine(booking.serviceLine).noun;
}

/**
 * Flat landscaping pricing stores the same number at both ends of the range
 * (see the bookings API), so a range would read as "$70–$70".
 */
function priceLine(booking: Pick<Booking, "estimateLow" | "estimateHigh">): string {
  return booking.estimateLow === booking.estimateHigh
    ? `$${booking.estimateLow}`
    : `$${booking.estimateLow}–$${booking.estimateHigh}`;
}

/**
 * The money, once a deposit has been taken.
 *
 * This is the receipt. A doorstep deposit moves person-to-person — no
 * processor sends anything afterwards — so the confirmation we send is the
 * only written record the customer gets that they paid us, and it has to say
 * the amount, how it was paid, and what is left. Null when nothing was
 * collected, which is every booking made through the website.
 */
function depositLines(booking: Booking): string[] {
  if (!isPaidMethod(booking.depositMethod) || !booking.depositAmount) return [];
  const balance = balanceAfter(booking.estimateHigh, booking.depositAmount);
  return [
    `Deposit received: $${booking.depositAmount} by ${getPaymentMethodLabel(booking.depositMethod)}.`,
    balance > 0
      ? `Balance due when the work is done: $${balance}.`
      : `Nothing further to pay.`,
  ];
}

/**
 * The lines that describe what was actually booked — different for a yard job
 * (one address, a service, a cadence) and a move (two addresses, a size).
 */
function jobLines(booking: Booking): string[] {
  if (isLandscaping(booking.serviceLine)) {
    const cadence = booking.frequency ? getFrequency(booking.frequency) : undefined;
    return [
      `${bookedServiceLabel(booking)} · ${getYardSizeLabel(
        booking.yardSize,
      )} yard`,
      `At: ${booking.pickupAddress}`,
      cadence && cadence.visitsPerMonth !== null ? `Repeats: ${cadence.label}` : null,
    ].filter((line): line is string => Boolean(line));
  }
  return [
    booking.serviceType ? getServiceTypeLabel(booking.serviceType) : null,
    `Pickup: ${booking.pickupAddress}`,
    booking.dropoffAddress ? `Drop-off: ${booking.dropoffAddress}` : null,
  ].filter((line): line is string => Boolean(line));
}

async function sendEmail(to: string, { subject, lines }: Message): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL || "LoveMeAfter <onboarding@resend.dev>",
        to,
        subject,
        text: lines.join("\n"),
      }),
    });
  } catch {
    // Fail open — see file header.
  }
}

async function sendSms(to: string, { subject, lines }: Message): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !to) return;
  try {
    await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        // Twilio's REST API takes Basic Auth over the account SID/token pair
        // rather than a bearer token.
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        // SMS has no subject line, so it's just the first line of the text.
        Body: [subject, ...lines].join("\n"),
      }),
    });
  } catch {
    // Fail open — see file header.
  }
}

async function notifyOwner(message: Message): Promise<void> {
  await Promise.all([
    sendEmail(process.env.NOTIFY_EMAIL || "", message),
    sendSms(process.env.NOTIFY_PHONE || "", message),
  ]);
}

async function notifyCustomer(
  booking: Pick<Booking, "customerEmail" | "customerPhone">,
  message: Message,
): Promise<void> {
  await Promise.all([
    sendEmail(booking.customerEmail || "", message),
    sendSms(booking.customerPhone, message),
  ]);
}

// ---------------------------------------------------------------------------
// To the owner/dispatcher: a new lead, or a customer acting on their own.
// ---------------------------------------------------------------------------

export async function notifyNewBooking(booking: Booking): Promise<void> {
  const city = booking.city ? getCity(booking.city)?.name : null;
  const line = getServiceLine(booking.serviceLine);

  await notifyOwner({
    // The line goes in the subject so a phone lock screen answers "what kind of
    // job?" without opening anything — which is the difference between a lead
    // called back in five minutes and one called back in an hour.
    subject: `New ${line.label.toLowerCase()} lead — ${booking.customerName} — ${priceLine(booking)}`,
    lines: [
      `${booking.customerName} — ${booking.customerPhone}`,
      `${priceLine(booking)} · ${formatDate(booking.moveDate)}, ${booking.timeWindow}`,
      ...jobLines(booking),
      city ? `City: ${city}` : null,
      ...depositLines(booking),
      // The yard flow promises a call inside 30 minutes and a deposit. Repeat
      // it here so the person who has to keep that promise sees it — unless
      // the deposit is already in, in which case there is nothing to chase.
      isLandscaping(booking.serviceLine) && !isPaidMethod(booking.depositMethod)
        ? "→ Call within 30 min to confirm and take the deposit."
        : null,
    ].filter((line): line is string => Boolean(line)),
  });
}

export async function notifyNewApplication(application: DriverApplication): Promise<void> {
  const city = application.city ? getCity(application.city)?.name : null;
  // The API always sets a role before creating the row; the schema only
  // allows null because a handful of pre-role-selector applicants predate it.
  const role = application.role ? getApplicantRoleLabel(application.role) : "Applicant";

  // Which crew they applied to join, so the subject line answers "do I need
  // this person this week?" without opening anything. Null on applicants from
  // before the two recruiting pages were split — they came through one
  // combined page and genuinely didn't say, so this says nothing rather than
  // picking one and being wrong half the time.
  const crew =
    application.line === "LANDSCAPING"
      ? { short: "yard", long: "Yard" }
      : application.line === "MOVING"
        ? { short: "moving", long: "Moving & hauling" }
        : null;

  await notifyOwner({
    subject: `New ${crew ? `${crew.short} ` : ""}${role.toLowerCase()} application — ${application.name}`,
    lines: [
      `${application.name} — ${application.phone}`,
      crew ? `Crew: ${crew.long}` : null,
      `Applying as: ${role}${application.vehicle ? ` (${application.vehicle})` : ""}`,
      city ? `City: ${city}` : null,
    ].filter((line): line is string => Boolean(line)),
  });
}

/**
 * A request to be introduced to licensed contractors.
 *
 * Deliberately worded as a referral, not a lead to sell to: the subject says
 * "contractor referral" so it can't be mistaken in a list for a job of ours,
 * and the body carries the ZIP up front because that's what decides which
 * contractors it goes to.
 */
export async function notifyNewContractorLead(lead: ContractorLead): Promise<void> {
  await notifyOwner({
    subject: `Contractor referral — ${requestedTradeLabel(lead)} — ${lead.zip}`,
    lines: [
      `${lead.name} — ${lead.phone}`,
      lead.email ? lead.email : null,
      `Project: ${requestedTradeLabel(lead)}`,
      `ZIP: ${lead.zip}`,
      lead.preferredStart ? `Wants to start: ${lead.preferredStart}` : null,
      lead.details ? `Notes: ${lead.details}` : null,
      `→ Pass to ${MATCH_COUNT} licensed CSLB contractors covering ${lead.zip}. We do not quote or perform this work.`,
    ].filter((line): line is string => Boolean(line)),
  });
}

export async function notifyOwnerBookingCanceled(booking: Booking): Promise<void> {
  await notifyOwner({
    subject: `${getServiceLine(booking.serviceLine).label} booking canceled online — ${booking.customerName}`,
    lines: [
      `${booking.customerName} — ${booking.customerPhone}`,
      `They canceled their own booking for ${formatDate(booking.moveDate)}, ${booking.timeWindow} online.`,
    ],
  });
}

export async function notifyOwnerRescheduleRequested(booking: Booking, note: string): Promise<void> {
  await notifyOwner({
    subject: `Reschedule requested — ${booking.customerName}`,
    lines: [
      `${booking.customerName} — ${booking.customerPhone}`,
      `Currently booked for ${formatDate(booking.moveDate)}, ${booking.timeWindow}.`,
      `Their request: ${note}`,
    ],
  });
}

// ---------------------------------------------------------------------------
// To the customer: what they booked, who's coming, and when.
// ---------------------------------------------------------------------------

export async function notifyCustomerBookingConfirmed(
  booking: Booking,
  manageUrl: string,
  agreementUrl?: string,
): Promise<void> {
  const firstName = booking.customerName.split(" ")[0];
  const yard = isLandscaping(booking.serviceLine);
  const paid = isPaidMethod(booking.depositMethod);
  await notifyCustomer(booking, {
    subject: paid
      ? `${SITE_NAME}: booked and confirmed — ${priceLine(booking)}`
      : `${SITE_NAME}: your ${yard ? "yard visit" : "quote"} — ${priceLine(booking)}`,
    lines: [
      paid
        ? `Thanks, ${firstName} — you're booked.`
        : `Thanks, ${firstName} — we've got your request.`,
      `${priceLine(booking)}${yard ? " per visit" : ""} · ${formatDate(booking.moveDate)}, ${booking.timeWindow}`,
      ...jobLines(booking),
      ...depositLines(booking),
      // Three different promises, and sending the wrong one is worse than
      // sending none: telling someone who just paid on their doorstep that
      // we'll be calling for a deposit reads as though we lost it.
      paid
        ? `You're on the schedule. A dispatcher calls before the visit to confirm the crew.`
        : yard
          ? `We'll call you within 30 minutes to confirm and take a deposit to get you on the schedule. Nothing has been charged yet, and the price above is the price.`
          : `A dispatcher will call or text to confirm your crew and lock in the final price — nothing's charged yet.`,
      // A doorstep sale has to hand the buyer their agreement and their
      // cancellation rights in writing (see src/lib/agreement.ts), and this
      // message is how that reaches them. It leads the tail of the message
      // rather than trailing it, because it is the part with a deadline.
      agreementUrl
        ? `Your agreement, and your right to cancel within three business days: ${agreementUrl}`
        : null,
      `Need to reschedule or cancel? ${manageUrl}`,
    ].filter((line): line is string => Boolean(line)),
  });
}

export async function notifyCustomerCrewConfirmed(
  booking: Booking & { driver: Driver | null },
): Promise<void> {
  if (!booking.driver) return;
  await notifyCustomer(booking, {
    subject: `${SITE_NAME}: your crew is confirmed`,
    lines: [
      `${booking.driver.name} is confirmed for your ${jobNoun(booking)} — ${formatDate(booking.moveDate)}, ${booking.timeWindow}.`,
      booking.driver.vehicle ? `Vehicle: ${booking.driver.vehicle}` : null,
      SUPPORT_PHONE ? `Questions before then? Call or text ${SUPPORT_PHONE}.` : null,
    ].filter((line): line is string => Boolean(line)),
  });
}

export async function notifyCustomerReminder(booking: Booking, manageUrl: string): Promise<void> {
  const noun = jobNoun(booking);
  await notifyCustomer(booking, {
    subject: `${SITE_NAME}: your ${noun} is tomorrow`,
    lines: [
      `Reminder: your ${noun} is tomorrow, ${booking.timeWindow}.`,
      isLandscaping(booking.serviceLine)
        ? `At: ${booking.pickupAddress}`
        : `Pickup: ${booking.pickupAddress}`,
      `Need to change anything? ${manageUrl}`,
    ],
  });
}

export async function notifyCustomerReviewRequest(booking: Booking): Promise<void> {
  const firstName = booking.customerName.split(" ")[0];
  await notifyCustomer(booking, {
    subject: `${SITE_NAME}: thanks for booking with us`,
    lines: [
      isLandscaping(booking.serviceLine)
        ? `Thanks for choosing ${SITE_NAME}, ${firstName} — hope the yard's looking better.`
        : `Thanks for choosing ${SITE_NAME}, ${firstName} — hope the move went smoothly.`,
      REVIEW_URL ? `Got a minute? A review helps a lot: ${REVIEW_URL}` : null,
    ].filter((line): line is string => Boolean(line)),
  });
}

// ---------------------------------------------------------------------------
// To the driver: a job just landed on their board.
// ---------------------------------------------------------------------------

export async function notifyDriverAssigned(booking: Booking & { driver: Driver | null }): Promise<void> {
  // Drivers only ever get SMS — the roster has phone numbers, not emails
  // (see the Driver model), and a job alert is exactly the kind of thing
  // that wants a buzz in the pocket, not an inbox to check later.
  if (!booking.driver) return;
  await sendSms(booking.driver.phone, {
    // Which line it is, up front: a yard job and a move need different kit in
    // the truck, and that decision gets made from this text.
    subject: `${SITE_NAME}: new ${getServiceLine(booking.serviceLine).label.toLowerCase()} job assigned`,
    lines: [
      `${booking.customerName} — ${booking.customerPhone}`,
      `${formatDate(booking.moveDate)}, ${booking.timeWindow}`,
      ...jobLines(booking),
    ],
  });
}
