// The three businesses this one company runs.
//
// LoveMeAfter started as a moving company and the code still shows it: a
// Booking has a moveSize and a vehicle tier because for a long time every job
// was a move. Landscaping is now the main line — it's what lovemeafter.com
// sells on its front page — with moving and junk removal kept as their own
// landing pages feeding the same crew, the same dispatch board, and the same
// notifications.
//
// Every Booking carries one of these. It decides which fields on the row are
// meaningful (a lawn has a yardSize and no vehicle tier; a move has a moveSize
// and a route), which flow created it, and how dispatch and the customer
// emails talk about it.
//
// Values are plain strings stored on Booking.serviceLine — see the comment in
// schema.prisma about native enums.

export type ServiceLine = {
  value: string;
  /** How dispatch and the admin board name it. */
  label: string;
  /** How a customer email or text names it, mid-sentence. */
  noun: string;
  /** Where someone books this. */
  bookPath: string;
};

export const SERVICE_LINES = [
  {
    value: "LANDSCAPING",
    label: "Yard",
    noun: "yard service",
    bookPath: "/yard",
  },
  {
    value: "MOVING",
    label: "Move",
    noun: "move",
    bookPath: "/book",
  },
  {
    value: "JUNK",
    label: "Junk",
    noun: "junk removal",
    bookPath: "/book?job=JUNK_REMOVAL",
  },
] as const satisfies readonly ServiceLine[];

export type ServiceLineValue = (typeof SERVICE_LINES)[number]["value"];

/**
 * What a row with no serviceLine means.
 *
 * Every booking taken before the landscaping pivot was a move, so rows written
 * by the old code read back as moves rather than as a missing value. New rows
 * always set it explicitly.
 */
export const DEFAULT_SERVICE_LINE: ServiceLineValue = "MOVING";

export function isServiceLineValue(value: string): value is ServiceLineValue {
  return SERVICE_LINES.some((line) => line.value === value);
}

export function getServiceLine(value: string | null | undefined): ServiceLine {
  const match = value ? SERVICE_LINES.find((line) => line.value === value) : undefined;
  return match ?? SERVICE_LINES.find((line) => line.value === DEFAULT_SERVICE_LINE)!;
}

export function getServiceLineLabel(value: string | null | undefined): string {
  return getServiceLine(value).label;
}

/** True for the jobs priced by yard size rather than by move size and miles. */
export function isLandscaping(value: string | null | undefined): boolean {
  return value === "LANDSCAPING";
}
