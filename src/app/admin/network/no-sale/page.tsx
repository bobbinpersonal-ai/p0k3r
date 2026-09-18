import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NoSaleForm, { type NoSaleLead } from "./NoSaleForm";

// Where a rep files why an appointment didn't close.
//
// Lives in admin rather than on a rep's own screen because there isn't a rep
// login yet — the admin cookie is the only real gate we have, and the choice
// is between this and an unauthenticated form writing the record a partner
// trusts. Move it when reps get accounts.

export const metadata = { title: "No-sale notes", robots: { index: false, follow: false } };

export default async function NoSalePage() {
  if (!isValidAdminSessionCookie(cookies().get(ADMIN_COOKIE_NAME)?.value)) redirect("/admin");

  // Anything that got as far as an appointment is fileable. SOLD is in the
  // list on purpose: a signed job that later falls apart is exactly the case
  // where a partner most wants to know what happened.
  const leads = await prisma.lead.findMany({
    where: { status: { in: ["APPOINTMENT_SET", "SOLD", "NO_SALE"] } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { noSaleReport: true, channelPartner: { select: { businessName: true } } },
  });

  const rows: NoSaleLead[] = leads.map((lead) => ({
    id: lead.id,
    customerName: lead.customerName,
    address: lead.address,
    partnerName: lead.channelPartner?.businessName ?? null,
    existing: lead.noSaleReport
      ? {
          reason: lead.noSaleReport.reason,
          detail: lead.noSaleReport.detail,
          filedBy: lead.noSaleReport.filedBy,
          quotedAmount: lead.noSaleReport.quotedAmount,
          customerAcknowledged: lead.noSaleReport.customerAcknowledged,
          revisitAt: lead.noSaleReport.revisitAt?.toISOString() ?? null,
        }
      : null,
  }));

  const unfiled = rows.filter((r) => !r.existing).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
        Internal · network
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">No-sale notes</h1>
      <p className="mt-2 max-w-2xl text-neutral-300">
        Every appointment that didn&apos;t close gets one. The partner who sent us that customer
        reads it word for word — it is the only way they can tell a lost deal from a skimmed
        one, and the program does not survive them wondering.
      </p>
      {unfiled > 0 && (
        <p className="mt-4 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm font-semibold text-ink">
          {unfiled} {unfiled === 1 ? "appointment has" : "appointments have"} no note yet.
        </p>
      )}
      <p className="mt-4 text-sm">
        <Link href="/admin/network/leads" className="text-brand-cyan hover:text-ink">
          ← All leads
        </Link>
      </p>

      <NoSaleForm leads={rows} />
    </main>
  );
}
