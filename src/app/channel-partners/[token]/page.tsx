import { notFound } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { prisma } from "@/lib/prisma";
import {
  CHANNEL_PARTNER_BONUS_MIN_CONTRACT_CENTS,
  CHANNEL_PARTNER_FEE_CENTS,
  JOURNEY_STEPS,
  formatFee,
  journeyStage,
} from "@/lib/regions/channelPartners";
import ShareListCard from "./ShareListCard";

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

export default async function ChannelPartnerPortalPage({
  params,
}: {
  params: { token: string };
}) {
  const partner = await prisma.channelPartner.findUnique({
    where: { portalToken: params.token },
    include: {
      leads: { orderBy: { createdAt: "desc" } },
      payouts: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!partner) notFound();

  const paidCents = partner.payouts.reduce((sum, p) => sum + p.amount, 0);
  const soldCount = partner.leads.filter((l) => l.status === "SOLD").length;
  const completedCount = partner.leads.filter((l) => l.status === "COMPLETED").length;

  // Nothing owed is knowable from these rows — both halves of the deal depend
  // on what each job actually sold for, and that lives on the estimate, not
  // here. So the tile counts jobs rather than inventing a number, which is
  // also the honest thing: a figure we later revise downward is worse than no
  // figure at all.

  const counts = new Map<string, number>();
  for (const lead of partner.leads) {
    counts.set(lead.status, (counts.get(lead.status) ?? 0) + 1);
  }

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

            <div className="mt-8">
              <ShareListCard
                token={partner.portalToken}
                currentUrl={partner.customerListUrl}
                sharedAt={partner.listSharedAt?.toISOString() ?? null}
              />
            </div>
          </div>
        </section>

        {/* The pipeline at a glance, before the per-customer list. A partner
            checking in from a phone wants "how many are close" answered in one
            look, not counted off a list of two hundred rows. */}
        <section className="border-b border-white/10 bg-surface">
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

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Your customers</h2>
            {partner.leads.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-300">
                Nothing here yet — once we&apos;ve called anyone off your list, they&apos;ll show
                up here with where they got to.
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

        <section>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Your payouts</h2>
            {partner.payouts.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-300">
                Nothing paid out yet. The first one lands the day a job off your list is
                finished — half the profit on it, plus a {formatFee(CHANNEL_PARTNER_FEE_CENTS)}{" "}
                bonus on anything over {formatFee(CHANNEL_PARTNER_BONUS_MIN_CONTRACT_CENTS)}.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {partner.payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <span className="text-sm text-neutral-300">
                      {payout.paidAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {payout.memo ? ` — ${payout.memo}` : ""}
                    </span>
                    <span className="font-mono font-bold text-brand-cyan">
                      {formatFee(payout.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <NetworkFooter />
    </>
  );
}
