import { prisma } from "@/lib/prisma";

// How much of a contract has actually reached us.
//
// The crew payout gate used to ask "did any money come through our system",
// which caught a contractor pocketing the whole job but not one who took a
// deposit properly and then collected the balance in cash. This asks the
// question that actually protects the business: is the contract paid in full.
//
// Summed from Payment rows rather than read off a counter. A denormalised
// total and the payments behind it drift, and the one that drifts is the one
// holding somebody's pay.

export type Collected = {
  /** Dollars received against this contract. */
  collected: number;
  /** The signed contract value. */
  contractValue: number;
  /** What the customer still owes. Never negative. */
  outstanding: number;
  /** True once the contract is paid in full. */
  paidInFull: boolean;
};

export async function collectedFor(
  estimateId: string,
  contractValue: number,
): Promise<Collected> {
  const agg = await prisma.payment.aggregate({
    where: { estimateId },
    _sum: { amount: true },
  });
  const collected = agg._sum.amount ?? 0;
  return {
    collected,
    contractValue,
    outstanding: Math.max(contractValue - collected, 0),
    // Greater-than-or-equal rather than equal: an overpayment is a refund
    // problem, not a reason to keep a crew waiting for their money.
    paidInFull: collected >= contractValue && contractValue > 0,
  };
}
