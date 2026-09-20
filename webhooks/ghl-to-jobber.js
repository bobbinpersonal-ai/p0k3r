/**
 * GoHighLevel booked appointment -> Jobber job.
 *
 * Deployable as a standalone serverless function (Vercel, Lambda, Cloud
 * Function). It is a THIN ADAPTER: every decision lives in src/lib/
 * integrations/* so this file and the App Router route at
 * /api/dispatch cannot drift apart. Duplicated logic in an integration is
 * how two systems start disagreeing about who got paid.
 *
 * Contract
 *   POST, JSON body = GoHighLevel's appointment webhook payload.
 *   Header `x-ghl-secret` must equal GHL_WEBHOOK_SECRET.
 *
 * Responses
 *   200 { ok: true, leadId, jobberJobId }   created, or already existed
 *   200 { ok: true, deduped: true }         we have seen this contact
 *   400 { error }                           payload we cannot use
 *   401 { error }                           bad or missing secret
 *   502 { error, retryable }                Jobber said no; GHL will retry
 *
 * WHY 502 AND NOT 200 ON A JOBBER FAILURE. GoHighLevel retries a webhook
 * that does not return 2xx. Swallowing a Jobber outage as 200 loses the job
 * silently and nobody finds out until a homeowner rings asking where the
 * crew is. Returning 502 makes GHL redeliver it, which is exactly what we
 * want. A payload we can never process returns 400 so it is NOT retried
 * forever.
 */

const { PrismaClient } = require("@prisma/client");
const { normaliseAppointment, verifyGhlWebhook } = require("../src/lib/integrations/ghl");
const { createJob } = require("../src/lib/integrations/jobber");

const prisma = globalThis.__lmaPrisma ?? new PrismaClient();
if (!globalThis.__lmaPrisma) globalThis.__lmaPrisma = prisma;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only." });
  }
  if (!verifyGhlWebhook(req.headers["x-ghl-secret"] ?? null)) {
    return res.status(401).json({ error: "Bad signature." });
  }

  const payload = typeof req.body === "string" ? safeParse(req.body) : req.body;
  if (!payload) return res.status(400).json({ error: "Body is not JSON." });

  const parsed = normaliseAppointment(payload);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });
  const appt = parsed.value;

  // Idempotency. GHL redelivers, and a redelivery must not create a second
  // lead or a second Jobber job for the same appointment.
  const existing = await prisma.lead.findUnique({
    where: { ghlContactId: appt.ghlContactId },
    select: { id: true, estimate: { select: { id: true, jobberJobId: true } } },
  });

  if (existing?.estimate?.jobberJobId) {
    return res.status(200).json({
      ok: true,
      deduped: true,
      leadId: existing.id,
      jobberJobId: existing.estimate.jobberJobId,
    });
  }

  const lead =
    existing ??
    (await prisma.lead.create({
      data: {
        ghlContactId: appt.ghlContactId,
        ghlOpportunityId: appt.ghlOpportunityId,
        customerName: appt.customerName,
        customerPhone: appt.customerPhone,
        customerEmail: appt.customerEmail,
        address: appt.address,
        city: appt.city,
        zip: appt.zip,
        state: appt.state,
        trade: appt.trade,
        status: "APPOINTMENT_SET",
        source: "GHL",
        // An appointment they agreed to on a call IS an enquiry, so the
        // dialer window opens legitimately. Recorded with its source so the
        // record is evidence rather than a flag. See integrations/consent.ts.
        callConsentAt: new Date(),
        callConsentSource: "INBOUND_CALL",
      },
      select: { id: true, estimate: { select: { id: true, jobberJobId: true } } },
    }));

  const job = await createJob({
    clientId: null,
    customerName: appt.customerName,
    customerPhone: appt.customerPhone,
    customerEmail: appt.customerEmail,
    address: appt.address,
    city: appt.city,
    state: appt.state,
    zip: appt.zip,
    title: `${appt.trade ?? "Home improvement"} — ${appt.customerName}`,
    amount: 0, // priced by the field estimator, not by the calendar
    startsAt: appt.startsAt,
    custom: {
      state: appt.state,
      lenderApplicationUrl: null, // attached once an estimate exists
      assignedContractor: null,
      estimateId: lead.estimate?.id ?? "",
      requiresAdminOverride: false,
    },
  });

  if (!job.ok) {
    return res
      .status(job.retryable ? 502 : 400)
      .json({ error: job.error, retryable: job.retryable, leadId: lead.id });
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: { jobberClientId: job.clientId },
  });
  if (lead.estimate?.id) {
    await prisma.estimate.update({
      where: { id: lead.estimate.id },
      data: { jobberJobId: job.jobId },
    });
  }

  return res.status(200).json({ ok: true, leadId: lead.id, jobberJobId: job.jobId });
};

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
