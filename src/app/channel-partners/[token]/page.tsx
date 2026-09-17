import { notFound } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { prisma } from "@/lib/prisma";
import { CHANNEL_PARTNER_FEE_CENTS, formatFee } from "@/lib/regions/channelPartners";
import ShareListCard from "./ShareListCard";

// A channel partner's own view of what happened to the customers they gave
// us — the "you'll see the lead, and what happens to it" promise made on
// /channel-partners, kept literally rather than left as a marketing line.
//
// Looked up by the unguessable portalToken (see ChannelPartner.portalToken
// in prisma/schema.prisma), the same reasoning as /manage/[token]: this is a
// customer-service utility a partner might come back to for months, not
// something that should need a login system before it exists.

const STATUS_LABEL: Record<string, string> = {
  NEW: "Just added, not called yet",
  ASSIGNED: "Being worked",
  APPOINTMENT_SET: "Appointment booked",
  SOLD: "Closed — job sold",
  NO_SALE: "Quoted, no sale",
  DEAD: "Couldn't reach, or not interested",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

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

  const totalEarnedCents = partner.payouts.reduce((sum, p) => sum + p.amount, 0);
  const soldCount = partner.leads.filter((l) => l.status === "SOLD").length;

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
              Every customer you&apos;ve given us, and what happened with each one.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-2xl font-bold text-brand-cyan">
                  {formatFee(totalEarnedCents)}
                </p>
                <p className="mt-1 text-sm text-neutral-300">earned so far</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-2xl font-bold text-brand-cyan">{soldCount}</p>
                <p className="mt-1 text-sm text-neutral-300">jobs closed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="font-mono text-2xl font-bold text-brand-cyan">{partner.leads.length}</p>
                <p className="mt-1 text-sm text-neutral-300">customers from your list</p>
              </div>
            </div>

            <div className="mt-8">
              <ShareListCard
                token={partner.portalToken}
                currentUrl={partner.customerListUrl}
                sharedAt={partner.listSharedAt?.toISOString() ?? null}
              />
            </div>
          </div>
        </section>

        <section className="border-b border-white/10 bg-surface">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Your customers</h2>
            {partner.leads.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-300">
                Nothing here yet — once we&apos;ve called anyone off your list, they&apos;ll show up here.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {partner.leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <span className="font-medium text-ink">{lead.customerName}</span>
                    <span className="text-sm text-neutral-300">{statusLabel(lead.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-xl font-extrabold text-ink">Your payouts</h2>
            {partner.payouts.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-300">
                Nothing paid out yet — the first {formatFee(CHANNEL_PARTNER_FEE_CENTS)} shows up here the day a job closes.
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
