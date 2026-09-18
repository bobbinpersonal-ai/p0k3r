import Link from "next/link";
import { notFound } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { prisma } from "@/lib/prisma";
import {
  CHANNEL_PARTNER_BONUS_MIN_CONTRACT_CENTS,
  CHANNEL_PARTNER_FEE_CENTS,
  JOURNEY_STEPS,
  MILESTONES,
  channelPartnerPayout,
  formatFee,
  journeyStage,
  parseServices,
} from "@/lib/regions/channelPartners";
import { noSaleShort } from "@/lib/regions/noSale";
import ShareListCard from "./ShareListCard";
import SubmitLeadCard from "./SubmitLeadCard";

// A channel partner's own view of where every customer they gave us has got
// to — the "you'll see what stage we're at" promise made on /channel-partners,
// kept literally rather than left as a marketing line.
//
// Looked up by the unguessable portalToken (see ChannelPartner.portalToken
// in prisma/schema.prisma), the same reasoning as /manage/[token]: this is a
// customer-service utility a partner might come back to for months, not
// something that should need a login system before it exists.
//
// Paid money and in-progress work are separated on purpose. A job is owed at
// SOLD and released at COMPLETED, and a partner who sees one figure labelled
// "earned" and then waits three weeks for it thinks they are being stalled.
// The in-progress tile counts jobs rather than showing dollars, because what
// a sold job pays depends on what it sold for — a number here would be a
// guess, and a guess revised downward later is worse than no number.
//
// The no-sale notes are the part that earns the rest of it. Everything above
// is us reporting our own wins; the reason a deal died is the thing a partner
// cannot verify and most needs to see.

const LEDGER_STATUSES = ["APPOINTMENT_SET", "SOLD", "COMPLETED", "NO_SALE"];

export default async function ChannelPartnerPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: params.token },
    include: {
      leads: {
        orderBy: { createdAt: "desc" },
        include: {
          noSaleReport: true,
          // Only what the split is worked out from. This is a server
          // component, so these figures are used to decide a label and
          // never rendered — a partner must not see our cost or what the
          // rep made on their referral.
          estimate: { select: { costTotal: true, baseTotal: true, soldPrice: true, commission: true } },
        },
      },
      payouts: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!partner) notFound();

  const paidCents = partner.payouts.reduce((sum, p) => sum + p.amount, 0);
  const soldCount = partner.leads.filter((l) => l.status === "SOLD").length;
  const completedCount = partner.leads.filter((l) => l.status === "COMPLETED").length;
  const services = parseServices(partner.services);

  const counts = new Map<string, number>();
  for (const lead of partner.leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }

  const reachedAppointment = partner.leads.some((l) =>
    ["APPOINTMENT_SET", "SOLD", "COMPLETED", "NO_SALE"].includes(l.status),
  );
  const everSold = soldCount + completedCount > 0;
  const earned: Record<string, boolean> = {
    LIST: Boolean(partner.customerListUrl) || partner.leads.length > 0,
    FIRST_APPOINTMENT: reachedAppointment,
    FIRST_SALE: everSold,
    FIRST_PAID: partner.payouts.length > 0,
    FIVE: completedCount >= 5,
    TEN: completedCount >= 10,
  };
  const earnedCount = MILESTONES.filter((m) => earned[m.value]).length;

  // Payouts carry a loose leadId rather than a relation (same shape as
  // WorkerPayout.estimateId), so the ledger joins them here.
  const payoutByLead = new Map(
    partner.payouts.filter((p) => p.leadId).map((p) => [p.leadId as string, p]),
  );
  const ledger = partner.leads.filter((l) => LEDGER_STATUSES.includes(l.status));

  return (
    <>
      <NetworkHeader />
      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
              Channel partner
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {partner.businessName}
            </h1>
            <p className="mt-2 text-neutral-300">
              Every customer you&apos;ve sent us, where each one has got to, and what it&apos;s
              paid you.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-2xl font-bold text-brand-cyan">
                  {formatFee(paidCents)}
                </p>
                <p className="mt-1 text-sm text-neutral-300">paid to you</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {completedCount} finished {completedCount === 1 ? "job" : "jobs"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-2xl font-bold text-ink">{soldCount}</p>
                <p className="mt-1 text-sm text-neutral-300">
                  sold, {soldCount === 1 ? "job" : "jobs"} in progress
                </p>
                <p className="mt-1 text-xs text-neutral-400">pays when finished</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-2xl font-bold text-ink">{partner.leads.length}</p>
                <p className="mt-1 text-sm text-neutral-300">customers from your list</p>
              </div>
            </div>

            {soldCount > 0 && (
              <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-neutral-300">
                A job is yours the day the customer signs, and pays out once the work is
                finished. The amount is worked out then — half the profit on the job, plus a{" "}
                {formatFee(CHANNEL_PARTNER_FEE_CENTS)} bonus if it came in over{" "}
                {formatFee(CHANNEL_PARTNER_BONUS_MIN_CONTRACT_CENTS)}.
              </p>
            )}

            {/* Progress markers. Weighted to the early ones because the doubt
                lives in the gap between sharing a list and the first cheque. */}
            <div className="mt-8">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-extrabold text-ink">Your progress</h2>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  {earnedCount} of {MILESTONES.length}
                </span>
              </div>
              <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {MILESTONES.map((milestone) => {
                  const done = earned[milestone.value];
                  return (
                    <li
                      key={milestone.value}
                      className={`rounded-xl border p-4 ${
                        done
                          ? "border-brand-cyan/40 bg-brand-cyan/10"
                          : "border-white/10 bg-white/[0.02]"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold ${done ? "text-brand-cyan" : "text-neutral-400"}`}
                      >
                        {done ? "Done" : "Not yet"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">{milestone.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                        {milestone.hint}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <SubmitLeadCard
                token={partner.portalToken}
                offeredServices={services.map((s) => s.value)}
              />
              <div className="space-y-6">
                <ShareListCard
                  token={partner.portalToken}
                  currentUrl={partner.customerListUrl}
                  sharedAt={partner.listSharedAt?.toISOString() ?? null}
                />
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h2 className="text-xl font-extrabold text-ink">Pitch it to your customers</h2>
                  <p className="mt-2 text-sm text-neutral-300">
                    Ready-made emails, texts and a printable one-pager for each service, with
                    your name on the introduction.
                  </p>
                  <Link
                    href={`/channel-partners/${partner.portalToken}/marketing`}
                    className="mt-4 inline-block rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-ink hover:border-brand hover:text-brand-cyan"
                  >
                    Open the marketing kit
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The pipeline at a glance, before the per-customer list. A partner
            checking in from a phone wants "how many are close" answered in one
            look, not counted off a list of two hundred rows. */}
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Where everyone is</h2>
            <ol className="mt-5 grid gap-3 sm:grid-cols-5">
              {JOURNEY_STEPS.map((stage) => (
                <li
                  key={stage.status}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                >
                  {/* No step number here, unlike the marketing page: next to a
                      count of customers, a second small number is just two
                      numbers to read instead of one. Order carries it. */}
                  <p className="font-mono text-2xl font-bold text-brand-cyan">
                    {counts.get(stage.status) ?? 0}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{stage.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{stage.hint}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* The ledger: every referral that got far enough to be worth money,
            what happened to it, and what it paid. This is the screen a partner
            opens when they are deciding whether to send us more. */}
        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Deals and payouts</h2>
            {ledger.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-300">
                Nothing has reached an appointment yet. As soon as one does, it shows here with
                what happened and what it paid.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {ledger.map((lead) => {
                  const stage = journeyStage(lead.status);
                  const payout = payoutByLead.get(lead.id);
                  const report = lead.noSaleReport;

                  // A finished job with no payout row yet is either waiting on
                  // us to send it or was sold at the base price, where there is
                  // no overage to split and nothing is coming. Saying "pays when
                  // finished" on a job that is already finished and owes nothing
                  // is the kind of quiet promise that costs a partner later —
                  // they wait, then call, then stop sending names.
                  let pendingLabel = stage.earning ? "Pays when finished" : stage.label;
                  if (lead.status === "COMPLETED") {
                    const e = lead.estimate;
                    const owes = e
                      ? channelPartnerPayout({
                          base: e.baseTotal,
                          sold: e.soldPrice,
                          grossProfit: e.soldPrice - e.costTotal - e.commission,
                        }).total > 0
                      : true;
                    pendingLabel = owes ? "Settling up" : "No overage to split";
                  }
                  return (
                    <div
                      key={lead.id}
                      className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="font-semibold text-ink">{lead.customerName}</p>
                        <span
                          className={`text-sm ${
                            stage.earning ? "font-bold text-brand-cyan" : "text-neutral-300"
                          }`}
                        >
                          {payout ? formatFee(payout.amount) : pendingLabel}
                        </span>
                      </div>
                      {(lead.city || lead.zip) && (
                        <p className="text-xs text-neutral-400">
                          {[lead.city, lead.zip].filter(Boolean).join(" · ")}
                        </p>
                      )}

                      {/* Why it died, in the rep's own words. The whole point. */}
                      {report && (
                        <div className="mt-3 rounded-lg border border-white/10 bg-paper/40 p-3">
                          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                            No sale — {noSaleShort(report.reason)}
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-neutral-300">
                            {report.detail}
                          </p>
                          <p className="mt-2 text-xs text-neutral-400">
                            {report.quotedAmount != null
                              ? `We quoted ${formatFee(report.quotedAmount * 100)}. `
                              : "We didn't reach a price. "}
                            Filed by {report.filedBy} on{" "}
                            {report.createdAt.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {report.revisitAt
                              ? ` · worth another go after ${report.revisitAt.toLocaleDateString(
                                  undefined,
                                  { month: "short", year: "numeric" },
                                )}`
                              : ""}
                            .
                          </p>
                          <Link
                            href={`/channel-partners/${partner.portalToken}/no-sale/${lead.id}`}
                            className="mt-2 inline-block text-xs font-semibold text-brand-cyan hover:text-ink"
                          >
                            Open the written confirmation →
                          </Link>
                        </div>
                      )}

                      {payout && (
                        <p className="mt-2 text-xs text-neutral-400">
                          Paid{" "}
                          {payout.paidAt.toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {payout.memo ? ` — ${payout.memo}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Everyone you&apos;ve sent</h2>
            {partner.leads.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-300">
                Nothing here yet. Send us one above, or share your whole list.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {partner.leads.map((lead) => {
                  const stage = journeyStage(lead.status);
                  return (
                    <div
                      key={lead.id}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{lead.customerName}</p>
                        {(lead.city || lead.zip) && (
                          <p className="text-xs text-neutral-400">
                            {[lead.city, lead.zip].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-sm ${
                          stage.earning ? "font-semibold text-brand-cyan" : "text-neutral-300"
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
