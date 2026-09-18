import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCrew } from "@/lib/crewAuth";
import { COMPANY } from "@/lib/regions/brand";
import { CONTRACTOR_OVERAGE_RATE } from "@/lib/regions/commission";
import CrewSignOut from "./CrewSignOut";

// A crew's jobs.
//
// The list a contractor opens in a truck outside a house. Live jobs first and
// nothing else above the fold — a crew looking at this has somewhere to be.

export const metadata = { title: "Your jobs", robots: { index: false, follow: false } };

const LIVE = ["NEW", "ASSIGNED", "APPOINTMENT_SET"];

export default async function CrewHome() {
  const crew = await requireCrew();

  const [toSell, sold] = await Promise.all([
    prisma.lead.findMany({
      where: { workerId: crew.id, status: { in: LIVE } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: { id: true, customerName: true, address: true, city: true, zip: true, trade: true, status: true },
    }),
    prisma.lead.findMany({
      where: { workerId: crew.id, status: { in: ["SOLD", "COMPLETED"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        customerName: true,
        city: true,
        status: true,
        estimate: { select: { soldPrice: true, commission: true, depositAmount: true } },
      },
    }),
  ]);

  const earned = sold.reduce((sum, l) => sum + (l.estimate?.commission ?? 0), 0);

  return (
    <div className="recruit min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <span className="text-base font-extrabold tracking-tight text-ink">{COMPANY.name}</span>
          <span className="rc-accent font-mono text-xs uppercase tracking-[0.2em]">/ crew</span>
          <CrewSignOut />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="rc-accent font-mono text-xs uppercase tracking-[0.22em]">{crew.name}</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Your jobs</h1>

        {!crew.w9OnFile && (
          <p className="mt-4 rounded-xl border border-brand/50 bg-brand/10 px-4 py-3 text-sm text-ink">
            <b>We need your W-9 before you can write an estimate.</b> Call the office on{" "}
            {COMPANY.phone} and it takes two minutes.
          </p>
        )}

        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          <div className="bg-paper p-5">
            <p className="rc-accent font-mono text-3xl font-bold tabular-nums">{toSell.length}</p>
            <p className="mt-1 text-sm text-neutral-300">to go and price</p>
          </div>
          <div className="bg-paper p-5">
            <p className="rc-accent font-mono text-3xl font-bold tabular-nums">
              ${earned.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              earned selling, on top of the work
            </p>
          </div>
        </div>

        <h2 className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
          Go and price these
        </h2>
        {toSell.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-neutral-400">
            Nothing assigned right now. The office puts jobs here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {toSell.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/crew/jobs/${l.id}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 hover:border-[color:var(--rc-dim)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">{l.customerName}</p>
                    <p className="truncate text-sm text-neutral-400">
                      {[l.address, l.city, l.zip].filter(Boolean).join(", ") || "address on the call"}
                    </p>
                    {l.trade && (
                      <p className="rc-accent mt-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                        {l.trade}
                      </p>
                    )}
                  </div>
                  <span className="rc-accent shrink-0 font-mono text-sm">Price it →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {sold.length > 0 && (
          <>
            <h2 className="mt-10 font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
              Sold
            </h2>
            <ul className="mt-3 space-y-2">
              {sold.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-ink">{l.customerName}</p>
                    <p className="text-xs text-neutral-400">
                      {l.city} · {l.status === "COMPLETED" ? "finished" : "sold"}
                      {l.estimate?.depositAmount
                        ? ` · $${l.estimate.depositAmount.toLocaleString("en-US")} deposit taken`
                        : " · no deposit yet"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold text-ink tabular-nums">
                      ${(l.estimate?.soldPrice ?? 0).toLocaleString("en-US")}
                    </p>
                    <p className="rc-accent font-mono text-xs tabular-nums">
                      +${(l.estimate?.commission ?? 0).toLocaleString("en-US")} you
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-neutral-500">
          You keep {Math.round(CONTRACTOR_OVERAGE_RATE * 100)}% of anything you sell above the floor,
          on top of the price for the work. Every dollar the homeowner pays goes through the company —
          never take cash, a cheque or a transfer directly.
        </p>
      </main>
    </div>
  );
}
