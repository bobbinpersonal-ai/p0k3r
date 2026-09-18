// The agreement with a crew — the people who actually climb the roof.
//
// Two things make this document different from the sales rep's, and both are
// about money the Company can be made to pay twice.
//
// The first is liens. A subcontractor who does not get paid can file a
// mechanic's lien against the homeowner's property, and the homeowner then pays
// twice or sues us. Every state gives that right by statute and the only clean answer
// is a lien waiver exchanged for each payment — which is why the waiver forms
// live in this file rather than in a folder somebody forgets to open.
//
// The second is workers' compensation. Texas is the one state that does not
// require private employers to carry it. That is not a saving, it is a transfer
// of risk: a crew member who falls off a roof with no coverage behind him has
// nowhere to go except a personal-injury claim against whoever is standing
// nearest, and that is us. So the agreement asks for a certificate, and where
// there is none it says so in writing, in words the owner will actually read,
// rather than leaving the gap silent.
//
// Not legal advice. The statutory lien waiver wording below is written to match
// the prescribed forms but the statute requires substantial compliance with
// specific text, and it differs by state — have a construction attorney in each
// state confirm the forms
// before the first one is signed. See docs/regions.md.

import { COMPANY, PROOF } from "@/lib/regions/brand";
import { getRegion, type StateCode } from "@/lib/regions/states";
import { SELLER, sellerAddress, type ContractSection } from "@/lib/regions/contracts";
import { CONTRACTOR_OVERAGE_RATE } from "@/lib/regions/commission";
import type { AgreementDocument } from "@/lib/regions/repAgreement";

export type CrewAgreementFacts = {
  crewName: string;
  /** Where they work. Decides governing law and the workers' comp position. */
  state?: StateCode | string;
  /** The trade or trades this crew is engaged for. */
  trades?: readonly string[];
  w9OnFile: boolean;
  /** A general liability certificate naming us as additional insured. */
  generalLiabilityOnFile: boolean;
  /** Mandatory in every state in the network. Its absence is a blocker. */
  workersCompOnFile: boolean;
  /** ZELLE or APPLE_PAY, matching Worker.payoutMethod. */
  payoutMethod?: string | null;
  effective: Date;
};

/** The IRS threshold above which a 1099-NEC is required for the year. */
export const NEC_THRESHOLD = 600;

/** Days after sign-off and lien waiver that a crew is paid. */
export const CREW_PAID_DAYS = 3;

export function crewAgreement(facts: CrewAgreementFacts): AgreementDocument {
  const warnings: string[] = [];

  if (!facts.w9OnFile) {
    warnings.push(
      `No W-9 for ${facts.crewName}. Nothing may be paid until there is one — a 1099-NEC is ` +
        `required for anyone paid $${NEC_THRESHOLD} or more in a year and it cannot be filed ` +
        `without their taxpayer number.`,
    );
  }
  if (!facts.generalLiabilityOnFile) {
    warnings.push(
      "No general liability certificate on file. If this crew damages a customer's house " +
        "there is nothing behind them and the claim lands on the Company.",
    );
  }
  const region = getRegion(facts.state);
  if (!facts.workersCompOnFile) {
    warnings.push(
      region?.rules.workersCompRequired
        ? `No workers' compensation on file, and ${region.name} REQUIRES it. ` +
          `${region.rules.workersCompNote} This is not a risk to price — it is a contractor ` +
          `who cannot lawfully put employees on a roof. Do not route work to them until the ` +
          `certificate exists.`
        : "No workers' compensation on file. A crew member hurt on one of our jobs would have " +
          "no compensation to claim and a personal-injury suit is the only route left to them.",
    );
  }

  const sections: ContractSection[] = [
    {
      heading: "What this is",
      body:
        `This is an agreement between ${SELLER.name} ("the Company") and ${facts.crewName} ` +
        `("the Contractor"), an independent contractor` +
        (facts.trades?.length ? ` engaged for ${facts.trades.join(", ")}` : "") +
        `. It is not an employment agreement and it does not guarantee any volume of work. ` +
        `Each job is offered separately and the Contractor may accept or decline any of them.`,
    },
    {
      heading: "How a job is agreed",
      body:
        "Before any work starts the Company gives the Contractor a written work order naming " +
        "the property, the scope, the material, the start date and the price for that job. " +
        "The Contractor confirms it before mobilising. No work order, no job — work done " +
        "without one is not authorised and will not be paid.",
    },
    {
      heading: "What the Contractor supplies",
      body:
        "Labour, hand and power tools, ladders, fall protection, and transport. The " +
        "Contractor decides how the work is done, sets their own hours within the agreed " +
        "dates, chooses their own crew, and is free to work for anyone else at any time.\n\n" +
        "The Company supplies the material unless the work order says otherwise, and pulls " +
        "the permit where the city requires one.",
    },
    {
      heading: "Insurance",
      body:
        "The Contractor carries general liability insurance of at least $1,000,000 per " +
        "occurrence and names the Company as an additional insured, and gives the Company a " +
        "current certificate before the first job and on every renewal.\n\n" +
        (facts.workersCompOnFile
          ? "The Contractor carries workers' compensation covering everyone they bring onto a " +
            "job, and provides a certificate for it."
          : "The Contractor does NOT currently hold workers' compensation insurance. " +
            (region?.rules.workersCompRequired
              ? `${region.name} requires it of an employer with employees — ` +
                `${region.rules.workersCompNote} The Contractor confirms either that they ` +
                `hold it, or that they are a sole operator below the threshold, and will not ` +
                `bring employees onto a job without coverage. `
              : "") +
            "The Contractor understands that neither they nor anyone they bring onto a job " +
            "is covered by any policy of the Company, that the Company provides no medical " +
            "or wage benefit for an injury on a job, and that the Contractor is responsible " +
            "for the safety of their own people."),
    },
    {
      heading: "Safety",
      body:
        "The Contractor works to OSHA requirements, including fall protection on every roof, " +
        "and is responsible for their own crew's compliance. The Company may remove anyone " +
        "from a job site for working unsafely, and doing so is not the Company directing how " +
        "the work is performed — it is the Company protecting a customer's property and the " +
        "people on it.",
    },
    {
      heading: "The site",
      body:
        "Tarps over landscaping and pools, no material or debris left in a driveway " +
        "overnight, a magnet run over the drive and lawn every evening, and the site left " +
        "clean enough that the homeowner would not know anyone had been there except for the " +
        "work. Damage to landscaping, gutters, driveways, vehicles or anything else on the " +
        "property is the Contractor's to repair or pay for.",
    },
    {
      heading: "What the Contractor is paid, and when",
      body:
        `The price on the work order, in full, with no retainage. Payment is made within ` +
        `${CREW_PAID_DAYS} days of three things being true: the work is complete, the ` +
        `Company or the homeowner has walked it and signed off, and the Contractor has ` +
        `signed the lien waiver for that payment.\n\n` +
        (facts.payoutMethod
          ? `Payment goes by ${facts.payoutMethod === "APPLE_PAY" ? "Apple Cash" : "Zelle"} to ` +
            `the handle the Contractor has given the Company. `
          : "") +
        "Change orders are paid only where the Company agreed them in writing before the " +
        "extra work was done.\n\n" +
        `The Company files a 1099-NEC for any Contractor paid $${NEC_THRESHOLD} or more in a ` +
        `calendar year. No tax is withheld and the Contractor is responsible for their own.`,
    },
    {
      heading: "Lien waivers",
      body:
        "The Contractor signs a conditional waiver when each payment is issued and an " +
        "unconditional waiver once it has cleared, in the forms attached. The Contractor will " +
        "not file, and will procure the release of, any mechanic's lien against a customer's " +
        "property for work the Company has paid for.\n\n" +
        "The Contractor pays their own crew and their own suppliers, and indemnifies the " +
        "Company and the homeowner against any lien or claim by either.",
    },
    {
      heading: "Warranty",
      body:
        `The Contractor warrants their workmanship for ${PROOF.workmanshipWarrantyYears} ` +
        `years from completion — the same term the Company gives the homeowner, because a ` +
        `warranty the Company cannot pass through is a warranty the Company funds alone. If ` +
        `something fails because of how it was installed, the Contractor returns and puts it ` +
        `right at no charge within a reasonable time of being told. If they cannot or will ` +
        `not, the Company may have it put right and set the cost against anything owed.`,
    },
    {
      heading: "Selling the job",
      body:
        "The Contractor measures the job and presents the price to the homeowner, on the " +
        "Company's estimate and the Company's contract. The price book sets a floor and the " +
        "Contractor cannot sell below it. Where the Contractor sells above the floor, the " +
        "Contractor keeps " +
        `${Math.round(CONTRACTOR_OVERAGE_RATE * 100)}% of the difference on top of the price ` +
        "for the work itself.\n\n" +
        "The agreement for the work is between the homeowner and the Company. The Contractor " +
        "does not sign the homeowner up in their own name, present their own paperwork, or " +
        "quote a price that is not on the Company's estimate.",
    },
    {
      heading: "All the money goes through the Company",
      body:
        "Every dollar a homeowner pays for a job sold through the Company is taken on the " +
        "Company's payment system — deposit, progress payment and final payment alike. The " +
        "Contractor does not take cash, a cheque, a card, a transfer or any other payment " +
        "from a homeowner directly, and does not ask one to pay anything on the side.\n\n" +
        "This is not bookkeeping. The Company holds the contract, carries the warranty and " +
        "the insurance, and is the one the homeowner can come back to; money collected " +
        "outside it leaves a customer paying for work nobody is answerable for. It is also " +
        "what everyone else on the job is paid out of.\n\n" +
        "If a homeowner hands the Contractor money anyway, the Contractor tells the Company " +
        "the same day and it is recorded against the job. The Company may set anything " +
        "collected outside its payment system against what is owed to the Contractor, and " +
        "taking payment directly is a breach of this agreement that ends it.",
    },
    {
      heading: "Not going around the Company",
      body:
        "For twelve months after a job, the Contractor will not solicit construction work " +
        "directly from a homeowner whose property they worked on through the Company. The " +
        "Contractor is otherwise free to work for anyone, including competitors, at any time.",
    },
    {
      heading: "No further subcontracting",
      body:
        "The Contractor does not subcontract a job to someone else without the Company's " +
        "written agreement. Everyone the Contractor brings onto a site is the Contractor's " +
        "responsibility, including their pay, their safety and their conduct.",
    },
    {
      heading: "Indemnity",
      body:
        "The Contractor indemnifies the Company against claims arising from the Contractor's " +
        "work, their people, their equipment, their unpaid suppliers and their failure to " +
        "insure. This does not extend to the Company's own acts or to material the Company " +
        "supplied.",
    },
    {
      heading: "Ending it",
      body:
        "Either party may end this agreement at any time by telling the other. Work orders " +
        "already accepted are finished and paid on the terms above. Ending the agreement does " +
        "not end the warranty, the lien waiver obligations or the indemnity.",
    },
    {
      heading: "Law and notice",
      body:
        `${region?.name ?? "The Contractor's state"} law governs. Notice to the Company goes ` +
        `to ${SELLER.name}, ${sellerAddress()}. ` +
        `This is the whole agreement and changing it takes writing signed by both.`,
    },
  ];

  return {
    title: `Subcontractor Agreement — ${COMPANY.name}`,
    warnings,
    sections,
    signatureLines: [
      { label: "Contractor", name: facts.crewName },
      { label: `For ${SELLER.name}`, name: null },
    ],
  };
}

// --- Lien waivers ------------------------------------------------------------
//
// States prescribe forms for these and a waiver that does not substantially
// comply with the statutory form is unenforceable — so an almost-right waiver
// buys nothing at all. The all-caps notice at the top of each is part of the
// prescribed form, not emphasis I added.

export type WaiverKind =
  | "CONDITIONAL_PROGRESS"
  | "UNCONDITIONAL_PROGRESS"
  | "CONDITIONAL_FINAL"
  | "UNCONDITIONAL_FINAL";

export type WaiverFacts = {
  kind: WaiverKind;
  claimantName: string;
  customerName: string;
  propertyAddress: string;
  amount: number;
  /** Progress waivers only: the period the payment covers. */
  throughDate?: Date | null;
  jobNumber?: string | null;
};

export type WaiverDocument = {
  title: string;
  notice: string;
  body: string[];
  /** Conditional waivers are worthless once the money is known to have cleared. */
  conditional: boolean;
};

// The unconditional notice below is the prescribed all-caps text and is
// reproduced as such. The conditional one is NOT: I could not reproduce the
// statutory conditional wording with enough confidence to claim it, so this
// says what a conditional waiver actually does in plain accurate words and is
// flagged for counsel rather than passed off as the form. A waiver that does
// not substantially comply is unenforceable, so an almost-right conditional
// notice would buy nothing — better an obviously-drafted one somebody checks.
const CONDITIONAL_NOTICE =
  "NOTICE: THIS DOCUMENT WAIVES RIGHTS ONLY ON RECEIPT OF PAYMENT. IT IS NOT A RECEIPT AND " +
  "IT IS NOT EFFECTIVE UNTIL THE PAYMENT DESCRIBED BELOW HAS BEEN MADE AND HAS CLEARED THE " +
  "BANK ON WHICH IT IS DRAWN. DO NOT SIGN AN UNCONDITIONAL RELEASE UNTIL YOU HAVE BEEN PAID.";

const UNCONDITIONAL_NOTICE =
  "NOTICE: THIS DOCUMENT WAIVES RIGHTS UNCONDITIONALLY AND STATES THAT YOU HAVE BEEN PAID " +
  "FOR GIVING UP THOSE RIGHTS. THIS DOCUMENT IS ENFORCEABLE AGAINST YOU IF YOU SIGN IT, " +
  "EVEN IF YOU HAVE NOT BEEN PAID. IF YOU HAVE NOT BEEN PAID, USE A CONDITIONAL RELEASE FORM.";

export function lienWaiver(facts: WaiverFacts): WaiverDocument {
  const conditional = facts.kind.startsWith("CONDITIONAL");
  const final = facts.kind.endsWith("FINAL");
  const money = `$${Math.round(facts.amount).toLocaleString("en-US")}`;

  const title =
    `${conditional ? "Conditional" : "Unconditional"} Waiver and Release on ` +
    `${final ? "Final" : "Progress"} Payment`;

  const scope = final
    ? `all labour, services, equipment and materials furnished to the property`
    : `labour, services, equipment and materials furnished to the property through ` +
      `${facts.throughDate ? facts.throughDate.toLocaleDateString("en-US") : "[THROUGH DATE MISSING]"}`;

  const body = [
    `Project: ${facts.propertyAddress}` + (facts.jobNumber ? `   Job No.: ${facts.jobNumber}` : ""),
    `Owner: ${facts.customerName}`,
    `Claimant: ${facts.claimantName}`,
    `Payment amount: ${money}`,
    conditional
      ? `On receipt by the claimant of a cheque or payment from ${SELLER.name} in the sum of ` +
        `${money} payable to the claimant, and when the payment has been properly endorsed and ` +
        `has cleared the bank on which it is drawn, this document becomes effective to release ` +
        `and the claimant waives and releases any mechanic's lien right, any right arising from ` +
        `a payment bond that complies with a state or federal statute, any common law payment ` +
        `bond right, any claim for payment, and any rights under any similar ordinance, rule or ` +
        `statute related to claim or payment rights, that the claimant has for ${scope}.`
      : `The claimant has been paid and has received a payment of ${money}, and the claimant ` +
        `therefore waives and releases any mechanic's lien right, any right arising from a ` +
        `payment bond that complies with a state or federal statute, any common law payment ` +
        `bond right, any claim for payment, and any rights under any similar ordinance, rule or ` +
        `statute related to claim or payment rights, that the claimant has for ${scope}.`,
    final
      ? `This release covers the final payment for all work on the property and the claimant ` +
        `confirms that they and everyone supplying labour or material through them have been ` +
        `paid in full.`
      : `This release does not cover any retention, any items furnished after the date above, ` +
        `or any contract rights for work not yet performed.`,
    `Date: ______________________   Signature: ______________________`,
    `Printed name and title: ______________________`,
  ];

  return {
    title,
    notice: conditional ? CONDITIONAL_NOTICE : UNCONDITIONAL_NOTICE,
    body,
    conditional,
  };
}
