import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTradeLabel } from "@/lib/regions/trades";

// The crew roster, applicants first.
//
// Built around the three gates rather than around the person, because the
// three gates are what decide whether a crew can be given a job: a certificate
// of general liability, a W-9, and a deliberate answer on workers' comp. A
// crew missing any of them is not a crew we can dispatch, and the screen says
// so in the row rather than leaving it to somebody's memory.
//
// Note what the badges mean. The application records what a crew *claimed*;
// the flags record what somebody has actually seen. They start out
// disagreeing on purpose — "says they have GL" is a conversation, "GL on file"
// is a document.

export const metadata = { title: "Crews", robots: { index: false, follow: false } };

function ago(date: Date, now: number): string {
  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
        ok
          ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
          : "border-red-500/40 bg-red-500/10 text-red-300"
      }`}
    >
      {ok ? label : `No ${label.toLowerCase()}`}
    </span>
  );
}

export default async function CrewsPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const crews = await prisma.worker.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });
  const now = Date.now();
  const applied = crews.filter((c) => c.status === "APPLIED");
  const dispatchable = crews.filter(
    (c) => c.status === "ACTIVE" && c.generalLiabilityOnFile && c.w9OnFile,
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Internal · network</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
        Crews <span className="font-mono text-neutral-400">({crews.length})</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-300">
        Everyone who applied at{" "}
        <Link href="/crew" className="text-brand-cyan underline">/crew</Link>, and everyone
        already installing. A crew can only be given a job once somebody has actually seen a
        certificate and a W-9 — the badges below track documents, not promises.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-widest">
        <Link href="/admin/network/leads" className="text-neutral-300 underline">Leads</Link>
        <Link href="/admin/network/paperwork?doc=crew" className="text-brand-cyan underline">Subcontractor agreement</Link>
        <Link href="/admin/dashboard" className="text-neutral-300 underline">Dispatch board</Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Waiting on a call</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{applied.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Ready to dispatch</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{dispatchable.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Carrying workers&apos; comp</p>
          <p className="mt-1 text-2xl font-extrabold text-ink">
            {crews.filter((c) => c.workersCompOnFile).length}
          </p>
        </div>
      </div>

      {crews.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-white/15 p-8 text-center text-neutral-400">
          No crews yet. Applications from <Link href="/crew" className="text-brand-cyan underline">/crew</Link>{" "}
          land here the moment somebody submits the form.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {crews.map((crew) => (
            <article
              key={crew.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold text-ink">
                  {crew.name}
                  {crew.status === "APPLIED" && (
                    <span className="ml-2 rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brand-cyan">
                      Applicant
                    </span>
                  )}
                </h2>
                <p className="font-mono text-xs text-neutral-400">{ago(crew.createdAt, now)}</p>
              </div>

              <p className="mt-1 font-mono text-sm text-neutral-300">
                {crew.phone ? (
                  <a href={`tel:${crew.phone.replace(/[^\d+]/g, "")}`} className="text-brand-cyan">
                    {crew.phone}
                  </a>
                ) : (
                  "No phone"
                )}
                {crew.city ? ` · ${crew.city}` : ""}
                {crew.language ? ` · ${crew.language}` : ""}
              </p>

              {crew.trades && (
                <p className="mt-2 text-sm text-neutral-200">
                  {crew.trades
                    .split(",")
                    .map((t) => getTradeLabel(t) ?? t)
                    .join(" · ")}
                </p>
              )}

              <p className="mt-1 text-sm text-neutral-400">
                {[
                  crew.crewSize ? `${crew.crewSize} on the crew` : null,
                  crew.dailyCapacity ? `${crew.dailyCapacity} squares a day (their number)` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge ok={crew.generalLiabilityOnFile} label="GL on file" />
                <Badge ok={crew.w9OnFile} label="W-9 on file" />
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                    crew.workersCompOnFile
                      ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                      : "border-white/15 text-neutral-400"
                  }`}
                >
                  {crew.workersCompOnFile ? "Workers' comp" : "No workers' comp"}
                </span>
                {crew.insuranceExpiresAt && (
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
                      crew.insuranceExpiresAt.getTime() < now
                        ? "border-red-500/40 bg-red-500/10 text-red-300"
                        : "border-white/15 text-neutral-400"
                    }`}
                  >
                    {crew.insuranceExpiresAt.getTime() < now ? "Insurance expired" : `Insured to ${crew.insuranceExpiresAt.toLocaleDateString("en-US")}`}
                  </span>
                )}
              </div>

              {crew.experience && (
                <p className="mt-3 text-sm leading-relaxed text-neutral-300">{crew.experience}</p>
              )}
              {crew.notes && (
                <p className="mt-2 text-xs leading-relaxed text-neutral-400">{crew.notes}</p>
              )}

              {!crew.generalLiabilityOnFile && (
                <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-ink">
                  No certificate of general liability has been seen. This crew cannot be put on a
                  customer&apos;s roof — if they damage something, the claim lands on you.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
