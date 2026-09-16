import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTradeLabel } from "@/lib/texas/trades";

// Where the leads actually are.
//
// The site went live collecting these into a table with no screen and no
// notification, which meant a homeowner could fill the form in and nobody
// would ever know. This is the other half of that fix.

export const metadata = { title: "Texas leads", robots: { index: false, follow: false } };

function ago(date: Date, now: number): string {
  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function TexasLeadsPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { rep: true },
  });
  const now = Date.now();
  const applicants = await prisma.rep.count({ where: { status: "APPLIED" } });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">Internal · Texas</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
        Leads <span className="font-mono text-neutral-400">({leads.length})</span>
      </h1>
      <p className="mt-2 text-sm text-neutral-300">
        Everyone who filled in the form on the website. Speed to lead is most of the conversion
        on this — call them today.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 font-mono text-xs uppercase tracking-widest">
        <Link href="/admin/tx/products" className="text-brand-cyan underline">Products &amp; pricing</Link>
        <Link href="/admin/tx/crews" className="text-neutral-300 underline">Crews</Link>
        <Link href="/admin/dashboard" className="text-neutral-300 underline">Dispatch board</Link>
        {applicants > 0 && (
          <span className="text-brand-cyan">{applicants} sales applicant{applicants === 1 ? "" : "s"} waiting</span>
        )}
      </div>

      {leads.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-white/15 p-8 text-center text-neutral-400">
          No leads yet. They land here the moment somebody submits the form.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{lead.customerName}</p>
                  <a href={`tel:${lead.customerPhone}`} className="font-mono text-sm text-brand-cyan">
                    {lead.customerPhone}
                  </a>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-neutral-300">
                    {ago(lead.createdAt, now)}
                  </span>
                  {lead.jobKind === "INSURANCE" && (
                    <span className="rounded-full border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-xs text-brand-cyan">
                      Insurance
                    </span>
                  )}
                  {/* Whether we may lawfully text them, where the person about
                      to do it will see it. */}
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-xs ${
                      lead.consentAt
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : "border-white/15 text-neutral-400"
                    }`}
                  >
                    {lead.consentAt ? "May call & text" : "No consent"}
                  </span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-xs text-neutral-300">
                    {lead.status}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-sm text-neutral-200">{lead.address}</p>
              <p className="mt-1 text-sm text-neutral-400">
                Wants: {lead.trade ? getTradeLabel(lead.trade) : "not sure — wants somebody to look"}
                {lead.source ? ` · from ${lead.source}` : ""}
                {lead.rep ? ` · assigned to ${lead.rep.name}` : ""}
              </p>
              {lead.notes && <p className="mt-1 text-sm text-neutral-400">{lead.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
