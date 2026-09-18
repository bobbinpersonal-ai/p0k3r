import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatFee, parseServices } from "@/lib/regions/channelPartners";
import CreatePartner from "./CreatePartner";
import PartnerLinks from "./PartnerLinks";

// The channel partner roster, and the only place their portal links live.
//
// Built because a partner's link is generated once, shown on screen the moment
// they finish the form, and then exists nowhere a human can reach — so a
// partner who closed that tab was unrecoverable without a database query. That
// is a bad failure for the one asset that makes this program work.
//
// Ordered by what needs doing rather than by name: applicants first, then
// partners who signed up and never sent a list, then everyone else. The point
// of opening this screen is almost always "who am I chasing".

export const metadata = { title: "Channel partners", robots: { index: false, follow: false } };

function ago(date: Date, now: number): string {
  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}

export default async function ChannelPartnersAdminPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const partners = await prisma.channelPartner.findMany({
    // Prospects live on the same table so a cold call that says yes needs no
    // migration — but they are not partners and must never pad this page. The
    // queue of people we are still chasing is /admin/network/recruit.
    where: { status: { not: "PROSPECT" } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      leads: { select: { status: true } },
      payouts: { select: { amount: true } },
    },
  });
  const now = Date.now();

  const rows = partners.map((p) => {
    const sold = p.leads.filter((l) => l.status === "SOLD").length;
    const completed = p.leads.filter((l) => l.status === "COMPLETED").length;
    return {
      partner: p,
      sold,
      completed,
      paid: p.payouts.reduce((sum, x) => sum + x.amount, 0),
      hasList: Boolean(p.customerListUrl),
      // The state worth chasing: they said yes and then nothing arrived.
      stalled: p.leads.length === 0 && !p.customerListUrl,
    };
  });

  // Applicants first, then signed-up-but-silent, then the rest by recency.
  const rank = (r: (typeof rows)[number]) =>
    r.partner.status === "APPLIED" ? 0 : r.stalled ? 1 : 2;
  rows.sort((a, b) => rank(a) - rank(b));

  const applicants = rows.filter((r) => r.partner.status === "APPLIED").length;
  const stalled = rows.filter((r) => r.stalled && r.partner.status !== "APPLIED").length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · network
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
        Channel partners <span className="font-mono text-neutral-400">({rows.length})</span>
      </h1>
      <p className="mt-2 max-w-2xl text-neutral-300">
        Every business that signed up to send us their customers, and their private links. This
        is the only place those links are recoverable — a partner who loses theirs gets it from
        here.
      </p>

      {(applicants > 0 || stalled > 0) && (
        <div className="mt-4 flex flex-wrap gap-3">
          {applicants > 0 && (
            <p className="rounded-xl border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-ink">
              {applicants} {applicants === 1 ? "applicant" : "applicants"} to call back
            </p>
          )}
          {stalled > 0 && (
            <p className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-neutral-200">
              {stalled} signed up but sent nothing
            </p>
          )}
        </div>
      )}

      <p className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/network/recruit" className="text-brand-cyan hover:text-ink">
          Recruit more partners
        </Link>
        <Link href="/admin/network/leads" className="text-brand-cyan hover:text-ink">
          Leads
        </Link>
        <Link href="/admin/network/no-sale" className="text-brand-cyan hover:text-ink">
          No-sale notes
        </Link>
        <Link href="/admin/network/crews" className="text-brand-cyan hover:text-ink">
          Crews
        </Link>
      </p>

      <CreatePartner />

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-300">
          Nobody has signed up yet. They arrive here from the form on{" "}
          <Link href="/channel-partners" className="text-brand-cyan">
            /channel-partners
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.map(({ partner, sold, completed, paid, hasList, stalled: isStalled }) => {
            const services = parseServices(partner.services);
            return (
              <article
                key={partner.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-ink">{partner.businessName}</h2>
                    <p className="text-sm text-neutral-300">
                      {partner.contactName} ·{" "}
                      <a href={`tel:${partner.phone.replace(/[^\d+]/g, "")}`} className="font-mono text-brand-cyan">
                        {partner.phone}
                      </a>
                      {partner.email ? (
                        <>
                          {" · "}
                          <a href={`mailto:${partner.email}`} className="text-neutral-300 underline">
                            {partner.email}
                          </a>
                        </>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {[partner.industry, partner.city, partner.state].filter(Boolean).join(" · ") ||
                        "no industry given"}
                      {partner.approxListSize ? ` · ~${partner.approxListSize} customers` : ""}
                      {` · joined ${ago(partner.createdAt, now)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${
                      partner.status === "ACTIVE"
                        ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                        : partner.status === "APPLIED"
                          ? "border-brand/40 bg-brand/10 text-ink"
                          : "border-white/15 text-neutral-400"
                    }`}
                  >
                    {partner.status}
                  </span>
                </div>

                {/* Whether they can actually get in. A partner still on their
                    text link is one lost phone away from losing the portal. */}
                <p className="mt-2 text-xs">
                  {partner.passwordHash ? (
                    <span className="text-brand-cyan">
                      Has a login
                      {partner.lastLoginAt
                        ? ` · last signed in ${ago(partner.lastLoginAt, now)}`
                        : " · never signed in"}
                    </span>
                  ) : (
                    <span className="text-neutral-400">
                      No password yet — still using the link we texted them
                    </span>
                  )}
                </p>

                {/* The numbers that decide whether this partner is working. */}
                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Customers", String(partner.leads.length)],
                    ["Sold", String(sold)],
                    ["Finished", String(completed)],
                    ["Paid out", formatFee(paid)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-white/10 p-2.5">
                      <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                        {label}
                      </dt>
                      <dd className="mt-0.5 font-mono text-lg font-bold text-ink">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {hasList ? (
                    <a
                      href={partner.customerListUrl ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-brand-cyan/40 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan"
                    >
                      Open their list ↗
                    </a>
                  ) : (
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-neutral-400">
                      No list shared
                    </span>
                  )}
                  {services.map((s) => (
                    <span
                      key={s.value}
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        s.status === "GATED"
                          ? "border-white/15 text-neutral-400"
                          : "border-white/15 text-neutral-200"
                      }`}
                      title={s.status === "GATED" ? "Not live — they asked for it" : undefined}
                    >
                      {s.label}
                      {s.status === "GATED" ? " (not live)" : ""}
                    </span>
                  ))}
                </div>

                {isStalled && (
                  <p className="mt-3 rounded-lg border border-brand/30 bg-brand/[0.08] px-3 py-2 text-xs text-ink">
                    Signed up {ago(partner.createdAt, now)} and hasn&apos;t sent anything. Worth a
                    call — this is where most of them go quiet.
                  </p>
                )}

                {partner.clientBase && (
                  <p className="mt-3 text-sm text-neutral-300">
                    <span className="text-neutral-400">Their customers: </span>
                    {partner.clientBase}
                  </p>
                )}
                {partner.notes && (
                  <p className="mt-1 text-sm text-neutral-400">{partner.notes}</p>
                )}

                <PartnerLinks
                  id={partner.id}
                  portalToken={partner.portalToken}
                  businessName={partner.businessName}
                  contactName={partner.contactName}
                  hasPassword={Boolean(partner.passwordHash)}
                />
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
