// What happened on the last dial.
//
// A different axis to Lead.status. status is where the JOB has got to —
// assigned, appointment set, sold. This is what the phone did, and a lead can
// be ASSIGNED and VOICEMAIL at the same time without either being wrong.
//
// Strings rather than a Prisma enum, matching the convention stated at the top
// of schema.prisma: adding a value never needs a migration, and the valid set
// is enforced where it is written.

export type Disposition = {
  value: string;
  label: string;
  /** What the desk presses. Short enough to sit on a phone-width button. */
  short: string;
  /** Whether this one leaves the queue. */
  closes: boolean;
  /** How long before it comes back round, in hours. Null when it does not. */
  retryHours: number | null;
};

export const DISPOSITIONS: readonly Disposition[] = [
  { value: "NEW", label: "Not called yet", short: "New", closes: false, retryHours: null },
  { value: "CALLED", label: "Called, no answer", short: "No answer", closes: false, retryHours: 4 },
  { value: "VOICEMAIL", label: "Left a voicemail", short: "Voicemail", closes: false, retryHours: 24 },
  { value: "PITCHED", label: "Pitched — they know what we do", short: "Pitched", closes: true, retryHours: null },
  { value: "DEAD", label: "Not interested, don't call again", short: "Dead", closes: true, retryHours: null },
];

/** What the desk can set. NEW is the starting state, not an outcome. */
export const DESK_ACTIONS = DISPOSITIONS.filter((d) => d.value !== "NEW");

const BY_VALUE = new Map(DISPOSITIONS.map((d) => [d.value, d]));

export function getDisposition(value: string): Disposition | undefined {
  return BY_VALUE.get(value);
}

export function isDisposition(value: string): boolean {
  return BY_VALUE.has(value);
}

/** The ones a lead has to be on to still be worth dialling. */
export const OPEN_DISPOSITIONS = DISPOSITIONS.filter((d) => !d.closes).map((d) => d.value);
