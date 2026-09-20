// Who may be dialled, and who may be texted.
//
// This is the gate that sits in front of the GoHighLevel dialer queue and
// every outbound SMS campaign. It exists because the difference between a
// power dialer that scales a business and a power dialer that ends one is
// entirely a question of who is in the queue.
//
// THE NUMBERS THAT MAKE THIS WORTH GETTING RIGHT. The TCPA carries $500 per
// call or text, trebled to $1,500 for a knowing or wilful violation, with no
// statutory cap and an active plaintiffs' bar that buys lists of defendants.
// A 5,000-record aged list texted without consent is a $2.5m–$7.5m exposure
// on its own. There is no version of that which is worth the extra bookings.
//
// So the rules here are deliberately conservative and are expressed as a
// single function the campaign code cannot go around:
//
//   1. An opt-out beats everything, forever, across every channel. It is
//      checked first and it is never overridden by a later "consent".
//   2. Marketing SMS needs PRIOR EXPRESS WRITTEN consent — a record of when
//      and how, not a boolean somebody set. "They were a lead once" is not
//      consent, and neither is a purchased list.
//   3. Marketing calls to a consumer need consent or an existing business
//      relationship inside its window. The EBR is 18 months from a
//      transaction and 3 months from an enquiry.
//   4. A partner's customer is gated separately by the warm-up system — see
//      src/lib/regions/warmup.ts. Consent here does NOT bypass that.
//   5. Email is a different regime (CAN-SPAM): no prior consent needed, just
//      honest headers, a real address and a working unsubscribe. That is why
//      the re-engagement sequence leads with email.
//
// None of this blocks calling a BUSINESS on its business line for a business
// purpose — that is the partner-recruiting side and it sits outside the
// National DNC Registry and most of the TSR. See partnerProspects.ts.

/** How consent was obtained. Stored so the record is evidence, not a flag. */
export type ConsentSource =
  | "WEB_FORM"           // they typed their number into our form
  | "INBOUND_CALL"       // they rang us
  | "WRITTEN_AGREEMENT"  // signed paperwork with the clause in it
  | "VERBAL_ON_CALL"     // an agent recorded it mid-call
  | "PARTNER_WARM_INTRO" // came through the warm-up flow
  | "IMPORTED";          // asserted by whoever uploaded a list — weakest

/**
 * Sources we will not treat as consent for marketing SMS.
 *
 * IMPORTED is on this list and that is the whole point of the list. Somebody
 * uploading a CSV can tick any box they like; the FCC does not accept the
 * uploader's word as the subscriber's consent.
 */
const NOT_VALID_FOR_SMS: readonly ConsentSource[] = ["IMPORTED"];

/** An existing business relationship: 18 months from a sale. */
export const EBR_TRANSACTION_MONTHS = 18;
/** An existing business relationship: 3 months from an enquiry. */
export const EBR_ENQUIRY_MONTHS = 3;

export type ContactState = {
  optedOutAt?: Date | null;
  smsConsentAt?: Date | null;
  smsConsentSource?: string | null;
  callConsentAt?: Date | null;
  callConsentSource?: string | null;
  /** When they last bought something, for the EBR window. */
  lastTransactionAt?: Date | null;
  /** When they last asked us something, for the EBR window. */
  lastEnquiryAt?: Date | null;
};

export type Eligibility = {
  allowed: boolean;
  /** Why not, in words an operator can act on. Null when allowed. */
  reason: string | null;
  /** What would make it allowed, for the admin screen. */
  remedy: string | null;
};

const ALLOWED: Eligibility = { allowed: true, reason: null, remedy: null };

function monthsAgo(n: number, now: Date): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() - n);
  return d;
}

/**
 * May we send this person a marketing text?
 *
 * Deliberately strict. An SMS campaign is the single easiest way to generate
 * thousands of identical violations in an afternoon.
 */
export function maySms(contact: ContactState, now: Date = new Date()): Eligibility {
  if (contact.optedOutAt) {
    return {
      allowed: false,
      reason: "They opted out. That is permanent and applies to every channel.",
      remedy: null,
    };
  }
  if (!contact.smsConsentAt) {
    return {
      allowed: false,
      reason: "No record of prior express written consent to text this number.",
      remedy: "Call them manually, or email them and let a reply create the consent.",
    };
  }
  const source = (contact.smsConsentSource ?? "") as ConsentSource;
  if (NOT_VALID_FOR_SMS.includes(source)) {
    return {
      allowed: false,
      reason: `Consent recorded as "${source}", which is the uploader's assertion rather than the subscriber's.`,
      remedy: "Email or manual dial until they give consent themselves.",
    };
  }
  void now;
  return ALLOWED;
}

/**
 * May this number go into an outbound dialer queue?
 *
 * Consent, or an existing business relationship inside its window. Note this
 * answers "may it be dialled at all" — the curfew, attempt caps and DNC
 * scrubbing in src/lib/regions/calling.ts still apply on top, and the
 * warm-up gate applies on top of that for a partner's customer.
 */
export function mayDialConsumer(contact: ContactState, now: Date = new Date()): Eligibility {
  if (contact.optedOutAt) {
    return {
      allowed: false,
      reason: "They asked not to be contacted. Permanent, company-wide.",
      remedy: null,
    };
  }
  if (contact.callConsentAt) return ALLOWED;

  if (contact.lastTransactionAt && contact.lastTransactionAt >= monthsAgo(EBR_TRANSACTION_MONTHS, now)) {
    return ALLOWED;
  }
  if (contact.lastEnquiryAt && contact.lastEnquiryAt >= monthsAgo(EBR_ENQUIRY_MONTHS, now)) {
    return ALLOWED;
  }

  return {
    allowed: false,
    reason:
      "No consent on file and no existing business relationship in date " +
      `(${EBR_TRANSACTION_MONTHS} months from a sale, ${EBR_ENQUIRY_MONTHS} from an enquiry).`,
    remedy: "Email them first. A reply is an enquiry and reopens the window.",
  };
}

/**
 * May we email them?
 *
 * Almost always yes — CAN-SPAM does not require prior consent, it requires
 * honesty and a working unsubscribe. This is why an aged-list re-engagement
 * sequence should lead with email and let replies promote people into the
 * dialer queue, rather than texting everybody on day one.
 */
export function mayEmail(contact: ContactState): Eligibility {
  if (contact.optedOutAt) {
    return { allowed: false, reason: "They opted out.", remedy: null };
  }
  return ALLOWED;
}

/** The words an opt-out arrives as, from a carrier or a person. */
const OPT_OUT_WORDS = new Set([
  "stop", "stopall", "unsubscribe", "cancel", "end", "quit", "optout", "opt-out", "remove",
]);

/**
 * Does this inbound message mean "stop"?
 *
 * Carriers handle the standard keywords themselves, but a reply that says
 * "please stop texting me" does not trip them, and honouring it anyway is
 * both required in spirit and the cheapest possible insurance.
 */
export function isOptOut(message: string): boolean {
  const normalised = message.trim().toLowerCase().replace(/[^a-z\s-]/g, "");
  if (OPT_OUT_WORDS.has(normalised.replace(/\s+/g, ""))) return true;
  return /\b(stop|unsubscribe|remove me|do not (call|text|contact)|don'?t (call|text|contact))\b/.test(
    normalised,
  );
}
