// The list-partner program: a home service business hands over its existing
// customer list instead of doing any labor, and gets paid a flat fee every
// time a job sells off it.
//
// This is a different shape from the crew partners in src/lib/regions/states.ts
// or the appointment-referral contractors in referralAgreement.ts. Both of
// those get paid for work — a labor rate or a percentage of a job they
// closed. A channel partner does neither. What they're actually selling is
// the trust their own customers already have in them, which is why the call
// works as "a service check-in from {Partner}" rather than a cold call.
//
// That framing is also the compliance question that matters here: riding a
// partner's own established relationship with their customer is the reason
// this kind of call is safer than a cold list, but it only works if the call
// is truthful about who's calling and why, and if the partner actually had
// the right to hand that list over in the first place. See docs/regions.md.

/** The flat fee, in cents, paid per job that closes off a partner's list. */
export const CHANNEL_PARTNER_FEE_CENTS = 200_000;

export function formatFee(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

/**
 * Hosts we accept a shared customer list from.
 *
 * A allowlist rather than "any https URL" because this field is pasted by
 * someone who was cold-called an hour ago and is about to be asked to share
 * their customers. A typo'd or hostile link sitting in our admin waiting for
 * somebody to click it is a phishing vector aimed at us, and the set of
 * places a real list actually lives is small enough to name.
 */
const LIST_HOSTS = [
  "docs.google.com",
  "drive.google.com",
  "sheets.google.com",
  "dropbox.com",
  "www.dropbox.com",
  "onedrive.live.com",
  "1drv.ms",
  "box.com",
  "app.box.com",
] as const;

export type ListUrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * Validate a pasted list link.
 *
 * Returns the normalised URL rather than a boolean so the caller stores what
 * was actually parsed — a link with a stray space or a missing scheme is the
 * normal case here, not the exception.
 */
export function checkListUrl(raw: string): ListUrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "Paste the link to your list." };

  // Somebody copying out of a browser bar often loses the scheme. Adding it
  // is the difference between "that link doesn't work" and it just working.
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    return { ok: false, reason: "That doesn't look like a link. Paste the whole thing." };
  }

  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "The link needs to start with https." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!LIST_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    return {
      ok: false,
      reason:
        "We take a Google Sheets, Drive, Dropbox, OneDrive or Box link. If yours lives " +
        "somewhere else, call us and we'll sort it out.",
    };
  }

  return { ok: true, url: parsed.toString() };
}
