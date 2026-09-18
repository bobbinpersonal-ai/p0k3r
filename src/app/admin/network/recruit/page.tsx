import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { siteOrigin } from "@/lib/siteOrigin";
import { REGIONS } from "@/lib/regions/states";
import {
  OBJECTIONS,
  OPEN_PROSPECT_DISPOSITIONS,
  PARTNER_SHORT_PATH,
  PROSPECT_TRADES,
  TYPICAL_PER_JOB,
  WHERE_TO_FIND,
} from "@/lib/regions/partnerProspects";
import { CHANNEL_PARTNER_PROFIT_SHARE } from "@/lib/regions/channelPartners";
import CallConsole, { type Prospect } from "./CallConsole";
import AddProspects from "./AddProspects";

// The partner acquisition hub.
//
// One screen for the only activity that grows this business: ringing
// contractors and asking for their customer list. Everything needed to make
// that call is on it — who to ring, the number, what to say, what to say when
// they push back, the link to send, and the button that records what happened.
//
// The design constraint is that this is the job the owner does before there is
// anyone to delegate it to, sitting down with an hour and a phone. So it is
// ordered for that hour: the queue first, the script beside it, and the
// list-building tools below where they will not distract from dialling.
//
// Calling these businesses is B2B and sits outside the National Do Not Call
// Registry and most of the TSR — see the header comment in partnerProspects.ts
// for what still applies. That is the opposite of /admin/desk, which calls
// homeowners and is gated to the teeth.

export const metadata = { title: "Partner recruiting", robots: { index: false, follow: false } };

const SHARE_PCT = Math.round(CHANNEL_PARTNER_PROFIT_SHARE * 100);

function ago(date: Date | null, now: number): string | null {
  if (!date) return null;
  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * How long until a callback is due.
 *
 * Days are rounded rather than floored, and computed from minutes rather than
 * from already-floored hours. Doing it the other way made a callback set for
 * two days' time read "due in 1d" for all but the first hour of its window,
 * which is the kind of quiet lie that gets somebody rung a day early.
 */
function until(date: Date | null, now: number): string | null {
  if (!date) return null;
  const mins = Math.floor((date.getTime() - now) / 60000);
  if (mins <= 0) return "now";
  if (mins < 60) return `in ${mins}m`;
  if (mins < 60 * 24) return `in ${Math.round(mins / 60)}h`;
  return `in ${Math.round(mins / (60 * 24))}d`;
}

export default async function RecruitPage({
  searchParams,
}: {
  searchParams?: { state?: string; trade?: string };
}) {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const now = Date.now();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const states = REGIONS.map((r) => ({ code: r.code as string, name: r.name }));
  const stateParam = (searchParams?.state ?? "").toUpperCase();
  const state = states.some((s) => s.code === stateParam) ? stateParam : null;
  const tradeParam = searchParams?.trade ?? "";
  const trade = PROSPECT_TRADES.some((t) => t.value === tradeParam) ? tradeParam : null;

  const base = {
    status: "PROSPECT",
    callDisposition: { in: OPEN_PROSPECT_DISPOSITIONS },
    ...(state ? { state } : {}),
    ...(trade ? { industry: trade } : {}),
  };

  // Only what is actually due.
  //
  // This is what makes the cadence a cadence rather than a list with dates on
  // it. A prospect texted an hour ago with a call booked for Thursday should
  // not be sitting between two fresh names today — if everything shows at
  // once, the sequence is just decoration and whoever is calling works the
  // top of the list until they get bored.
  //
  // followUpAt null means untouched, which is due by definition.
  const where = {
    ...base,
    OR: [{ followUpAt: null }, { followUpAt: { lte: new Date() } }],
  };

  const [prospects, todayCalls, signedCount, totalOpen, scheduledLater] = await Promise.all([
    prisma.channelPartner.findMany({
      where,
      // Longest overdue first, then never-touched, then oldest on the list. A
      // queue somebody can pick freely through is a queue where the awkward
      // names never get rung, so the ordering does the choosing.
      orderBy: [
        { followUpAt: { sort: "asc", nulls: "last" } },
        { lastCalledAt: { sort: "asc", nulls: "first" } },
        { createdAt: "asc" },
      ],
      take: 200,
      select: {
        id: true,
        businessName: true,
        contactName: true,
        phone: true,
        email: true,
        industry: true,
        city: true,
        state: true,
        approxListSize: true,
        notes: true,
        callDisposition: true,
        callCount: true,
        cadenceStep: true,
        lastCalledAt: true,
        followUpAt: true,
      },
    }),
    prisma.partnerCall.groupBy({
      by: ["outcome"],
      where: { createdAt: { gte: startOfDay } },
      _count: { _all: true },
    }),
    prisma.channelPartner.count({ where: { status: { not: "PROSPECT" }, source: "COLD_CALL" } }),
    prisma.channelPartner.count({ where: base }),
    prisma.channelPartner.count({
      where: { ...base, followUpAt: { gt: new Date() } },
    }),
  ]);

  const dialsToday = todayCalls.reduce((sum, r) => sum + r._count._all, 0);
  const countOf = (o: string) => todayCalls.find((r) => r.outcome === o)?._count._all ?? 0;
  const conversationsToday = countOf("SENT_LINK") + countOf("CALLBACK") + countOf("NOT_NOW") + countOf("SIGNED_UP");
  const linksToday = countOf("SENT_LINK");

  // The short alias, not the canonical path.
  //
  // This URL is read off a phone screen on a jobsite and, often enough, typed
  // by hand from something said out loud on the call. See the note on
  // PARTNER_SHORT_PATH for why it is digits.
  const signupUrl = `${siteOrigin()}${PARTNER_SHORT_PATH}`;

  const rows: Prospect[] = prospects.map((p) => ({
    id: p.id,
    businessName: p.businessName,
    contactName: p.contactName,
    phone: p.phone,
    email: p.email,
    trade: p.industry,
    city: p.city,
    state: p.state,
    approxListSize: p.approxListSize,
    notes: p.notes,
    disposition: p.callDisposition,
    callCount: p.callCount,
    cadenceStep: p.cadenceStep,
    lastCalledLabel: ago(p.lastCalledAt, now),
    dueLabel: until(p.followUpAt, now),
  }));


  const stat = (label: string, value: string | number, hint?: string) => (
    <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide ${
      active
        ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
        : "border-white/15 text-neutral-400 hover:border-brand-cyan/50 hover:text-ink"
    }`;

  const qs = (next: { state?: string | null; trade?: string | null }) => {
    const params = new URLSearchParams();
    const s = next.state === undefined ? state : next.state;
    const t = next.trade === undefined ? trade : next.trade;
    if (s) params.set("state", s);
    if (t) params.set("trade", t);
    const q = params.toString();
    return q ? `/admin/network/recruit?${q}` : "/admin/network/recruit";
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
            Partner acquisition
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
            Sign contractors to the network
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Every one you sign is a customer list you never have to buy. Offer:{" "}
            {SHARE_PCT}% of the profit, about ${TYPICAL_PER_JOB.toLocaleString("en-US")} a job.
          </p>
        </div>
        <Link
          href="/admin/network/partners"
          className="text-sm font-semibold text-neutral-300 underline underline-offset-4 hover:text-ink"
        >
          Partners already signed →
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stat("Dials today", dialsToday)}
        {stat("Conversations", conversationsToday, "reached the owner")}
        {stat("Links sent", linksToday)}
        {stat("Signed, all time", signedCount, "from cold calls")}
      </div>

      {/* State first, because he is working one market at a time and Colorado
          is the one that is live. */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          State
        </span>
        <Link href={qs({ state: null })} className={chip(!state)}>
          All
        </Link>
        {states.map((s) => (
          <Link key={s.code} href={qs({ state: s.code })} className={chip(state === s.code)}>
            {s.code}
          </Link>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Trade
        </span>
        <Link href={qs({ trade: null })} className={chip(!trade)}>
          All
        </Link>
        {PROSPECT_TRADES.map((t) => (
          <Link key={t.value} href={qs({ trade: t.value })} className={chip(trade === t.value)}>
            {t.label.split(" & ")[0]}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-extrabold text-ink">
            Working {state ? `· ${state}` : "· everywhere"}
          </h2>
          <span className="font-mono text-xs text-neutral-500">
            {rows.length} due now · {scheduledLater} booked later · {totalOpen} in sequence
          </span>
        </div>
        <div className="mt-4">
          <CallConsole
            queue={rows}
            signupUrl={signupUrl}
            objections={OBJECTIONS}
            scheduledLater={scheduledLater}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AddProspects states={states} />

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-bold text-ink">Where to get names</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Not a bought list. Every source below produces a shop that is demonstrably working
            right now, which is the only filter that matters.
          </p>
          <dl className="mt-4 space-y-3">
            {WHERE_TO_FIND.map((w) => (
              <div key={w.source} className="rounded-xl border border-white/10 bg-paper/40 p-3">
                <dt className="text-sm font-bold text-ink">{w.source}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-neutral-400">{w.how}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-bold text-ink">Who to call, best first</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Ordered by how warm the list is, not how big the trade is. The asset being borrowed is
          the customer&apos;s memory of them.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROSPECT_TRADES.map((t) => (
            <div key={t.value} className="rounded-xl border border-white/10 bg-paper/40 p-3">
              <p className="text-sm font-bold text-ink">{t.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">{t.why}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-brand-cyan">
                {t.typicalList} customers
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* The rule that makes this safe to do today, stated where it is used
          rather than left in a doc. */}
      <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
        <h2 className="font-mono text-xs uppercase tracking-widest text-amber-500/90">
          What the rules are here
        </h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-300">
          <li>
            <strong className="text-ink">These calls are B2B.</strong> The National Do Not Call
            Registry covers residential subscribers, and most business-to-business calls sit
            outside the FTC&apos;s Telemarketing Sales Rule. No registration, no list to buy, no
            warm-up needed. This is the opposite of the homeowner desk.
          </li>
          <li>
            <strong className="text-ink">Dial by hand, always.</strong> The TCPA&apos;s rule on
            automated dialling to a mobile has no B2B exemption, and a contractor&apos;s
            &ldquo;office&rdquo; number is very often a cell.
          </li>
          <li>
            <strong className="text-ink">Keep it about their business.</strong> The offer is paid
            to the company, not to the person, which is what keeps it a business call.
          </li>
          <li>
            <strong className="text-ink">Don&apos;t promise their list will earn a number.</strong>{" "}
            ${TYPICAL_PER_JOB.toLocaleString("en-US")} is our average per job and is worth saying;
            what their list will produce is not something anyone can substantiate.
          </li>
        </ul>
      </div>
    </main>
  );
}
