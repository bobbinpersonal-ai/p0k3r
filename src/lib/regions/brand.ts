import {
  ALL_CITIES,
  ALL_COUNTIES,
  ALL_MARKETS,
  REGIONS,
  RURAL_MARKETS,
} from "@/lib/regions/states";

// Who the company is on the public site, now that lovemeafter.com is a
// multi-state contractor-partner network rather than a single-state
// direct-to-consumer builder.
//
// Every string here is env-overridable and has a placeholder default, because
// the parts that matter — the phone number, the entity name on the agreements —
// are filings and phone lines that don't exist yet. A placeholder that is
// obviously a placeholder beats a real-looking wrong number on a page a
// homeowner is about to call.
//
// Markets now live in src/lib/regions/states.ts, which carries each state's
// own rules alongside its town list. Nothing here should ever hardcode a
// state again.

export const COMPANY = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME || process.env.NEXT_PUBLIC_TX_COMPANY_NAME || "LoveMeAfter",
  /** The legal entity on the agreements. See docs/regions.md — file this first. */
  legalName: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "LoveMeAfter LLC",
  /**
   * The main line. Caller ID is most of the answer rate on an outbound call, so
   * per-state local numbers belong in NEXT_PUBLIC_STATE_PHONES eventually —
   * one number across five states will always be out-of-area for four of them.
   *
   * Falls back to the existing business line rather than to a 555 placeholder:
   * this number is printed on a live page telling homeowners to ring it, and a
   * wrong area code costs some credibility where a fake number costs every
   * single caller.
   */
  phone:
    process.env.NEXT_PUBLIC_NETWORK_PHONE ||
    process.env.NEXT_PUBLIC_TX_PHONE ||
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ||
    "",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@lovemeafter.com",
  /** Where a cancellation notice can be posted. Required on the contract. */
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
} as const;

/** What the business is, in one line, for metadata and schema.org. */
export const BUSINESS_MODEL =
  "General contractor — free inspections, roofing, siding, fencing, gutters and exterior paint";

export const PHONE_DIGITS = COMPANY.phone.replace(/[^\d+]/g, "");

/**
 * Markets, in the order they're worked.
 *
 * Derived from the region registry rather than listed here, so a state's towns
 * and a state's rules can never drift apart. The footer's service-area list —
 * which is most of the local SEO this site will ever do — reads from this.
 */
export const MARKETS = ALL_MARKETS;

export const STATES = REGIONS;

export { ALL_CITIES, ALL_COUNTIES, RURAL_MARKETS, REGIONS };

/**
 * Claims the site makes about the company.
 *
 * Deliberately thin. "1,400 roofs completed" and "family-run nine years" were
 * here as placeholders and have been removed rather than shipped: they are
 * factual assertions about a business, a homeowner reads them as true, and
 * inventing them is both a lie and an FTC problem. Put them back when they
 * are true, as numbers you can evidence.
 *
 * What is left is a term the owner controls rather than a history they would
 * have to have. It is still a promise — a workmanship warranty stated on a
 * website is one a customer may hold you to — so set it to what you will
 * actually honour.
 */
export const PROOF = {
  /**
   * The minimum workmanship warranty a partner must offer to be in the
   * network. Under the referral model this is not our warranty to give — it is
   * a standard we hold partners to and check before we send them anyone.
   */
  workmanshipWarrantyYears: Number(
    process.env.NEXT_PUBLIC_MIN_WARRANTY_YEARS ?? process.env.NEXT_PUBLIC_TX_WARRANTY_YEARS ?? 10,
  ),
} as const;

/**
 * The scrolling strip under the nav.
 *
 * Deliberately longer and more specific than the seven trades: a homeowner
 * scanning a header is looking for their own job, and "roofing" does not catch
 * somebody whose soffit is rotting. The list is what we actually do, said the
 * way a customer would say it.
 */
export const WHAT_WE_DO = [
  "Free roof inspections",
  "Roof replacement",
  "Storm & hail damage",
  "Siding",
  "Fencing",
  "Gutters",
  "Exterior paint",
  "Soffit & fascia",
  "Windows",
  "Vetted local contractors",
  "No obligation",
  "Five states",
] as const;

/**
 * Financing, which is half of residential construction.
 *
 * Off until a lender is actually signed. A payment figure on a website is a
 * promise about credit we cannot keep on somebody else's behalf, and naming a
 * partner we have no agreement with is worse — so this shows nothing until
 * NEXT_PUBLIC_FINANCING_PARTNER is set. See docs/regions.md for who to
 * sign with.
 */
export const FINANCING_PARTNER = process.env.NEXT_PUBLIC_FINANCING_PARTNER || process.env.NEXT_PUBLIC_TX_FINANCING_PARTNER || "";
export const FINANCING_ENABLED = Boolean(FINANCING_PARTNER);

/**
 * The consent sentence under the form button.
 *
 * The most legally important text on the site: it is what turns somebody who
 * filled in a form into somebody we may lawfully call and text. Exported as a
 * constant and stored verbatim with every lead, because the defence to a TCPA
 * claim is producing the exact wording the person actually saw, and a sentence
 * that lives only in JSX cannot be produced two years later.
 */
export const CONTACT_CONSENT_TEXT =
  `By submitting, I agree that ${COMPANY.name} and the crews working with us may call and text ` +
  `me at the number provided, including by automated means, about my project. Consent is not a ` +
  `condition of purchase. Message and data rates may apply. Reply STOP to opt out.`;

/**
 * Version the wording so a later edit doesn't retroactively rewrite old records.
 *
 * A homeowner who consented to one wording did not consent to a different set
 * of callers, and the whole point of storing the sentence verbatim is that it
 * means what it said on the day.
 */
export const CONSENT_VERSION = "2026-09-17-gc";
