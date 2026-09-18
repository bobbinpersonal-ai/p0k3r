import { COMPANY } from "@/lib/regions/brand";
import { SELLER } from "@/lib/regions/contracts";
import { CHANNEL_PARTNER_PROFIT_SHARE } from "@/lib/regions/channelPartners";
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
 * something as "they agreed to THIS text" — and the split and the data terms
 * are both things we might revise.
 *
 * .3 moved the payout from a tenth of the contract price to 40% of the job's
 * gross profit, and added the promise to publish the figures behind it. That
 * is a change to how every partner is paid, so every partner re-accepts.
 */
export const CHANNEL_PARTNER_TERMS_VERSION = "2026-09-18.3";

export function channelPartnerAgreement(facts: {
  businessName: string;
  contactName: string;
  state?: string | null;
}): AgreementDocument {
  const share = `${Math.round(CHANNEL_PARTNER_PROFIT_SHARE * 100)}%`;

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
          `Partner is paid ${share} of that job's gross profit. Gross profit means the price ` +
          `the job sold for, less what the job cost the Company to build, less what the person ` +
          `who measured and sold it earned on it. Nothing else is deducted before the ` +
          `Partner's share is worked out.\n\n` +
          `There is no upper limit and no tiers. A larger or better-sold job pays ` +
          `proportionally more, and a job sold at the Company's book price still pays.\n\n` +
          `So that this is a figure the Partner can check rather than one they have to trust, ` +
          `the Company publishes the whole working on the Partner's own page for every job: ` +
          `what it sold for, what it cost the Company, what the seller earned, what was left, ` +
          `and the Partner's ${share} of it. The Company is showing the Partner its own costs ` +
          `on purpose, and asks that they be kept between us.\n\n` +
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
