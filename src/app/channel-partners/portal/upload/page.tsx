import Link from "next/link";
import { redirect } from "next/navigation";
import NetworkHeader from "@/components/network/NetworkHeader";
import NetworkFooter from "@/components/network/NetworkFooter";
import { prisma } from "@/lib/prisma";
import { requirePartnerWithTerms } from "@/lib/partnerAccess";
import { TRACKS } from "@/lib/regions/warmup";
import UploadForm from "./UploadForm";

// Where a partner hands over the list.
//
// Behind the same terms gate as the portal — somebody uploading 1,400
// customers' contact details should have agreed to what we do with them first.

export const metadata = { title: "Upload your list", robots: { index: false, follow: false } };

export default async function UploadPage() {
  const session = await requirePartnerWithTerms();

  const partner = await prisma.channelPartner.findUnique({
    where: { id: session.id },
    select: { businessName: true, warmupTrack: true },
  });
  if (!partner) redirect("/channel-partners/login");

  return (
    <>
      <NetworkHeader />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <Link href="/channel-partners/portal" className="text-sm text-brand-cyan hover:text-ink">
          ← My page
        </Link>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-brand-cyan">
          {partner.businessName}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Upload your list</h1>
        <p className="mt-2 text-neutral-300">
          Customers you&apos;ve already done work for. We call them, sell the work you don&apos;t
          do, and you take half the profit on anything that sells.
        </p>

        <UploadForm
          tracks={TRACKS.map((t) => ({ value: t.value, label: t.label, blurb: t.blurb }))}
          currentTrack={partner.warmupTrack}
        />
      </main>
      <NetworkFooter />
    </>
  );
}
