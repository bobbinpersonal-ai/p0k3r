// How a deposit gets paid while we're standing there.
//
// Not a payment processor. There's no merchant account behind this and no
// card is touched: these are the three ways money actually moves on a
// doorstep — a Venmo transfer, an Apple Cash message, or notes in a hand —
// and all this module does is build the link that opens the right app with
// the amount already in it, so the customer taps twice instead of typing.
//
// That has a real consequence worth being clear about: a person-to-person
// transfer isn't a card payment. There's no chargeback protection, no
// automatic receipt from a processor, and nothing reconciles itself. Our
// record that a deposit was taken is the booking row the rep marks, which is
// why the confirmation we send the customer states the amount — it's the
// receipt. Moving to real card payments (and merchant Apple Pay, which needs
// a processor) is a Stripe integration, not a change here.

import { pickVersion } from "@/lib/qr";

const VENMO_HANDLE = (
  process.env.NEXT_PUBLIC_VENMO_HANDLE || "LOVEMEAFTER-Improvements"
).replace(/^@/, "");
// Deliberately not the support number. Apple Cash lands in a personal
// Messages thread, which is a different inbox from the one customers call,
// and pointing both at one number means a payment arrives in the middle of
// a booking conversation and gets missed.
const APPLE_CASH_PHONE =
  process.env.NEXT_PUBLIC_APPLE_CASH_PHONE || "(786) 400-7012";

/**
 * A phone number as a dialable target.
 *
 * Normalised to E.164 rather than left as the ten digits people write down:
 * a bare 10-digit number in an sms: link is resolved against the handset's
 * own country, which is right until someone scans it on a phone that isn't
 * on a US plan and Messages addresses a stranger.
 */
function dial(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (phone.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits;
}

export type PaymentMethodValue = "VENMO" | "APPLE_PAY" | "CASH" | "NONE";

export type PaymentMethod = {
  value: PaymentMethodValue;
  /** On the button the rep taps. */
  label: string;
  /** Read out loud to the customer, so it says what they'll actually see. */
  instruction: string;
  /** False for the ones that need no app to open. */
  hasLink: boolean;
};

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    value: "VENMO",
    label: "Venmo",
    instruction: "Scan this and Venmo opens with the amount already filled in.",
    hasLink: true,
  },
  {
    value: "APPLE_PAY",
    label: "Apple Pay",
    instruction:
      "Scan this to open Messages to us, then send it with the Apple Pay button. " +
      "Apple Cash, so it lands instantly.",
    hasLink: true,
  },
  {
    value: "CASH",
    label: "Cash",
    instruction: "Take the cash and mark it here — the confirmation is their receipt.",
    hasLink: false,
  },
  {
    value: "NONE",
    label: "Not yet",
    instruction: "Book it anyway. A dispatcher takes the deposit on the confirmation call.",
    hasLink: false,
  },
];

export function getPaymentMethod(value: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((method) => method.value === value);
}

export function getPaymentMethodLabel(value: string | null | undefined): string {
  if (!value) return "";
  return getPaymentMethod(value)?.label ?? value;
}

export function isPaymentMethodValue(value: string): value is PaymentMethodValue {
  return PAYMENT_METHODS.some((method) => method.value === value);
}

/** Set only when a payment actually moved — "not yet" is not a method. */
export function isPaidMethod(value: string | null | undefined): boolean {
  return value === "VENMO" || value === "APPLE_PAY" || value === "CASH";
}

/**
 * Deliberately terse.
 *
 * The customer reads the recipient and the amount off their own screen a
 * second later anyway, so a long note buys nothing — and it costs, because
 * the whole link has to fit inside a QR code.
 */
const note = (amount: number) => `Deposit%20%24${amount}`;

/**
 * A Venmo link that is guaranteed to be scannable.
 *
 * The ceiling is real and it bites: our encoder tops out at 106 bytes
 * (src/lib/qr.ts), and a handle like "LOVEMEAFTER-Improvements" plus a
 * spelled-out note came to 81 — fine today, but a business renaming its
 * Venmo account is not a thing that should quietly remove the QR from the
 * doorstep screen without anybody noticing.
 *
 * So the link is built richest-first and degrades: full note, then a bare
 * "Deposit", then just the amount, then the profile on its own. The amount
 * is the last thing to go because it is the thing that stops the customer
 * typing the wrong number.
 */
export function venmoLink(amount: number): string | null {
  if (!VENMO_HANDLE) return null;
  const profile = `https://venmo.com/${VENMO_HANDLE}`;
  const candidates = [
    `${profile}?txn=pay&amount=${amount}&note=${note(amount)}`,
    `${profile}?txn=pay&amount=${amount}&note=Deposit`,
    `${profile}?txn=pay&amount=${amount}`,
    profile,
  ];
  return candidates.find((url) => pickVersion(url) !== null) ?? null;
}

/**
 * Messages, addressed to us, with the amount in the draft — from there the
 * customer taps Apple Pay inside the thread. iOS wants `&` before the body
 * where Android wants `?`; the person paying this way is on an iPhone by
 * definition.
 */
export function appleCashLink(amount: number): string | null {
  if (!APPLE_CASH_PHONE) return null;
  return `sms:${dial(APPLE_CASH_PHONE)}&body=${note(amount)}`;
}

export function paymentLink(method: PaymentMethodValue, amount: number): string | null {
  if (method === "VENMO") return venmoLink(amount);
  if (method === "APPLE_PAY") return appleCashLink(amount);
  return null;
}

/** What to tell the customer to send to, when the QR won't do. */
export function paymentTarget(method: PaymentMethodValue): string | null {
  if (method === "VENMO") return VENMO_HANDLE ? `@${VENMO_HANDLE}` : null;
  if (method === "APPLE_PAY") return APPLE_CASH_PHONE || null;
  return null;
}
