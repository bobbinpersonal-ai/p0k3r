// How an applicant/driver wants to receive same-day payouts (see the
// "paid out by 5pm" promise on /drive). Plain strings rather than a native
// Postgres enum — see the comment in schema.prisma.

export const PAYOUT_METHODS = [
  {
    value: "ZELLE",
    label: "Zelle",
    placeholder: "Phone number or email linked to Zelle",
  },
  {
    value: "VENMO",
    label: "Venmo",
    placeholder: "Venmo username (e.g. @yourname)",
  },
  {
    value: "APPLE_PAY",
    label: "Apple Pay",
    placeholder: "Phone number or email linked to Apple Pay",
  },
] as const;

export type PayoutMethodValue = (typeof PAYOUT_METHODS)[number]["value"];

export function isPayoutMethodValue(value: string): value is PayoutMethodValue {
  return (PAYOUT_METHODS as readonly { value: string }[]).some((p) => p.value === value);
}

export function getPayoutMethodLabel(value: string): string {
  return PAYOUT_METHODS.find((p) => p.value === value)?.label ?? value;
}

export function getPayoutMethodPlaceholder(value: string): string {
  return PAYOUT_METHODS.find((p) => p.value === value)?.placeholder ?? "";
}
