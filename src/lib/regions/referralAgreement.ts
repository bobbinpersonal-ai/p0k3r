// The agreement with a contractor whose work you sell before you have crews of
// your own.
//
// This is the document for the phase almost every one of these businesses
// actually starts in and almost nobody writes down: you can generate
// appointments, you cannot yet build anything, so you hand the work to somebody
// who can and take a cut. It works. What kills it is that it is nearly always
// done on a handshake, and a handshake has no answer to the four things that go
// wrong:
//
//   1. "It didn't close." You have no way to know. The fee has to trigger on a
//      signed customer contract and the contractor has to hand you a copy —
//      otherwise every deal is one phone call away from having evaporated.
//   2. "That wasn't a real appointment." Both sides mean something different by
//      qualified, and nobody wrote it down. So QUALIFIED_APPOINTMENT below is a
//      definition with teeth, and the fee attaches to that definition.
//   3. Going around you. The contractor keeps the customer, and the customer's
//      neighbour, and the three referrals that follow. Non-circumvention is not
//      paranoia here, it is the only asset you are building.
//   4. Getting paid late, forever. A fee "on completion" on a job that is
//      always nearly finished is a fee you never see.
//
// The structure is deliberately a stepping stone rather than a destination. You
// are renting somebody else's crews, insurance and working capital while you
// find out whether your phone actually produces appointments. Read TERM_LIMIT:
// the agreement is written to be outgrown.
//
// Not legal advice. See docs/regions.md.

import { COMPANY } from "@/lib/regions/brand";
import { SELLER, sellerAddress, type ContractSection } from "@/lib/regions/contracts";
import type { AgreementDocument } from "@/lib/regions/repAgreement";
import { getRegion, type StateCode } from "@/lib/regions/states";

/**
 * Who runs the sales appointment.
 *
 * SET_ONLY is safer and pays less: you book it, they close it, you never meet
 * the customer. SET_AND_PRESENT keeps you in the room, which is worth more than
 * the extra points — you learn what the objections actually are, you see the
 * close happen rather than being told about it, and the customer meets you. If
 * the plan is ever to bring this in-house, SET_AND_PRESENT is the only version
 * that teaches you anything.
 */
export type ReferralMode = "SET_ONLY" | "SET_AND_PRESENT";

export type ReferralFacts = {
  contractorName: string;
  /** Where the contractor works. Decides governing law and the notices. */
  state: StateCode | string;
  /** Trades this contractor actually does. */
  trades: readonly string[];
  mode: ReferralMode;
  /** Fraction of the signed contract value. Ignored when feePerAppointment is set. */
  feeRate?: number;
  /** Flat fee per qualified appointment, as an alternative to a percentage. */
  feePerAppointment?: number;
  /** Days after the customer signs that the fee falls due. */
  payDays?: number;
  effective: Date;
};

/** Days after the customer signs before the fee is payable. */
export const DEFAULT_PAY_DAYS = 7;

/**
 * Typical market fee, and the number to open at.
 *
 * Contractors accept this readily once they do the comparison: a shared
 * aggregator lead runs $50–150 and closes at a few percent, so their real cost
 * per sale is well into four figures. A booked appointment with the
 * decision-makers present, paid for only when it signs, is cheaper than that
 * and carries no risk for them at all. Say the comparison out loud.
 */
export const OPENING_FEE_RATE = 0.1;
export const PRESENT_FEE_RATE = 0.15;

/**
 * How long to run this before renegotiating.
 *
 * Not a legal term — a business one, and the reason it is in the code. The
 * arrangement is a paid apprenticeship: you are being paid to find out whether
 * cold calling produces appointments, what these jobs really cost, and whether
 * this contractor is any good. Those questions are answered in weeks, and once
 * they are, the economics of staying a middleman get bad fast.
 */
export const TERM_LIMIT_DAYS = 90;

/**
 * What both sides mean by "a qualified appointment".
 *
 * Written as a list because this is the clause that gets argued about, and an
 * argument about a vague word is one you lose. Each line is something that can
 * be checked rather than debated.
 */
export const QUALIFIED_APPOINTMENT = [
  "The person is the owner of the property, not a tenant.",
  "The property is inside the service area both parties agreed.",
  "They want a price for work the Contractor actually does.",
  "Everyone who has to agree to spend the money will be there — not one of two.",
  "A specific date and time was agreed, confirmed by text, and not cancelled by the homeowner before it.",
  "They were told it is a sales appointment and that they will be given a price.",
] as const;

const pct = (rate: number) => `${Math.round(rate * 1000) / 10}%`;
const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export function referralAgreement(facts: ReferralFacts): AgreementDocument {
  const warnings: string[] = [];
  const flat = facts.feePerAppointment ?? null;
  const rate =
    facts.feeRate ?? (facts.mode === "SET_AND_PRESENT" ? PRESENT_FEE_RATE : OPENING_FEE_RATE);
  const payDays = facts.payDays ?? DEFAULT_PAY_DAYS;

  if (flat !== null) {
    warnings.push(
      "A flat fee per appointment pays you whether the job is worth $2,000 or $20,000, and " +
        "gives the contractor every reason to take your appointments and close none of them. " +
        "It is the safer structure on day one and the worse one by week three — switch to a " +
        "percentage of signed contract value as soon as you have any track record.",
    );
  }
  if (!SELLER.address) {
    warnings.push("No business address is set, so this agreement names nowhere to send notice.");
  }
  if (!getRegion(facts.state)) {
    warnings.push(
      `"${facts.state}" is not a state in the network, so the governing-law clause has nothing ` +
        `to name. Set it to the state the contractor actually works in.`,
    );
  }
  if (facts.mode === "SET_ONLY") {
    warnings.push(
      "You are not in the room. That caps what you can learn and it makes you entirely " +
        "dependent on the contractor telling you the truth about what closed. Worth the extra " +
        "points to be there.",
    );
  }

  const sections: ContractSection[] = [
    {
      heading: "What this is",
      body:
        `This is an agreement between ${SELLER.name} ("the Marketer") and ` +
        `${facts.contractorName} ("the Contractor"). The Marketer finds homeowners who want ` +
        `${facts.trades.join(", ")} work and books appointments with them. The Contractor ` +
        `quotes and performs that work under the Contractor's own contract with the ` +
        `homeowner.\n\n` +
        "The two businesses stay separate. This is not a partnership, a joint venture or an " +
        "employment relationship, neither party may bind the other, and neither is liable for " +
        "the other's debts.",
    },
    {
      heading: "Who the customer contracts with",
      body:
        "The Contractor. Every job is between the Contractor and the homeowner, on the " +
        "Contractor's paper, at the Contractor's price. The Contractor is responsible for the " +
        "work, the warranty, the permits, the insurance and anything that goes wrong on the " +
        "property.\n\n" +
        "The Marketer is not a party to that contract, does not perform construction work, " +
        "does not warrant it, and does not hold the homeowner's money at any point.",
    },
    {
      heading: "What the Marketer does",
      body:
        "Generates homeowners at the Marketer's own cost, by the Marketer's own methods, and " +
        "books qualified appointments in the Contractor's calendar." +
        (facts.mode === "SET_AND_PRESENT"
          ? "\n\nThe Marketer also attends the appointment and presents the Contractor's " +
            "prices from a price list the Contractor has given in writing. The Marketer may " +
            "not quote a price that is not on that list, may not discount, and may not agree " +
            "any term the Contractor has not authorised in writing."
          : "\n\nThe Contractor runs the appointment and closes the sale. The Marketer does " +
            "not attend and does not quote prices.") +
        "\n\nThe Marketer's leads, lists, call records and customer details are the " +
        "Marketer's own property and remain so.",
    },
    {
      heading: "What counts as a qualified appointment",
      body:
        "All of the following, and the parties agree that anything meeting all of them is " +
        "qualified whether or not it results in a sale:\n\n" +
        QUALIFIED_APPOINTMENT.map((line) => `• ${line}`).join("\n") +
        "\n\nIf the Contractor believes an appointment was not qualified, they must say so " +
        "within 48 hours of it and say which of the points above failed. An appointment not " +
        "challenged inside 48 hours is qualified.",
    },
    {
      heading: "What the Marketer is paid",
      body:
        (flat !== null
          ? `${money(flat)} for each qualified appointment, whether or not it results in a sale.`
          : `${pct(rate)} of the total contract value of every job the Contractor signs with a ` +
            `homeowner the Marketer introduced.`) +
        `\n\nThe fee is earned when the homeowner signs the Contractor's contract — not when ` +
        `the job starts, not when it finishes, and not when the Contractor gets paid. It is ` +
        `payable within ${payDays} days of that signature.\n\n` +
        "If the homeowner cancels inside their statutory three business days, or the contract " +
        "is voided, no fee is owed and any fee already paid on that job is returned or set " +
        "against the next one. The Marketer does not get paid for a sale that unwound.\n\n" +
        "Change orders and additional work sold to the same homeowner within twelve months " +
        "carry the same fee.",
    },
    {
      heading: "Telling each other the truth about what happened",
      body:
        "Within two business days of every appointment, the Contractor tells the Marketer " +
        "whether it sold, and if it did, sends a copy of the signed contract showing the total " +
        "contract value. If it did not sell, the Contractor says why in a sentence.\n\n" +
        "This is the whole basis on which the Marketer is paid, so it is a condition of this " +
        "agreement rather than a courtesy. A Contractor who will not report closes is a " +
        "Contractor the Marketer should stop sending appointments to.",
    },
    {
      heading: "Not going around each other",
      body:
        "For twenty-four months after this agreement ends, the Contractor will not solicit or " +
        "accept construction work from a homeowner the Marketer introduced, or from anyone " +
        "that homeowner refers, without paying the fee above.\n\n" +
        "The Marketer likewise will not solicit the Contractor's existing customers, and will " +
        "not approach the Contractor's crews to work for the Marketer directly during this " +
        "agreement.",
    },
    {
      heading: "Not exclusive",
      body:
        "Neither party is exclusive to the other. The Marketer may work with other " +
        "contractors and the Contractor may take work from anywhere. If either party wants " +
        "exclusivity it is paid for separately and written down — a volume commitment from " +
        "the Contractor, or a fee from the Marketer, not a favour.",
    },
    {
      heading: "How the Marketer contacts people",
      body:
        "The Marketer does its own calling and texting, at its own cost, and is responsible " +
        "for complying with the Telephone Consumer Protection Act, the Telemarketing Sales " +
        "Rule, the national and applicable state do-not-call registries, and the telephone " +
        "solicitation law of the state being called. The Marketer indemnifies the Contractor " +
        "against any claim arising from how the Marketer contacted somebody.\n\n" +
        "The Contractor indemnifies the Marketer against any claim arising from the " +
        "Contractor's work, pricing, warranty or conduct on a property.",
    },
    {
      heading: "What neither of us says",
      body:
        "The Marketer does not describe the Contractor's completed jobs as the Marketer's own " +
        "work, and does not use photographs of them without saying whose they are. The " +
        "Marketer may say truthfully that it works with the Contractor and may show the " +
        "Contractor's work as the Contractor's, with permission.\n\n" +
        "Neither party makes promises about price, timing, warranty or insurance outcomes " +
        "that the other has not agreed in writing.",
    },
    {
      heading: "Ending it",
      body:
        `Either party may end this agreement at any time by telling the other in writing. ` +
        `Fees on appointments already booked, and on jobs already signed, survive and are ` +
        `still payable. The non-circumvention clause survives.\n\n` +
        `The parties will review these terms after ${TERM_LIMIT_DAYS} days. This arrangement ` +
        `suits a Marketer without crews and a Contractor without lead flow, and both of those ` +
        `facts change.`,
    },
    {
      heading: "Law and notice",
      body:
        `${getRegion(facts.state)?.name ?? "The Contractor's state"} law governs — the state ` +
        `the work is performed in, not ours. Notice to the Marketer goes to ${SELLER.name}, ` +
        `${sellerAddress()}. ` +
        `Notice to the Contractor goes to the address they most recently gave. This is the ` +
        `whole agreement and changing it takes writing signed by both.`,
    },
  ];

  return {
    title: `Lead Generation & Referral Agreement — ${COMPANY.name}`,
    warnings,
    sections,
    signatureLines: [
      { label: "Contractor", name: facts.contractorName },
      { label: `For ${SELLER.name}`, name: null },
    ],
  };
}
