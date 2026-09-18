import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DISPOSITIONS, OPEN_DISPOSITIONS } from "@/lib/regions/dispositions";
import { getTrack, mayDial } from "@/lib/regions/warmup";
import DeskRow, { type DeskLead } from "./DeskRow";

// The desk.
//
// The screen somebody who is not the owner sits at to work the call list. It
// is the second handoff in the plan — the first job that leaves after B2B
// acquisition — and it exists so "who do I ring next" stops living on one
// person's phone.
//
// Ordered oldest-touched first so the list drains rather than getting picked
// over. A caller who can choose freely calls the easy ones twice and the
// awkward ones never.

export const metadata = { title: "Desk", robots: { index: false, follow: false } };

/** Stages where a call still makes sense. A sold job is not a dial. */
const LIVE_STAGES = ["NEW", "ASSIGNED", "APPOINTMENT_SET"];

function ago(date: Date | null, now: number): string | null {
  if (!date) return null;
  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default async function DeskPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const now = Date.now();

  const [leads, counts] = await Promise.all([
    prisma.lead.findMany({
      where: {
        status: { in: LIVE_STAGES },
        callDisposition: { in: OPEN_DISPOSITIONS },
      },
      // Never-called first, then whoever has waited longest.
      orderBy: [{ lastCalledAt: { sort: "asc", nulls: "first" } }, { createdAt: "asc" }],
      take: 100,
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        city: true,
        callDisposition: true,
        callCount: true,
        lastCalledAt: true,
        warmupStatus: true,
        channelPartner: { select: { businessName: true, warmupTrack: true } },
      },
    }),
    prisma.lead.groupBy({
      by: ["callDisposition"],
      where: { status: { in: LIVE_STAGES } },
      _count: true,
    }),
  ]);

  const rows: DeskLead[] = leads.map((l) => {
    const track = getTrack(l.channelPartner?.warmupTrack);
    return {
      id: l.id,
      customerName: l.customerName,
      phone: l.customerPhone,
      city: l.city,
      partner: l.channelPartner?.businessName ?? null,
      disposition: l.callDisposition,
      callCount: l.callCount,
      lastCalledLabel: ago(l.lastCalledAt, now),
      mayDial: mayDial(l.channelPartner?.warmupTrack, l.warmupStatus, Boolean(l.channelPartner)),
      waitingLabel: track.waitingLabel,
      warmupStatus: l.warmupStatus,
    };
  });

  // Two queues in one screen: who needs an introduction sending, and who is
  // ready to ring. Counting them separately because they are different jobs
  // and a desk with forty un-introduced names is not forty calls.
  const toIntroduce = rows.filter((r) => !r.mayDial).length;
  const callable = rows.length - toIntroduce;

  const countFor = (value: string) =>
    counts.find((c) => c.callDisposition === value)?._count ?? 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            Internal · desk
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
            Call queue <span className="font-mono text-neutral-400">({callable})</span>
          </h1>
        </div>
        <p className="flex flex-wrap gap-3 text-sm">
          <Link href="/admin/network/pipeline" className="text-brand-cyan hover:text-ink">
            Pipeline
          </Link>
          <Link href="/admin/network/partners" className="text-brand-cyan hover:text-ink">
            Partners
          </Link>
        </p>
      </div>

      {toIntroduce > 0 && (
        <p className="mt-4 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 px-4 py-2 text-sm font-semibold text-ink">
          {toIntroduce} {toIntroduce === 1 ? "customer needs" : "customers need"} an introduction
          before anyone rings them.
        </p>
      )}

      <dl className="mt-4 flex flex-wrap gap-2">
        {DISPOSITIONS.map((d) => (
          <div
            key={d.value}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5"
            title={d.label}
          >
            <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              {d.short}
            </dt>
            <dd className="font-mono text-base font-bold text-ink tabular-nums">
              {countFor(d.value)}
            </dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-300">
          Queue is clear. Everything live has been pitched or ruled out.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/15 text-left">
                {["Who", "Number", "Tries", ""].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap pb-2 pr-3 font-mono text-[10px] font-medium uppercase tracking-widest text-neutral-500 last:pr-0 last:text-right"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <DeskRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs leading-relaxed text-neutral-500">
        Oldest first, never-called at the top. Pitched and dead drop off. On a partner&apos;s warm-up
        track the number stays hidden until the introduction has actually sent — not just been
        attempted. Every press writes a call record with the time, and that log is what answers a
        curfew complaint later.
      </p>
    </main>
  );
}
