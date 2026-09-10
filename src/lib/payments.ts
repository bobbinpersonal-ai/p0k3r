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

const VENMO_HANDLE = (process.env.NEXT_PUBLIC_VENMO_HANDLE || "").replace(/^@/, "");
const APPLE_CASH_PHONE =
  process.env.NEXT_PUBLIC_APPLE_CASH_PHONE || process.env.NEXT_PUBLIC_SUPPORT_PHONE || "";

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
 * The whole link has to fit in a version-4 QR — 78 bytes — and the customer
 * is going to read the recipient and the amount on their own screen a second
 * later anyway. A longer note buys nothing and costs the code its legibility.
 */
const note = (amount: number) => `Deposit%20%24${amount}`;

export function venmoLink(amount: number): string | null {
  if (!VENMO_HANDLE) return null;
  return `https://venmo.com/${VENMO_HANDLE}?txn=pay&amount=${amount}&note=${note(amount)}`;
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
