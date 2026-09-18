import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCOUT_ROLE } from "@/lib/regions/scouts";

// Who applied to scout, newest first.
//
// Deliberately thin. There is nothing to approve here yet — a scout cannot be
// paid until partners carry which scout signed them, and that column does not
// exist. So this screen's only job is to stop applications landing somewhere
// nobody looks, which is how the /drive applicants got missed.

export const metadata = { title: "Scouts", robots: { index: false, follow: false } };

function ago(date: Date, now: number): string {
  const mins = Math.floor((now - date.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}

export default async function ScoutsAdminPage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  const scouts = await prisma.rep.findMany({
    where: { role: SCOUT_ROLE },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const now = Date.now();
  const applicants = scouts.filter((s) => s.status === "APPLIED").length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · network
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
        Scouts <span className="font-mono text-neutral-400">({scouts.length})</span>
      </h1>
      <p className="mt-2 max-w-2xl text-neutral-300">
        People who applied to sign businesses onto the partner network, from{" "}
        <Link href="/scouts" className="text-brand-cyan hover:text-ink">
          /scouts
        </Link>
        .
      </p>

      {applicants > 0 && (
        <p className="mt-4 rounded-xl border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-ink">
          {applicants} to call back
        </p>
      )}

      <p className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href="/admin/network/partners" className="text-brand-cyan hover:text-ink">
          Partners
        </Link>
        <Link href="/admin/network/pipeline" className="text-brand-cyan hover:text-ink">
          Pipeline
        </Link>
      </p>

      {scouts.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-300">
          Nobody has applied yet.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {scouts.map((s) => (
            <article key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="min-w-0">
                  <h2 className="font-bold text-ink">{s.name}</h2>
                  <p className="text-sm text-neutral-300">
                    <a
                      href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}
                      className="font-mono text-brand-cyan"
                    >
                      {s.phone}
                    </a>
                    {s.email ? (
                      <>
                        {" · "}
                        <a href={`mailto:${s.email}`} className="underline">
                          {s.email}
                        </a>
                      </>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {[s.city, s.source].filter(Boolean).join(" · ")} ·{" "}
                    {ago(s.createdAt, now)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                  {s.status}
                </span>
              </div>
              {s.experience && (
                <p className="mt-3 border-l-2 border-white/10 pl-3 text-sm leading-relaxed text-neutral-300">
                  {s.experience}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
