// The agreement with a 1099 sales representative.
//
// This document has a second job beyond setting out the deal. It is the first
// thing the Texas Workforce Commission reads if somebody files for unemployment
// and claims they were an employee all along, and a misclassification finding
// is retroactive: back taxes, interest and penalties on every rep, not just the
// one who complained. The TWC applies a direction-and-control test and it looks
// at what actually happened, not at what a contract called it — so a contract
// that promises independence while the company sets hours, mandates a script
// and hands out territory like a shift rota is worse than useless. It is
// evidence.
//
// Which is why the terms below are narrow on purpose. We say what we want
// (a sale, on our paper, at or above base) and stay out of how they get it. If
// the business later wants daily stand-ups and mandatory hours, that is a
// legitimate decision — but it is an employment decision, and this agreement
// should be replaced rather than quietly contradicted.
//
// Not legal advice. The classification analysis and the non-solicitation
// clause in particular want a Texas employment attorney — see
// docs/texas-contracts.md.

import { COMPANY } from "@/lib/texas/brand";
import { DEFAULT_TERMS, type CommissionTerms } from "@/lib/texas/commission";
import { CANCELLATION_BUSINESS_DAYS } from "@/lib/texas/compliance";
import { SELLER, sellerAddress, type ContractSection } from "@/lib/texas/contracts";

export type RepAgreementFacts = {
  repName: string;
  /** Null until they hand one in. No W-9, no payment. */
  w9OnFile: boolean;
  terms?: CommissionTerms;
  /** Where they will be working. Descriptive, not exclusive — see below. */
  markets?: readonly string[];
  effective: Date;
};

export type AgreementDocument = {
  title: string;
  warnings: string[];
  sections: ContractSection[];
  signatureLines: { label: string; name: string | null }[];
};

const pct = (rate: number) => `${Math.round(rate * 1000) / 10}%`;

/**
 * Days after a job is collected before commission is paid.
 *
 * Commission is earned on money we actually received, not on a signature. A
 * rep paid at signing on a job that cancels inside its Ch. 601 window has been
 * paid for nothing, and clawing it back from somebody who has already spent it
 * is how sales organisations end up in small-claims court against their own
 * people. Paying on collection avoids the chargeback rather than managing it.
 */
export const COMMISSION_PAID_DAYS = 7;

export function repAgreement(facts: RepAgreementFacts): AgreementDocument {
  const terms = facts.terms ?? DEFAULT_TERMS;
  const warnings: string[] = [];

  if (terms.baseRate === 0) {
    warnings.push(
      "The base commission rate is 0%, so this agreement offers a rep nothing on the base " +
        "price — only a share of what they sell above it. That is a lawful structure and a " +
        "brutal one, and it is almost certainly not what you meant to offer. Set it in " +
        "src/lib/texas/commission.ts, or per rep on the Rep row, before anyone signs.",
    );
  }
  if (!facts.w9OnFile) {
    warnings.push(
      `No W-9 on file for ${facts.repName}. Nothing may be paid out until there is one — ` +
        "the 1099-NEC at the end of the year cannot be filed without it.",
    );
  }
  if (!SELLER.address) {
    warnings.push(
      "No business address is set, so this agreement names nowhere to send notice.",
    );
  }

  const sections: ContractSection[] = [
    {
      heading: "What this is",
      body:
        `This is an agreement between ${SELLER.name} ("the Company") and ${facts.repName} ` +
        `("the Representative"), an independent contractor. It is not an employment ` +
        `agreement. The Representative is in business for themselves, and nothing here ` +
        `creates a partnership, joint venture, franchise or employment relationship.`,
    },
    {
      heading: "What the Representative does",
      body:
        "The Representative meets homeowners, inspects and measures their property, presents " +
        "prices from the Company's price book, and signs residential construction contracts " +
        "on the Company's forms. The Company does not set the Representative's hours, does " +
        "not require attendance at any meeting, does not require a minimum number of " +
        "appointments, and does not direct the manner or means by which the Representative " +
        "finds or works with a homeowner." +
        (facts.markets?.length
          ? `\n\nThe Representative expects to work in ${facts.markets.join(", ")}. This ` +
            "describes where they intend to sell. It is not an exclusive territory and it " +
            "does not restrict where either party may do business."
          : ""),
    },
    {
      heading: "Independent contractor status",
      body:
        "The Representative supplies their own vehicle, phone, computer, ladder and any " +
        "other equipment, and pays their own costs of doing business including fuel, " +
        "insurance and any licences or registrations they need. The Representative is free " +
        "to work for others, including others in this industry, and to accept or decline any " +
        "lead or appointment.\n\n" +
        "No income tax, Social Security or Medicare is withheld. The Representative is " +
        "responsible for their own self-employment tax and estimated payments. The " +
        "Representative receives no wages, overtime, paid leave, health insurance, " +
        "unemployment insurance or workers' compensation coverage from the Company, and is " +
        "not covered by the Company's workers' compensation if it carries any.",
    },
    {
      heading: "What the Representative is paid",
      body:
        (terms.baseRate > 0
          ? `${pct(terms.baseRate)} of the base price of each job, plus `
          : "No commission is paid on the base price of a job. The Representative earns ") +
        `${pct(terms.overageRate)} of everything sold above that base price.\n\n` +
        "The price book shows the Representative the Company's cost and the base price for " +
        "every line, so they can see exactly what they are selling above. No job may be sold " +
        "below its base price; a job sold below base earns no commission and the Company's " +
        "estimating software will not produce a contract for one.\n\n" +
        `Commission is earned on money the Company has actually collected, and is paid ` +
        `within ${COMMISSION_PAID_DAYS} days of collection. A job that is cancelled, refunded, ` +
        `denied by a carrier or never paid earns no commission, and any commission already ` +
        `advanced on it is deducted from the next payment.`,
    },
    {
      heading: "Rules the Representative must follow",
      body:
        "These are not preferences. Each one is a Texas statute and breaking it exposes the " +
        "Representative personally as well as the Company:\n\n" +
        "• Never offer to pay, rebate, credit, discount or absorb any part of a homeowner's " +
        "insurance deductible, and never say the homeowner will pay nothing out of pocket. " +
        "Business & Commerce Code § 27.02 makes this a criminal offence.\n\n" +
        "• Never negotiate, adjust or advocate a homeowner's insurance claim with their " +
        "carrier, and never describe yourself as doing so. Insurance Code Chapter 4102 " +
        "reserves that to licensed public adjusters and forbids it outright to a contractor " +
        "repairing the same property. Meeting an adjuster on the roof and showing them " +
        "damage is allowed. Arguing the claim is not.\n\n" +
        `• Always hand the homeowner the cancellation notice and both copies of the ` +
        `cancellation form at the time of signing, and never start work or order material ` +
        `inside their ${CANCELLATION_BUSINESS_DAYS} business days unless they ask in ` +
        `writing. The Company's contract generates these automatically; the Representative's ` +
        `job is to physically leave them behind.\n\n` +
        "• Never promise a completion date, a warranty term, a price or a scope that is not " +
        "on the Company's contract.\n\n" +
        "• Never collect payment in the Representative's own name or to their own account. " +
        "All money goes to the Company directly.",
    },
    {
      heading: "No authority to bind",
      body:
        "The Representative may sign the Company's standard contract at the Company's " +
        "published prices. They may not alter it, waive any of its terms, agree a discount " +
        "below base, accept a trade, or make any other commitment on the Company's behalf. " +
        "Anything outside the standard contract needs the Company's written agreement first.",
    },
    {
      heading: "Leads and confidentiality",
      body:
        "Leads the Company assigns, and the price book including the Company's costs and " +
        "base prices, are the Company's confidential information. The Representative may use " +
        "them to sell for the Company and for nothing else, and may not copy, keep or pass " +
        "them to anyone on leaving. Customer contact details obtained through the Company " +
        "belong to the Company.\n\n" +
        "Leads the Representative generates themselves are worked on the same terms and the " +
        "resulting customer is likewise the Company's.",
    },
    {
      heading: "Not soliciting the Company's customers",
      body:
        "For twelve months after this agreement ends, the Representative will not solicit " +
        "construction work from a homeowner they met through the Company, and will not " +
        "solicit the Company's other representatives or crews to leave. Nothing here stops " +
        "the Representative working anywhere they like, for anyone they like, including a " +
        "direct competitor, immediately.",
    },
    {
      heading: "Ending it",
      body:
        "Either party may end this agreement at any time, for any reason, by telling the " +
        "other. Commission on jobs already collected is still paid. Commission on jobs signed " +
        "but not yet collected is paid when they are collected, provided the Representative " +
        "has not breached the rules above.",
    },
    {
      heading: "Indemnity",
      body:
        "The Representative is responsible for what they say and do in a homeowner's house. " +
        "If the Company is sued or fined because the Representative promised something the " +
        "contract does not say, absorbed a deductible, acted as an adjuster, or failed to " +
        "leave the cancellation notice, the Representative indemnifies the Company for that " +
        "claim. This does not extend to the Company's own acts.",
    },
    {
      heading: "Law and notice",
      body:
        `This agreement is governed by Texas law. Notice to the Company goes to ` +
        `${SELLER.name}, ${sellerAddress()}. Notice to the Representative goes to the address ` +
        `or email they most recently gave the Company. This document is the whole agreement ` +
        `between us and replaces anything said beforehand; changing it takes writing signed ` +
        `by both.`,
    },
  ];

  return {
    title: `Independent Sales Representative Agreement — ${COMPANY.name}`,
    warnings,
    sections,
    signatureLines: [
      { label: "Representative", name: facts.repName },
      { label: `For ${SELLER.name}`, name: null },
    ],
  };
}
