/**
 * Stripe Connect: hold the homeowner's money, pay the crew, keep the margin.
 *
 * Deployable as a standalone serverless function. A thin adapter over
 * src/lib/integrations/stripeConnect.ts, which owns the arithmetic and the
 * signature check.
 *
 * NOT ESCROW, AND THE WORD IS AVOIDED DELIBERATELY. Stripe is not an escrow
 * provider, its terms prohibit presenting it as one, and holding a third
 * party's money pending a condition is what state money-transmitter
 * licensing regulates. LoveMeAfter is the general contractor: it holds the
 * homeowner's contract, carries the warranty, and pays subcontractors out of
 * its own funds. The mechanism that delivers everything actually wanted is
 * separate charges and transfers — the charge lands in the platform account,
 * sits there while the work happens, and a transfer goes to the crew on
 * completion with our margin simply never leaving.
 *
 * Contract
 *   POST, RAW body (do not let the platform parse it — the signature is over
 *   the exact bytes). Header `stripe-signature`.
 *
 * Events handled
 *   payment_intent.succeeded  — record the homeowner's money against the job
 *   charge.refunded           — mark it, and never pay out on a refunded job
 *
 * Payout is NOT triggered by a Stripe event. It is triggered by the job being
 * complete, because Stripe knows when money arrived and knows nothing about
 * whether a roof is finished. The gates live in src/app/api/admin/
 * crew-payouts and are unchanged by this file: COMPLETED, paid in full, no
 * unresolved margin override, W-9 on file, no duplicate, and the payout not
 * exceeding the job's cost line.
 */

const { PrismaClient } = require("@prisma/client");
const {
  splitFor,
  transferToContractor,
  verifyStripeWebhook,
} = require("../src/lib/integrations/stripeConnect");

const prisma = globalThis.__lmaPrisma ?? new PrismaClient();
if (!globalThis.__lmaPrisma) globalThis.__lmaPrisma = prisma;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only." });

  const raw = await readRawBody(req);
  const verified = await verifyStripeWebhook(raw, req.headers["stripe-signature"] ?? null);
  if (!verified.ok) return res.status(401).json({ error: verified.error });

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: "Body is not JSON." });
  }

  const object = event?.data?.object ?? {};
  const estimateId = object?.metadata?.estimateId;

  switch (event.type) {
    case "payment_intent.succeeded": {
      if (!estimateId) {
        // Not one of ours, or the checkout was built without metadata.
        // 200 so Stripe stops retrying something we will never match.
        return res.status(200).json({ ok: true, ignored: "no estimateId in metadata" });
      }
      const amount = Math.round((object.amount_received ?? object.amount ?? 0) / 100);
      if (amount <= 0) return res.status(200).json({ ok: true, ignored: "zero amount" });

      // Idempotent on the Stripe reference: a redelivered webhook must not
      // record the homeowner's deposit twice and make the job look paid.
      const ref = String(object.id);
      const seen = await prisma.payment.findFirst({
        where: { estimateId, reference: ref },
        select: { id: true },
      });
      if (seen) return res.status(200).json({ ok: true, deduped: true });

      await prisma.payment.create({
        data: {
          estimateId,
          amount,
          kind: object.metadata?.kind === "FINAL" ? "FINAL" : "DEPOSIT",
          rail: "CARD",
          reference: ref,
          recordedBy: "stripe-webhook",
        },
      });
      return res.status(200).json({ ok: true, recorded: amount });
    }

    case "charge.refunded": {
      if (!estimateId) return res.status(200).json({ ok: true, ignored: "no estimateId" });
      // Flagged rather than deleted: the money did arrive and then left, and
      // the ledger should say so. The payout gate reads collectedFor(), which
      // sums Payment rows, so a negative row is what stops a payout.
      const refunded = Math.round((object.amount_refunded ?? 0) / 100);
      if (refunded > 0) {
        const ref = `refund:${object.id}`;
        const seen = await prisma.payment.findFirst({
          where: { estimateId, reference: ref },
          select: { id: true },
        });
        if (!seen) {
          await prisma.payment.create({
            data: {
              estimateId,
              amount: -refunded,
              kind: "REFUND",
              rail: "CARD",
              reference: ref,
              recordedBy: "stripe-webhook",
            },
          });
        }
      }
      return res.status(200).json({ ok: true, refunded });
    }

    default:
      return res.status(200).json({ ok: true, ignored: event.type });
  }
};

/**
 * Pay a crew for a completed job.
 *
 * Exported separately from the webhook because it is triggered by the job
 * finishing, not by a Stripe event. Callable from the admin payout route.
 *
 * The idempotency key is the payout row id, which is what stops a retry
 * paying somebody twice — see transferToContractor.
 */
module.exports.payoutForEstimate = async function payoutForEstimate(estimateId) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: estimateId },
    select: {
      id: true,
      soldPrice: true,
      costTotal: true,
      commission: true,
      status: true,
      lead: {
        select: {
          channelPartnerId: true,
          worker: {
            select: { id: true, name: true, w9OnFile: true, stripeAccountId: true, stripePayoutsEnabled: true },
          },
        },
      },
    },
  });
  if (!estimate) return { ok: false, error: "Estimate not found." };

  const worker = estimate.lead.worker;
  if (!worker) return { ok: false, error: "No crew on this job." };
  if (!worker.w9OnFile) return { ok: false, error: "No W-9 on file for this crew." };
  if (!worker.stripeAccountId || !worker.stripePayoutsEnabled) {
    return { ok: false, error: "Crew has not finished Stripe onboarding." };
  }

  const split = splitFor({
    soldPrice: estimate.soldPrice,
    costTotal: estimate.costTotal,
    sellerCommission: estimate.commission,
    hasChannelPartner: Boolean(estimate.lead.channelPartnerId),
  });
  if (!split.clearsFloor) {
    return { ok: false, error: "Under the margin floor. Needs sign-off before any money moves." };
  }

  const existing = await prisma.workerPayout.findFirst({
    where: { estimateId: estimate.id, workerId: worker.id },
    select: { id: true, stripeTransferId: true },
  });
  if (existing?.stripeTransferId) {
    return { ok: true, deduped: true, transferId: existing.stripeTransferId };
  }

  const payout =
    existing ??
    (await prisma.workerPayout.create({
      data: {
        workerId: worker.id,
        estimateId: estimate.id,
        amount: split.contractorAmount,
        method: "STRIPE",
        taxYear: new Date().getFullYear(),
      },
      select: { id: true, stripeTransferId: true },
    }));

  const transfer = await transferToContractor({
    stripeAccountId: worker.stripeAccountId,
    amountDollars: split.contractorAmount,
    idempotencyKey: payout.id,
    description: `LoveMeAfter job ${estimate.id} — ${worker.name}`,
  });

  if (!transfer.ok) {
    await prisma.workerPayout.update({
      where: { id: payout.id },
      data: { transferStatus: "FAILED" },
    });
    return { ok: false, error: transfer.error, retryable: transfer.retryable };
  }

  await prisma.workerPayout.update({
    where: { id: payout.id },
    data: { stripeTransferId: transfer.transferId, transferStatus: "SENT" },
  });

  return { ok: true, transferId: transfer.transferId, amount: split.contractorAmount };
};

function readRawBody(req) {
  if (typeof req.body === "string") return Promise.resolve(req.body);
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body.toString("utf8"));
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}
