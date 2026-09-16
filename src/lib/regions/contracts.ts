// The paper behind a job: what the homeowner signs, and what the people
// doing the work sign.
//
// Three documents come out of this file, because three different relationships
// need writing down and they are governed by different law:
//
//   1. The residential construction agreement — us and the homeowner. Retail
//      or insurance-restoration, which changes real terms rather than just a
//      label on the top.
//   2. The 1099 sales representative agreement — us and the rep who sits at
//      the kitchen table. See repAgreement.ts.
//   3. The subcontractor agreement — us and the crew who climb the roof. See
//      crewAgreement.ts.
//
// No state in the network licenses general contracting at state level, so
// nothing here turns on a licence number. What it turns on instead is a short
// list of rules that bite hard when ignored, most of which are read from
// src/lib/regions/states.ts rather than hardcoded:
//
//   - Bus. & Com. Code Ch. 601 — three business days to cancel a sale agreed
//     at the buyer's home, a notice saying so next to the signature, and two
//     copies of a cancellation form the buyer can post back. Miss the notice
//     and the clock never starts.
//   - Bus. & Com. Code § 27.02 — no paying, rebating or absorbing a
//     homeowner's insurance deductible. Criminal, not civil.
//   - Insurance Code Ch. 4102 — we are not a public adjuster and may not
//     negotiate the claim.
//   - Property Code Ch. 27 (RCLA) — notice and a chance to cure before suit.
//   - Mechanic's lien rules, which vary by state but share a shape: a lien on
//     an owner-occupied home generally needs a written contract executed
//     BEFORE any work starts, and often both owners' signatures and a filing.
//     Get the order wrong and the lien rights are simply gone.
//   - Property Code Ch. 162 — money a homeowner pays for construction is a
//     trust fund. Spending a roof deposit on payroll for a different job is
//     misapplication of trust funds, criminal where the statute exists.
//
// IMPORTANT, and not boilerplate: I am not a lawyer and this is not legal
// advice. The statutory notices below are written to say what the statutes
// require, but several of them (the Ch. 601 form and the Ch. 53 disclosure in
// particular) are prescribed in specific words, and the insurance-contingency
// rule has a citation I could not verify to my own satisfaction. Every
// paragraph marked COUNSEL in docs/regions.md needs a
// construction attorney's eyes before the first signature, not after.

import {
  ADJUSTER_LINE,
  LICENSED_TRADE_LINE,
  NETWORK_DISCLOSURE,
  REFUND_DAYS,
  cancellationDeadline,
  cancellationProximityNotice,
  checkDeductibleLanguage,
  checkInsurancePricing,
  coolingOffDays,
  formatLegalDate,
  requiredNotices,
} from "@/lib/regions/compliance";
import { getRegion, type StateCode } from "@/lib/regions/states";
import { COMPANY, PROOF } from "@/lib/regions/brand";
import { getTrade, type Trade } from "@/lib/regions/trades";

export { REFUND_DAYS, cancellationDeadline, coolingOffDays, formatLegalDate };

/**
 * Who the homeowner is contracting with, and where a cancellation goes.
 *
 * The mailing address is load-bearing. The Ch. 601 notice has to tell the
 * buyer where to post their cancellation, so an unset address does not produce
 * a slightly worse contract — it produces a defective one whose three-day
 * clock arguably never starts. Callers print the marker rather than a blank.
 */
export const SELLER = {
  name: COMPANY.legalName,
  tradeName: COMPANY.name,
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "",
  phone: COMPANY.phone,
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
};

export const BUSINESS_ADDRESS_MISSING =
  "[SET NEXT_PUBLIC_BUSINESS_ADDRESS — the cancellation notice is not valid without a mailing address]";

export const sellerAddress = () => SELLER.address || BUSINESS_ADDRESS_MISSING;

/** True when the contract cannot legally be issued as it stands. */
export function sellerIsConfigured(): boolean {
  return Boolean(SELLER.address && SELLER.phone);
}

export type JobKind = "RETAIL" | "INSURANCE";

export type ContractLine = {
  tradeLabel: string;
  optionLabel: string;
  unit: string;
  quantity: number;
  /** What the customer is charged for this line. Cost and base never print. */
  amount: number;
};

export type ContractFacts = {
  jobKind: JobKind;
  /** Which state the property is in. Decides the notices and the deadline. */
  state: StateCode | string;
  customerName: string;
  /** Both spouses, where the property is a homestead — see homesteadWarning. */
  coSignerName?: string | null;
  address: string;
  lines: readonly ContractLine[];
  soldPrice: number;
  depositAmount?: number | null;
  /** Set when the sale was agreed at the customer's home. Drives Ch. 601. */
  atTheHome: boolean;
  signedAt: Date;
  scopeNotes?: string | null;
  /** Insurance jobs only. */
  carrier?: string | null;
  claimNumber?: string | null;
  carrierScope?: number | null;
  deductible?: number | null;
  /** Trades on the job, so the exclusions are the real ones. */
  trades?: readonly string[];
};

export type ContractSection = { heading: string; body: string };

export type ContractDocument = {
  title: string;
  /** Blocking problems. A document with any of these must not be signed. */
  errors: string[];
  /** Things the owner should fix but which do not void the contract. */
  warnings: string[];
  sections: ContractSection[];
  /** Printed in bold immediately above the signature line. */
  proximityNotice: string | null;
  cancellationDeadline: Date | null;
  noticeOfCancellation: string[] | null;
};

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// --- The exclusions ----------------------------------------------------------

/**
 * What this contract does not cover, assembled from the trades actually sold.
 *
 * The price book already carries a per-trade `excludes` list — the boundary
 * between what we may do unlicensed and what we may not. Repeating it here
 * means the homeowner's copy and the rep's copy cannot drift apart, and that
 * the garage-door "no new electrical circuits" line appears on a garage-door
 * contract without anyone remembering to add it.
 */
export function exclusionsFor(tradeValues: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of tradeValues) {
    const trade: Trade | undefined = getTrade(value);
    for (const line of trade?.excludes ?? []) {
      if (!seen.has(line)) {
        seen.add(line);
        out.push(line);
      }
    }
  }
  return out;
}

// --- The notices -------------------------------------------------------

/**
 * Property Code Ch. 162. Money paid for construction is held in trust.
 *
 * On the contract because it is a promise worth making to a homeowner who is
 * about to hand over five figures, and in the code because the owner needs to
 * know it before they treat a deposit as working capital. Misapplying
 * construction trust funds is a criminal offence where the statute exists, and the threshold
 * for a felony is not high.
 */
export const TRUST_FUND_NOTICE =
  "Money you pay for this project is held as a construction trust fund. It is used to pay for " +
  "the labour and materials on your project and for nothing else.";

/**
 * Property Code Ch. 53 — the homestead rules, which are unforgiving about
 * order of operations.
 *
 * For a lien to attach to an owner-occupied home the contract generally must
 * be in writing, signed by every owner, executed BEFORE any material is
 * delivered or any labour is performed, and in several states filed.
 * There is no curing this afterwards. We surface it as a warning rather than
 * an error because plenty of jobs are done without lien rights on purpose —
 * but it should be a decision, not an accident.
 */
export const HOMESTEAD_DISCLOSURE =
  "If you own this property jointly, we ask everyone on the title to sign, and we ask for the " +
  "contract to be signed before any work begins or any material is delivered. Most states " +
  "require both of those before a contractor has any lien rights at all. You are not giving " +
  "up any homestead or homeowner protection by signing, and nothing in this contract waives " +
  "it.";

/**
 * The insurance-restoration escape hatch.
 *
 * A homeowner who signs a contingency contract and is then denied by their
 * carrier should not be trapped in a $20,000 retail job they never wanted.
 * Colorado gives this expressly on insurance roofing work; other states vary
 * and I could not pin every citation
 * down with enough confidence to print one, so the contract grants the right
 * in its own words and the citation question is on the counsel list. Granting
 * it outright is safe — we cannot be punished for giving a buyer more rights
 * than the statute requires.
 */
export const INSURANCE_CONTINGENCY =
  "This contract is contingent on your insurance carrier approving the claim. If your " +
  "carrier denies the claim in whole or in part, you may cancel this contract by telling us " +
  "in writing within five business days of the date you receive that decision, and anything " +
  "you have paid us will be returned in full. You do not owe us for the inspection, the " +
  "photographs, the scope or the time spent meeting your adjuster.";

/**
 * Ch. 601's notice of cancellation, which the buyer gets two copies of — one
 * to send back and one to keep.
 *
 * Substantially the statutory form. It differs from the California version on
 * the other branch in the statute it answers to and the deadline arithmetic
 * behind it, which is why this is a separate function rather than a shared one
 * with a state flag: two nearly-identical notices that must never be confused.
 */
export function noticeOfCancellation(transaction: Date, deadline: Date): string[] {
  return [
    `You may CANCEL this transaction, without any penalty or obligation, within THREE BUSINESS DAYS from ${formatLegalDate(transaction)}.`,
    `If you cancel, any payments made by you under the contract, and any negotiable instrument executed by you, will be returned within ${REFUND_DAYS} days following receipt by the seller of your cancellation notice, and any security interest arising out of the transaction will be cancelled.`,
    `If you cancel, you must make available to the seller at your residence, in substantially as good condition as when received, any goods delivered to you under this contract; or you may, if you wish, comply with the instructions of the seller regarding the return shipment of the goods at the seller's expense and risk.`,
    `If you do make the goods available to the seller and the seller does not pick them up within 20 days of the date of your notice of cancellation, you may retain or dispose of the goods without any further obligation. If you fail to make the goods available to the seller, or if you agree to return the goods to the seller and fail to do so, then you remain liable for performance of all obligations under this contract.`,
    `To cancel this transaction, mail or deliver a signed and dated copy of this cancellation notice, or any other written notice, to ${SELLER.name} at ${sellerAddress()}, not later than midnight of ${formatLegalDate(deadline)}.`,
  ];
}

// --- The contract itself -----------------------------------------------------

/**
 * Build the homeowner's contract from the facts of the job.
 *
 * Returns errors rather than throwing, because the rep is standing in somebody's
 * kitchen and needs to be told what to fix, not handed a stack trace. A document
 * with a non-empty `errors` array must not be presented for signature — the
 * page refuses to render a signature block when it sees one.
 */
export function residentialContract(facts: ContractFacts): ContractDocument {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!SELLER.address) errors.push(BUSINESS_ADDRESS_MISSING);
  if (!SELLER.phone) {
    warnings.push("No company phone is set, so the contract tells the customer nowhere to call.");
  }

  // § 27.02, twice: once on anything the rep typed, once on the arithmetic.
  const region = getRegion(facts.state);
  if (!region) {
    errors.push(
      `"${facts.state}" is not a state this network operates in. The cancellation deadline and ` +
        `the required notices are both decided by the state, so a contract cannot be produced ` +
        `for one we do not have rules for.`,
    );
  }

  const worded = checkDeductibleLanguage(
    [facts.scopeNotes, ...facts.lines.map((l) => l.optionLabel)].filter(Boolean).join("\n"),
    facts.state,
  );
  if (!worded.ok) errors.push(worded.reason);

  if (facts.jobKind === "INSURANCE") {
    const priced = checkInsurancePricing({
      carrierScope: facts.carrierScope ?? null,
      deductible: facts.deductible ?? null,
      sold: facts.soldPrice,
    });
    if (!priced.ok) errors.push(priced.reason);
    if (facts.deductible == null) {
      warnings.push(
        "No deductible recorded. Without it nothing can check that this job is not being " +
          "sold below the carrier's scope plus the deductible, which § 27.02 treats as " +
          "absorbing it.",
      );
    }
  }

  if (!facts.coSignerName) {
    warnings.push(
      "Only one signature. If the property is a homestead and the owner is married, both " +
        "spouses must sign before work begins or there are no lien rights on this job.",
    );
  }

  const deposit = facts.depositAmount ?? 0;
  const balance = facts.soldPrice - deposit;
  const homeSolicitation = facts.atTheHome;
  const deadline = homeSolicitation ? cancellationDeadline(facts.signedAt, facts.state) : null;

  const sections: ContractSection[] = [];

  sections.push({
    heading: "The work",
    body:
      facts.lines
        .map(
          (l) =>
            `${l.tradeLabel} — ${l.optionLabel}. ${l.quantity.toLocaleString()} ${l.unit.toLowerCase().replace(/_/g, " ")}${
              l.quantity === 1 ? "" : "s"
            }, ${money(l.amount)}.`,
        )
        .join("\n") +
      (facts.scopeNotes ? `\n\n${facts.scopeNotes}` : "") +
      "\n\nWe supply all labour, material, equipment and disposal unless this contract says " +
      "otherwise. We pull the permit where your city requires one and the cost of it is in " +
      "the price below, not added afterwards. The site is swept before the crew leaves each " +
      "evening.",
  });

  sections.push({
    heading: "The price",
    body:
      `${money(facts.soldPrice)} total.` +
      (deposit > 0 ? ` ${money(deposit)} received on signing, ${money(balance)} remaining.` : "") +
      "\n\nThis is a fixed price for the work described. It does not change unless you ask " +
      "for work that is not described above and agree the price for it in writing first. If " +
      "we open up the structure and find rot, decking damage or anything else we could not " +
      "have seen from the outside, we stop, photograph it, and tell you what it costs before " +
      "we touch it — we do not do the work and bill you afterwards.",
  });

  sections.push({
    heading: "Paying",
    body:
      "Payment is due as the work reaches each stage rather than up front: a deposit on " +
      "signing, a payment when material is delivered to your property, and the balance when " +
      "the work is finished and you have walked it with us. We do not ask for the full price " +
      "before work starts and you should not pay it to anyone who does.\n\n" +
      TRUST_FUND_NOTICE,
  });

  if (facts.jobKind === "INSURANCE") {
    sections.push({
      heading: "Your insurance claim",
      body:
        [
          facts.carrier ? `Carrier: ${facts.carrier}.` : null,
          facts.claimNumber ? `Claim number: ${facts.claimNumber}.` : null,
          facts.deductible != null ? `Your deductible: ${money(facts.deductible)}.` : null,
        ]
          .filter(Boolean)
          .join(" ") +
        "\n\nYou pay your deductible. We invoice your carrier for the rest. " +
        "Your deductible is your obligation under your own policy and we will not pay, " +
        "rebate, credit or absorb any part of it — most states in this network prohibit it " +
        "outright, and anyone in this trade who offers it is telling you something about how " +
        "they do business.\n\n" +
        ADJUSTER_LINE +
        "\n\n" +
        INSURANCE_CONTINGENCY,
    });
  }

  sections.push({
    heading: "When we work",
    body:
      "We start within a reasonable time of the deposit clearing and of material being " +
      "available, and we will give you a start date in writing once both are true. Weather " +
      "moves roofing and exterior work and we will not put a crew on a wet or iced roof; " +
      "where weather moves your dates we tell you the same day rather than leaving you to " +
      "wonder.",
  });

  const exclusions = exclusionsFor(facts.trades ?? []);
  sections.push({
    heading: "What this contract does not cover",
    body:
      (exclusions.length ? exclusions.map((e) => `• ${e}`).join("\n") + "\n\n" : "") +
      LICENSED_TRADE_LINE +
      "\n\nWe do not move or remediate mould, asbestos or lead paint. Where any of those is " +
      "found we stop and tell you, and it goes to a licensed specialist who contracts with " +
      "you directly.",
  });

  sections.push({
    heading: "Warranty",
    body:
      `We warrant our workmanship for ${PROOF.workmanshipWarrantyYears} years from completion. ` +
      "If something we installed fails because of how we installed it, we come back and put " +
      "it right at no charge. Materials are warranted by their manufacturer under that " +
      "manufacturer's own terms, which we register for you and hand you a copy of; we are " +
      "not the manufacturer's warranty and cannot extend it.\n\n" +
      "This warranty does not cover damage from later storms, other trades, alterations made " +
      "by somebody else, or failure to maintain gutters and drainage.",
  });

  const notices = requiredNotices(facts.state);
  if (notices.length) {
    sections.push({
      heading: `What ${region?.name ?? "this state"} requires us to tell you`,
      body: notices.map((n) => `• ${n}`).join("\n"),
    });
  }

  sections.push({
    heading: "If you think something is wrong",
    body:
      "Tell the contractor first, in writing, and give them a chance to come and look at it. " +
      "Most states require that notice and an opportunity to repair before you can sue over a " +
      "construction defect, and every state gives a contractor who wants to put something " +
      "right the chance to do so. Keep a copy of what you sent and when.",
  });

  sections.push({
    heading: "Homestead and lien rights",
    body: HOMESTEAD_DISCLOSURE,
  });

  sections.push({
    heading: "Your details",
    body:
      `We use your name, address, phone number and email to schedule and perform this work ` +
      `and to contact you about it. We do not sell them. Where this is an insurance job we ` +
      `share the scope and photographs with your carrier because that is how the claim gets ` +
      `paid.`,
  });

  if (homeSolicitation) {
    sections.push({
      heading: "Your right to cancel",
      body:
        `You agreed this contract at your home, so you have ${coolingOffDays(facts.state)} ` +
        `business days to cancel it for any reason at all — you do not have to give one. This ` +
        `is a federal right under the FTC's Cooling-Off Rule and ${region?.name ?? "your state"} ` +
        `gives it to you too. Cancel by midnight on ` +
        `${formatLegalDate(deadline!)} and everything you have paid comes back within ` +
        `${REFUND_DAYS} days. Two copies of the cancellation form are attached: send one, keep ` +
        `one. We will not start work or order material before that date unless you ask us to ` +
        `in writing, and if you ask, you keep the right to cancel anyway.`,
    });
  }

  return {
    title:
      facts.jobKind === "INSURANCE"
        ? "Residential Construction Agreement — Insurance Restoration"
        : "Residential Construction Agreement",
    errors,
    warnings,
    sections,
    proximityNotice: homeSolicitation ? cancellationProximityNotice(facts.state) : null,
    cancellationDeadline: deadline,
    noticeOfCancellation: deadline ? noticeOfCancellation(facts.signedAt, deadline) : null,
  };
}
