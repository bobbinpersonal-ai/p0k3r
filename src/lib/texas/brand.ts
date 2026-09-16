// Who the company is on the public site, now that lovemeafter.com is the
// Texas construction business rather than the California yard one.
//
// Every string here is env-overridable and has a placeholder default, because
// the parts that matter — the local Texas phone number, the entity name on the
// contracts — are filings and phone lines that don't exist yet. A placeholder
// that is obviously a placeholder beats a real-looking wrong number on a page
// a homeowner is about to call.

export const COMPANY = {
  name: process.env.NEXT_PUBLIC_TX_COMPANY_NAME || "LoveMeAfter",
  /** The legal entity on the contracts. See docs/texas.md — file this first. */
  legalName: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "LoveMeAfter LLC",
  /**
   * A local Texas number, ideally. Caller ID is most of the answer rate on a
   * cold call, and an out-of-state area code ringing a Plano landline gets
   * picked up about as often as a blocked number.
   *
   * Falls back to the existing business line rather than to a 555 placeholder:
   * this number is printed on a live page telling homeowners to ring it, and a
   * wrong area code costs some credibility where a fake number costs every
   * single caller. Set NEXT_PUBLIC_TX_PHONE to a real Texas number.
   */
  phone: process.env.NEXT_PUBLIC_TX_PHONE || process.env.NEXT_PUBLIC_SUPPORT_PHONE || "",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "hello@lovemeafter.com",
  /** Where a cancellation notice can be posted. Required on the contract. */
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
} as const;

export const PHONE_DIGITS = COMPANY.phone.replace(/[^\d+]/g, "");

/**
 * Markets, in the order they're worked.
 *
 * Used for the footer's service-area list (which is most of the local SEO this
 * site will ever do) and for picking which Twilio number dials out.
 */
export const MARKETS = [
  { slug: "dfw", name: "Dallas–Fort Worth", cities: ["Dallas", "Plano", "Frisco", "Arlington", "Irving", "McKinney", "Denton", "Fort Worth"] },
  { slug: "houston", name: "Houston", cities: ["Houston", "Katy", "Sugar Land", "The Woodlands", "Pearland", "Cypress"] },
  { slug: "austin", name: "Austin", cities: ["Austin", "Round Rock", "Cedar Park", "Georgetown", "Pflugerville"] },
  { slug: "san-antonio", name: "San Antonio", cities: ["San Antonio", "New Braunfels", "Schertz", "Boerne"] },
] as const;

export const ALL_CITIES = MARKETS.flatMap((m) => m.cities);

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
  workmanshipWarrantyYears: Number(process.env.NEXT_PUBLIC_TX_WARRANTY_YEARS ?? 10),
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
  "Roof replacement",
  "Storm & hail damage",
  "Siding",
  "Windows",
  "Gutters",
  "Garage doors",
  "Fencing",
  "Exterior paint",
  "Soffit & fascia",
  "Patio covers",
  "Insurance claims",
  "Free inspections",
] as const;

/**
 * Financing, which is half of residential construction.
 *
 * Off until a lender is actually signed. A payment figure on a website is a
 * promise about credit we cannot keep on somebody else's behalf, and naming a
 * partner we have no agreement with is worse — so this shows nothing until
 * NEXT_PUBLIC_TX_FINANCING_PARTNER is set. See docs/texas-launch.md for who to
 * sign with.
 */
export const FINANCING_PARTNER = process.env.NEXT_PUBLIC_TX_FINANCING_PARTNER || "";
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
  `By submitting, I agree that ${COMPANY.name} and its representatives may call and text me ` +
  `at the number provided, including by automated means, about my project. Consent is not a ` +
  `condition of purchase. Message and data rates may apply. Reply STOP to opt out.`;

/** Version the wording so a later edit doesn't retroactively rewrite old records. */
export const CONSENT_VERSION = "2026-09-15";
