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
   * A local Texas number, not the California one. Caller ID is most of the
   * answer rate on a cold call, and a 786 area code ringing a Plano landline
   * gets picked up about as often as a blocked number.
   */
  phone: process.env.NEXT_PUBLIC_TX_PHONE || "(214) 555-0148",
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

/** Numbers on the trust strip. Replace with real ones before launch. */
export const PROOF = {
  roofsCompleted: "1,400+",
  workmanshipWarrantyYears: 10,
  yearsInBusiness: 9,
} as const;

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
