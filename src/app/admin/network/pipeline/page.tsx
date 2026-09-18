import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  JOURNEY_STEPS,
  channelPartnerPayout,
  journeyStage,
  marginCheck,
} from "@/lib/regions/channelPartners";
import PipelineControls, { type PipelineRow } from "./PipelineControls";

// The engine room: every live job, the stage it is at, and the button that
// moves it to the next one.
//
// This is the screen the business is actually run from. Leads come in from
// three places (the website form, a partner's submission, a bought list) and
// until this existed there was no way to move any of them — the pipeline had
// an input and no controls, so every referral sat on "we're calling" while the
// partner watched it not move.
//
// Money is computed here and shown before it is committed, then written by
// /api/admin/payouts, which recomputes it server-side rather than trusting
// what this page displayed.

export const metadata = { title: "Pipeline", robots: { index: false, follow: false } };

/**
 * The stages a job passes through while it is still the business's problem.
 *
 * NO_SALE and DEAD drop off — they have their own screen and nothing here can
 * move them. COMPLETED stays, because a finished job is exactly where the
 * payout is owed, and it keeps the confirmation on screen after it is sent.
 */
const LIVE = ["NEW", "ASSIGNED", "APPOINTMENT_SET", "SOLD", "COMPLETED"];

export default async function PipelinePage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const leads = await prisma.lead.findMany({
    where: { status: { in: LIVE } },
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      estimate: true,
      noSaleReport: { select: { id: true } },
      channelPartner: { select: { id: true, businessName: true } },
    },
  });

  const payouts = await prisma.channelPartnerPayout.findMany({
    where: { leadId: { in: leads.map((l) => l.id) } },
    select: { leadId: true, amount: true },
  });
  const paidByLead = new Map(payouts.map((p) => [p.leadId as string, p.amount]));

  const rows: PipelineRow[] = leads.map((lead) => {
    let quote: PipelineRow["quote"] = null;
    if (lead.estimate) {
      const { costTotal, baseTotal, soldPrice, commission } = lead.estimate;
      const result = channelPartnerPayout({
        base: baseTotal,
        sold: soldPrice,
        grossProfit: soldPrice - costTotal - commission,
        cost: costTotal,
        sellerCommission: commission,
      });
      const check = marginCheck(soldPrice, result.companyNet);
      quote = {
        sold: soldPrice,
        payout: result.total,
        grossProfit: result.breakdown.grossProfit,
        margin: check.margin,
        marginOk: check.ok,
      };
    }
    return {
      id: lead.id,
      customerName: lead.customerName,
      city: lead.city,
      zip: lead.zip,
      status: lead.status,
      partnerName: lead.channelPartner?.businessName ?? null,
      hasNoSaleNote: Boolean(lead.noSaleReport),
      quote,
      paidCents: paidByLead.get(lead.id) ?? null,
    };
  });

  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);

  // What is owed and not yet sent. The number that should be zero most days.
  //
  // A finished job only counts as owed if the split actually produced money.
  // A job sold at base has no overage to share, so nobody is owed anything on
  // it — counting it here would put a permanent "1 job waiting — $0 owed" on
  // the screen that no action can ever clear.
  const owed = rows.filter(
    (r) =>
      r.status === "COMPLETED" &&
      r.partnerName &&
      r.paidCents === null &&
      (r.quote?.payout ?? 0) > 0,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · network
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
        Pipeline <span className="font-mono text-neutral-400">({rows.length})</span>
      </h1>
      <p className="mt-2 max-w-2xl text-neutral-300">
        Every live job and the button that moves it. Partners see these stages on their own page
        as you change them here.
      </p>

      {owed.length > 0 && (
        <p className="mt-4 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 px-4 py-3 text-sm font-semibold text-ink">
          {owed.length} finished {owed.length === 1 ? "job is" : "jobs are"} waiting on a payout —
          ${owed.reduce((sum, r) => sum + (r.quote?.payout ?? 0), 0).toLocaleString("en-US")} owed.
        </p>
      )}

      <p className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/network/recruit" className="text-brand-cyan hover:text-ink">
          Recruit partners
        </Link>
        <Link href="/admin/network/partners" className="text-brand-cyan hover:text-ink">
          Partners
        </Link>
        <Link href="/admin/network/leads" className="text-brand-cyan hover:text-ink">
          All leads
        </Link>
        <Link href="/admin/network/no-sale" className="text-brand-cyan hover:text-ink">
          No-sale notes
        </Link>
      </p>

      <ol className="mt-6 grid gap-3 sm:grid-cols-5">
        {JOURNEY_STEPS.map((stage) => (
          <li key={stage.status} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-mono text-2xl font-bold text-brand-cyan">
              {counts.get(stage.status) ?? 0}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{stage.label}</p>
          </li>
        ))}
      </ol>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-300">
          Nothing live. Leads arrive from the website form, a partner&apos;s submission, or a
          bought list.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {rows.map((row) => {
            const stage = journeyStage(row.status);
            return (
              <article
                key={row.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <h2 className="font-bold text-ink">{row.customerName}</h2>
                    <p className="text-xs text-neutral-400">
                      {[row.city, row.zip].filter(Boolean).join(" · ") || "no location yet"}
                      {row.partnerName ? ` · via ${row.partnerName}` : " · direct"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
                      stage.earning
                        ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                        : "border-white/15 text-neutral-300"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                <PipelineControls row={row} />
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
