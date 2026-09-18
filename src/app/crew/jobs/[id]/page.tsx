import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCrew } from "@/lib/crewAuth";
import { COMPANY } from "@/lib/regions/brand";
import { railsFor } from "@/lib/regions/payments";
import { TRADES } from "@/lib/regions/trades";
import Estimator from "./Estimator";

// One job, from measuring it to a signed contract with money against it.
//
// The price book is passed down rather than fetched by the client: the crew is
// standing in somebody's kitchen on whatever signal the house has, and a page
// that needs a second round trip before it can show a price is a page that
// loses the sale.

export const metadata = { title: "Price a job", robots: { index: false, follow: false } };

export default async function CrewJobPage({ params }: { params: { id: string } }) {
  const crew = await requireCrew();

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      workerId: true,
      customerName: true,
      customerPhone: true,
      address: true,
      city: true,
      zip: true,
      trade: true,
      requestedTrades: true,
      notes: true,
      status: true,
      estimate: { select: { id: true, soldPrice: true, commission: true } },
    },
  });

  // Somebody else's job is not found, not forbidden — a crew guessing at ids
  // should not learn that a job exists.
  if (!lead || lead.workerId !== crew.id) notFound();

  return (
    <div className="recruit min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link href="/crew" className="rc-accent font-mono text-sm">
            ← Jobs
          </Link>
          <span className="ml-auto truncate text-sm font-semibold text-ink">
            {lead.customerName}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">
          {lead.trade || "Home improvement"}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
          {lead.customerName}
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          {[lead.address, lead.city, lead.zip].filter(Boolean).join(", ") || "address to confirm"}
        </p>
        {lead.customerPhone && (
          <a
            href={`tel:${lead.customerPhone.replace(/[^\d+]/g, "")}`}
            className="rc-accent mt-2 inline-block font-mono text-sm"
          >
            {lead.customerPhone}
          </a>
        )}

        {lead.notes && (
          <p className="mt-4 whitespace-pre-line rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-neutral-300">
            {lead.notes}
          </p>
        )}

        {lead.estimate ? (
          <div className="rc-border rc-fill mt-6 rounded-2xl border p-5">
            <p className="rc-accent font-mono text-xs uppercase tracking-[0.2em]">Sold</p>
            <p className="mt-2 font-mono text-3xl font-bold text-ink tabular-nums">
              ${lead.estimate.soldPrice.toLocaleString("en-US")}
            </p>
            <p className="rc-accent mt-1 font-mono text-sm tabular-nums">
              +${lead.estimate.commission.toLocaleString("en-US")} to you
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-300">
              This one is written up. If something changed, call the office on {COMPANY.phone} —
              an estimate is a contract once it is signed and it is not edited from here.
            </p>
          </div>
        ) : (
          <Estimator
            leadId={lead.id}
            customerName={lead.customerName}
            trades={TRADES.map((t) => ({
              value: t.value,
              label: t.label,
              unit: t.unit,
              minimumUnits: t.minimumUnits,
              implausibleAbove: t.implausibleAbove,
              excludes: [...t.excludes],
              options: t.options.map((o) => ({
                value: o.value,
                label: o.label,
                tier: o.tier,
                brand: o.brand,
                description: o.description,
                costPerUnit: o.costPerUnit,
                basePerUnit: o.basePerUnit,
                sellingPoints: [...o.sellingPoints],
              })),
            }))}
            rails={railsFor(10_000).map((r) => ({
              value: r.value,
              label: r.label,
              note: r.note,
            }))}
            w9OnFile={crew.w9OnFile}
          />
        )}
      </main>
    </div>
  );
}
