import { COMPANY } from "@/lib/regions/brand";
import { SELLER } from "@/lib/regions/contracts";
import {
  CHANNEL_PARTNER_GROSS_PROFIT_CLAMP,
  CHANNEL_PARTNER_TOP_LINE_RATE,
} from "@/lib/regions/channelPartners";
import type { AgreementDocument } from "@/lib/regions/repAgreement";

// The terms a channel partner clicks through before their portal opens.
//
// Written because the alternative was gating the portal on a checkbox that
// referenced nothing. It is short on purpose: this is a click-wrap a business
// owner reads on a phone, and a twelve-page document nobody reads is worse
// protection than a one-page document they do.
//
// NOT REVIEWED BY A LAWYER. Two things in here are genuinely unsettled and
// are flagged in `warnings` rather than buried: whether a payment contingent
// on a construction contract closing is a regulated referral fee in some of
// these states, and what the partner's own obligations are for handing over
// customer contact details they collected for a different purpose.

/**
 * Bumped whenever the text below changes in a way that matters.
 *
 * Stored on the partner at acceptance, because "they agreed" only means
 * something as "they agreed to THIS text" — and the split, the cap and the
 * data terms are all things we might revise.
 */
export const CHANNEL_PARTNER_TERMS_VERSION = "2026-09-18.2";

export function channelPartnerAgreement(facts: {
  businessName: string;
  contactName: string;
  state?: string | null;
}): AgreementDocument {
  const rate = `${Math.round(CHANNEL_PARTNER_TOP_LINE_RATE * 100)}%`;
  const clamp = `${Math.round(CHANNEL_PARTNER_GROSS_PROFIT_CLAMP * 100)}%`;

  return {
    title: `Channel Partner Agreement — ${COMPANY.name}`,
    warnings: [
      "This is a plain-language agreement, not legal advice, and it has not been reviewed " +
        "by a lawyer for either side. Both of us should have one look at it before there is " +
        "real money moving.",
      "Some states regulate payments made for referring construction work. If that turns " +
        "out to apply here, this arrangement changes or ends — it does not quietly continue.",
    ],
    sections: [
      {
        heading: "What each of us does",
        body:
          `${facts.businessName} ("the Partner") shares a list of customers it has already ` +
          `done work for. ${SELLER.name} ("the Company") calls those customers, and where ` +
          `they want home improvement work, the Company quotes it, contracts it, builds it ` +
          `and warrants it.\n\n` +
          `The Partner does none of the work and carries none of the risk on it. The Partner ` +
          `is not the Company's agent, employee or joint venturer, and neither of us can ` +
          `commit the other to anything.`,
      },
      {
        heading: "What the Partner is paid",
        body:
          `On each job the Company completes for a customer from the Partner's list, the ` +
          `Partner is paid ${rate} of the price that job sold for. There is no upper limit: a ` +
          `larger job pays proportionally more.\n\n` +
          `The Partner can check this figure without relying on the Company — it is a ` +
          `percentage of a contract price the customer also knows.\n\n` +
          `One exception. Where a job's gross profit is so small that ${rate} of the contract ` +
          `would exceed it, the Partner is paid ${clamp} of that job's gross profit instead. ` +
          `Where that happens the Company tells the Partner on their own page, with the ` +
          `figures, rather than paying a reduced amount without explanation.\n\n` +
          `Payment is made after the job is finished and the customer has paid the Company in ` +
          `full. Nothing is paid on a signature, a deposit or a promise.`,
      },
      {
        heading: "What the Partner can see",
        body:
          "The Partner gets a page showing every customer from their list that the Company " +
          "has contacted, what stage each one is at, what has been earned and what has been " +
          "paid. Where a job is quoted and does not sell, the Partner is told why in writing.",
      },
      {
        heading: "The customer list",
        body:
          "The Partner shares the list by giving the Company view access to a file the " +
          "Partner controls. The Company reads it and does not take a copy. The Partner can " +
          "withdraw access at any time without notice or explanation, and doing so ends this " +
          "arrangement for any customer not already contacted.\n\n" +
          "The Partner confirms it is entitled to share these details for this purpose. The " +
          "Company will identify itself on every call, will say it is working with the " +
          "Partner, and will not hold itself out as the Partner. Anyone who asks not to be " +
          "contacted goes on the Company's do-not-call list permanently and company-wide.",
      },
      {
        heading: "Excluded trades",
        body:
          "The Company will not quote any trade the Partner asks it to stay away from, and " +
          "the Partner's own trade is excluded by default. Those exclusions are recorded on " +
          "the Partner's account and can be changed by the Partner at any time.",
      },
      {
        heading: "Tax",
        body:
          "The Partner is paid as an independent business. The Company files a 1099-NEC for " +
          "any Partner paid $600 or more in a calendar year and needs a W-9 on file before " +
          "the first payment. No tax is withheld.",
      },
      {
        heading: "Ending it",
        body:
          "Either of us can end this with written notice, at any time, for any reason. " +
          "Anything already earned on a job that completes is still paid. Jobs already sold " +
          "and not yet built are finished and paid for normally.",
      },
    ],
    signatureLines: [
      { label: "Partner", name: facts.contactName },
      { label: "Company", name: SELLER.name },
    ],
  };
}
