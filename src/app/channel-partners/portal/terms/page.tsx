import { redirect } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { prisma } from "@/lib/prisma";
import { requirePartnerSession } from "@/lib/partnerAccess";
import {
  CHANNEL_PARTNER_TERMS_VERSION,
  channelPartnerAgreement,
} from "@/lib/regions/channelPartnerAgreement";
import AcceptTerms from "./AcceptTerms";

// The click-wrap that stands between a partner and their portal.
//
// It shows the whole agreement rather than a link to one. A click-wrap where
// the terms are one tap away is a click-wrap most people never open, and the
// point of the exercise is that they read it.

export const metadata = { title: "Partner terms", robots: { index: false, follow: false } };

export default async function PartnerTermsPage() {
  const session = await requirePartnerSession();

  const partner = await prisma.channelPartner.findUnique({
    where: { id: session.id },
    select: {
      businessName: true,
      contactName: true,
      state: true,
      termsAcceptedAt: true,
      termsVersion: true,
    },
  });
  if (!partner) redirect("/channel-partners/login");

  // Already on the current version — nothing to do here.
  if (partner.termsAcceptedAt && partner.termsVersion === CHANNEL_PARTNER_TERMS_VERSION) {
    redirect("/channel-partners/portal");
  }

  const doc = channelPartnerAgreement({
    businessName: partner.businessName,
    contactName: partner.contactName,
    state: partner.state,
  });
  const updating = Boolean(partner.termsAcceptedAt);

  return (
    <>
      <NetworkHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-brand-cyan">
          {updating ? "Terms have changed" : "One thing first"}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">{doc.title}</h1>
        <p className="mt-2 text-neutral-300">
          {updating
            ? "We've changed these since you last agreed. Have a read and confirm to carry on."
            : "Short, and worth the two minutes. Your page opens as soon as you agree."}
        </p>

        {doc.warnings.map((w) => (
          <p
            key={w}
            className="mt-4 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm leading-relaxed text-ink"
          >
            {w}
          </p>
        ))}

        <div className="mt-8 space-y-6">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-ink">{section.heading}</h2>
              <p className="mt-1.5 whitespace-pre-line leading-relaxed text-neutral-300">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <AcceptTerms />

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Version {CHANNEL_PARTNER_TERMS_VERSION}
        </p>
      </main>
      <NetworkFooter />
    </>
  );
}
