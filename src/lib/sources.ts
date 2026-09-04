// Recruiting channels for driver applications, tracked via /drive?source=<value>.
// Add a channel here when you start a new one (a different Craigslist repost,
// a flyer, etc.) — unrecognized values are dropped rather than stored, so a
// stray query param can't pollute the data.

export const SOURCES = [
  { value: "qr-card", label: "QR card" },
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
