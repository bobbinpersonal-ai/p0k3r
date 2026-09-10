// Marketing/recruiting channels, tracked via /drive?source=<value> for driver
// applications and /book?source=<value> for customer bookings — same list
// either way, since a channel like Craigslist runs both kinds of posts. Add
// one here when you start a new channel (a different Craigslist repost, a
// flyer, etc.) — unrecognized values are dropped rather than stored, so a
// stray query param can't pollute the data.

export const SOURCES = [
  { value: "qr-card", label: "QR card" },
  // Knocked doors, whether we filled the form in on the step (/admin/knock) or
  // they scanned the card we left behind. Same channel either way — what we
  // want to know is whether walking the street pays for the afternoon.
  { value: "door-knock", label: "Door knock" },
  { value: "craigslist", label: "Craigslist" },
  { value: "referral", label: "Referral" },
] as const;

export type SourceValue = (typeof SOURCES)[number]["value"];

export function isSourceValue(value: string): value is SourceValue {
  return (SOURCES as readonly { value: string }[]).some((s) => s.value === value);
}

export function getSourceLabel(value: string): string {
  return SOURCES.find((s) => s.value === value)?.label ?? value;
}
